import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChatMessage, StarterIntent } from '../src/types/chat';
import {
  createVibeStarterMessage,
  getVibeStarterText,
  nextVibeStarterTimestamp,
  normalizeHydratedVibeStarters,
  replaceVibeStarterMessages,
} from '../src/lib/vibeStarterMessages';

const intents: StarterIntent[] = ['listen', 'laugh', 'encourage', 'anything'];

const message = (id: string, content: string, role: ChatMessage['role'] = 'assistant'): ChatMessage => ({
  id,
  sessionId: 'default-session',
  role,
  content,
  createdAt: '2026-10-02T00:00:00.000Z',
  deliveryStatus: 'sent',
});

test('one vibe selection adds exactly its selected starter and preserves real chat', () => {
  const existing = [message('user-1', 'I had a long day.', 'user')];
  const selected = createVibeStarterMessage('listen', 'starter-listen-1', '2026-10-02T00:00:01.000Z');
  const result = replaceVibeStarterMessages(existing, selected);
  const starters = result.messages.filter((item) => intents.some((intent) => getVibeStarterText(intent) === item.content));

  assert.equal(starters.length, 1);
  assert.equal(starters[0].content, getVibeStarterText('listen'));
  assert.deepEqual(result.messages[0], existing[0]);
  for (const intent of intents.filter((item) => item !== 'listen')) {
    assert.equal(starters.some((item) => item.content === getVibeStarterText(intent)), false);
  }
});

test('choosing another vibe replaces old canned starters without removing real messages', () => {
  const existing = [
    message('user-1', 'I had a long day.', 'user'),
    ...intents.slice(0, 3).map((intent, index) => message(`old-${index}`, getVibeStarterText(intent))),
    message('assistant-1', 'That sounds like a lot.'),
  ];
  const selected = createVibeStarterMessage('laugh', 'starter-laugh-2', '2026-10-02T00:00:02.000Z');
  const result = replaceVibeStarterMessages(existing, selected);

  assert.deepEqual(result.removedIds, ['old-0', 'old-1', 'old-2']);
  assert.equal(result.messages.length, 3);
  assert.equal(result.messages.filter((item) => intents.some((intent) => getVibeStarterText(intent) === item.content)).length, 1);
  assert.equal(result.messages[1].content, 'That sounds like a lot.');
});

test('reselecting the same vibe leaves exactly one selected starter', () => {
  const first = createVibeStarterMessage('laugh', 'starter-laugh-1', '2026-10-02T00:00:01.000Z');
  const second = createVibeStarterMessage('laugh', 'starter-laugh-2', '2026-10-02T00:00:02.000Z');
  const once = replaceVibeStarterMessages([], first).messages;
  const twice = replaceVibeStarterMessages(once, second).messages;

  assert.equal(twice.filter((item) => item.content === getVibeStarterText('laugh')).length, 1);
  assert.equal(twice[0].id, 'starter-laugh-2');
});

test('opening Chat normally does not create a vibe starter', () => {
  const history = [message('welcome-msg-1', 'Hey, sunshine! What is on your mind?')];
  const hydrated = normalizeHydratedVibeStarters(history);

  assert.deepEqual(hydrated, history);
  assert.equal(hydrated.some((item) => intents.some((intent) => getVibeStarterText(intent) === item.content)), false);
});

test('hydrated history deduplicates repeated canned starters and preserves real messages', () => {
  const starter = getVibeStarterText('listen');
  const history = [
    message('user-1', 'I had a long day.', 'user'),
    message('starter-1', starter),
    message('assistant-1', 'Tell me more.'),
    message('starter-2', starter),
  ];
  const hydrated = normalizeHydratedVibeStarters(history);

  assert.deepEqual(hydrated.map((item) => item.id), ['user-1', 'assistant-1', 'starter-2']);
});

test('new starter timestamp sorts after hydrated messages even in the same millisecond', () => {
  const existing = [message('existing', 'A real message', 'user')];
  const timestamp = nextVibeStarterTimestamp(existing, Date.parse(existing[0].createdAt));
  assert.equal(Date.parse(timestamp), Date.parse(existing[0].createdAt) + 1);
});