import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChatMessage, StarterIntent } from '../src/types/chat';
import {
  applyChatEntry,
  createNormalChatGreeting,
  NORMAL_CHAT_GREETING,
} from '../src/lib/chatEntry';
import {
  createVibeStarterMessage,
  getVibeStarterText,
  isVibeStarterMessage,
} from '../src/lib/vibeStarterMessages';

const intents: StarterIntent[] = ['listen', 'laugh', 'encourage', 'anything'];
const timestamp = '2026-10-02T00:00:00.000Z';

const realMessage: ChatMessage = {
  id: 'user-1',
  sessionId: 'default-session',
  role: 'user',
  content: 'I had a long day.',
  createdAt: timestamp,
  deliveryStatus: 'sent',
};

const generated = (id: string) => createNormalChatGreeting(id, timestamp);

test('normal Home Talk and bottom Chat entry resolve to the generic greeting', () => {
  const normal = { source: 'normal' } as const;
  const homeEntry = applyChatEntry([], normal, generated('normal-home'));
  const tabEntry = applyChatEntry([], normal, generated('normal-tab'));

  assert.equal(homeEntry.messages.length, 1);
  assert.equal(homeEntry.messages[0].content, NORMAL_CHAT_GREETING);
  assert.equal(tabEntry.messages.length, 1);
  assert.equal(tabEntry.messages[0].content, NORMAL_CHAT_GREETING);
});

test('each explicit vibe entry adds only its matching vibe starter', () => {
  for (const selectedVibe of intents) {
    const result = applyChatEntry(
      [],
      { source: 'vibe', selectedVibe },
      generated(`vibe-${selectedVibe}`)
    );
    assert.equal(result.messages.length, 1);
    assert.equal(result.messages[0].content, getVibeStarterText(selectedVibe));
    assert.equal(result.messages[0].content === NORMAL_CHAT_GREETING, false);
    assert.equal(isVibeStarterMessage(result.messages[0]), true);
  }
});

test('vibe entry replaces generic or unrelated starters and preserves real messages', () => {
  const history = [
    generated('generic'),
    realMessage,
    createVibeStarterMessage('anything', 'old-vibe', timestamp),
  ];
  const result = applyChatEntry(
    history,
    { source: 'vibe', selectedVibe: 'listen' },
    generated('new-vibe')
  );

  assert.deepEqual(result.messages.map((message) => message.id), ['user-1', 'new-vibe']);
  assert.equal(result.messages.some((message) => message.content === NORMAL_CHAT_GREETING), false);
  assert.equal(result.messages.filter(isVibeStarterMessage).length, 1);
});

test('normal entry does not append vibe starters or repeat a greeting after real chat exists', () => {
  const history = [createVibeStarterMessage('listen', 'listen-1', timestamp), realMessage];
  const result = applyChatEntry(history, { source: 'normal' }, generated('unwanted-greeting'));
  assert.deepEqual(result.messages, history);
  assert.equal(result.messages.some((message) => message.id === 'unwanted-greeting'), false);
});

test('repeated entry and hydration do not duplicate canned starters', () => {
  const first = applyChatEntry([], { source: 'vibe', selectedVibe: 'laugh' }, generated('laugh-1'));
  const second = applyChatEntry(first.messages, { source: 'vibe', selectedVibe: 'laugh' }, generated('laugh-2'));
  const hydrated = applyChatEntry(second.messages, { source: 'vibe', selectedVibe: 'laugh' }, generated('laugh-3'));

  assert.equal(second.changed, false);
  assert.equal(hydrated.changed, false);
  assert.equal(hydrated.messages.length, 1);
  assert.equal(hydrated.messages[0].id, 'laugh-1');
});

test('switching vibes replaces the previous starter without adding unrelated vibes', () => {
  const listen = applyChatEntry([], { source: 'vibe', selectedVibe: 'listen' }, generated('listen'));
  const laugh = applyChatEntry(listen.messages, { source: 'vibe', selectedVibe: 'laugh' }, generated('laugh'));

  assert.equal(laugh.messages.length, 1);
  assert.equal(laugh.messages[0].content, getVibeStarterText('laugh'));
  assert.equal(laugh.messages.some((message) => message.content === getVibeStarterText('listen')), false);
});