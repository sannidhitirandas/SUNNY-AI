import assert from 'node:assert/strict';
import test from 'node:test';
import type { Memory } from '../src/types/memory';
import {
  loadMemoriesSafely,
  mergeAutomaticMemories,
  onlyMemoriesForUser,
  parseAutomaticMemoryCandidates,
  removeMemoryById,
  selectGuestMemoriesToImport,
  selectRelevantMemories,
} from '../src/services/automaticMemory';
import { storageService } from '../src/services/storageService';

const existingMemory: Memory = {
  id: 'memory-1',
  userId: 'user-1',
  title: 'Career goal',
  content: 'I am exploring a career change into design.',
  category: 'ongoing',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  userConfirmed: false,
  memoryKey: 'ongoing:career-goal',
};

test('extracts confirmed facts and matches an existing memory for correction', () => {
  const candidates = parseAutomaticMemoryCandidates(
    JSON.stringify({
      memories: [{
        confirmed: true,
        key: existingMemory.memoryKey,
        existingMemoryId: 'memory-1',
        title: 'Career goal',
        content: 'I have decided to pursue product design.',
        category: 'ongoing',
      }],
    }),
    [existingMemory]
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].existingMemoryId, 'memory-1');
  const merged = mergeAutomaticMemories([existingMemory], candidates, 'user-1', 'session-2');
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, existingMemory.id);
  assert.equal(merged[0].content, 'I have decided to pursue product design.');
});

test('rejects uncertain, sensitive, malformed, and duplicate candidates', () => {
  const candidates = parseAutomaticMemoryCandidates(JSON.stringify({ memories: [
    { confirmed: false, key: 'job', title: 'Job', content: 'Maybe changing jobs.', category: 'ongoing' },
    { confirmed: true, key: 'password', title: 'Password', content: 'My password is secret.', category: 'personal' },
    { confirmed: true, key: 'hobby', title: 'Hobby', content: 'I enjoy hiking.', category: 'preferences' },
    { confirmed: true, key: 'hobby', title: 'Hobby', content: 'I enjoy hiking.', category: 'preferences' },
  ] }));

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].key, 'hobby');
  assert.deepEqual(parseAutomaticMemoryCandidates('not json'), []);
});

test('merges retry duplicates and keeps guest/account ownership separate', () => {
  const candidates = parseAutomaticMemoryCandidates(JSON.stringify({ memories: [{
    confirmed: true,
    key: 'favorite music',
    title: 'Music preference',
    content: 'I enjoy jazz.',
    category: 'preferences',
  }] }));
  const guestMemory = mergeAutomaticMemories([], candidates, 'guest', 'guest-session', '2025-01-01T00:00:00.000Z');
  const accountMemory = mergeAutomaticMemories([], candidates, 'user-2', 'account-session', '2025-01-01T00:00:00.000Z');
  const retriedGuestMemory = mergeAutomaticMemories(guestMemory, candidates, 'guest', 'guest-session', '2025-01-02T00:00:00.000Z');

  assert.equal(guestMemory[0].userId, 'guest');
  assert.equal(accountMemory[0].userId, 'user-2');
  assert.equal(retriedGuestMemory.length, 1);
  assert.equal(retriedGuestMemory[0].id, guestMemory[0].id);
});

test('retrieves only relevant and unexpired memories', () => {
  const memories = [
    { ...existingMemory, expiresAt: undefined },
    { ...existingMemory, id: 'unrelated', title: 'Favorite food', content: 'I love dumplings.', memoryKey: 'preferences:food' },
    { ...existingMemory, id: 'expired', title: 'Design interview', content: 'I have an interview about design.', expiresAt: '2020-01-01T00:00:00.000Z' },
  ];

  const relevant = selectRelevantMemories(memories, 'How is my design career going?');
  assert.deepEqual(relevant.map((memory) => memory.id), ['memory-1']);
});

test('isolates retrieval results to the authenticated user', () => {
  const otherAccountMemory = { ...existingMemory, id: 'memory-2', userId: 'user-2' };
  assert.deepEqual(
    onlyMemoriesForUser([existingMemory, otherAccountMemory], 'user-1').map((memory) => memory.id),
    ['memory-1']
  );
});

test('deletes only the selected memory', () => {
  const remaining = removeMemoryById(
    [existingMemory, { ...existingMemory, id: 'memory-2' }],
    'memory-1'
  );
  assert.deepEqual(remaining.map((memory) => memory.id), ['memory-2']);
});

test('keeps chat memory retrieval non-fatal when storage fails', async () => {
  const result = await loadMemoriesSafely<Memory[]>(async () => {
    throw new Error('offline');
  });
  assert.deepEqual(result.memories, []);
  assert.equal(result.available, false);
  assert.ok(result.error instanceof Error);
});

test('hydrates guest memories from local storage on a fresh service read', async () => {
  const values = new Map<string, string>();
  const localStorage = {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key: string) { return values.get(key) ?? null; },
    key(index: number) { return [...values.keys()][index] ?? null; },
    removeItem(key: string) { values.delete(key); },
    setItem(key: string, value: string) { values.set(key, value); },
  } as Storage;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  });

  try {
    localStorage.setItem(storageService.KEYS.GUEST_MEMORIES, JSON.stringify([existingMemory]));
    const restored = await storageService.getItem<Memory[]>(storageService.KEYS.GUEST_MEMORIES, []);
    assert.equal(restored[0].id, existingMemory.id);
    assert.equal(restored[0].content, existingMemory.content);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('guest import skips account duplicates and preserves account versions', () => {
  const guestMemories = [
    { ...existingMemory, userId: 'guest' },
    {
      ...existingMemory,
      id: 'guest-new',
      userId: 'guest',
      title: 'Favorite activity',
      content: 'I enjoy hiking.',
      category: 'preferences' as const,
      memoryKey: 'preferences:favorite-activity',
    },
  ];
  const accountMemories = [{
    ...existingMemory,
    content: 'I am already pursuing product design.',
  }];

  const selected = selectGuestMemoriesToImport(guestMemories, accountMemories);
  assert.deepEqual(selected.map((memory) => memory.id), ['guest-new']);
  assert.equal(accountMemories[0].content, 'I am already pursuing product design.');
});