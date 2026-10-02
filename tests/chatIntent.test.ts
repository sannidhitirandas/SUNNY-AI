import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getIntentInstructions,
  isStarterIntent,
  resolveStarterIntent,
} from '../src/lib/chatIntent';
import { createChatRequestBody } from '../src/lib/chatRequest';

const intents = ['listen', 'laugh', 'encourage', 'anything'] as const;

test('backend intent allowlist accepts only the four supported intents', () => {
  for (const intent of intents) assert.equal(isStarterIntent(intent), true);
  for (const invalid of ['support', 'LISTEN', '', null, undefined, 1]) {
    assert.equal(isStarterIntent(invalid), false);
  }
});

test('each intent has distinct behavioral guidance', () => {
  const guidance = intents.map((intent) => getIntentInstructions(intent));
  assert.match(guidance[0], /Listen and understand before offering solutions/);
  assert.match(guidance[1], /jokes, silly questions, interesting facts, or little games/);
  assert.match(guidance[2], /realistic encouragement without forced positivity/);
  assert.match(guidance[3], /Listen empathetically and understand first/);
  assert.match(guidance[3], /Be playful, funny, curious, or entertaining/);
  assert.match(guidance[3], /genuine encouragement and practical support/);
  assert.match(guidance[3], /Do not force listening, humor, or encouragement into every response/);
  assert.equal(new Set(guidance).size, intents.length);
});

test('normal chat and Anything resolve to the same adaptive behavior', () => {
  const normalIntent = resolveStarterIntent(undefined);
  const anythingIntent = resolveStarterIntent('anything');

  assert.equal(normalIntent, anythingIntent);
  assert.equal(
    getIntentInstructions(normalIntent),
    getIntentInstructions(anythingIntent)
  );
});

test('chat request keeps selected intent distinct from preferred tone', () => {
  const body = createChatRequestBody({
    message: 'Hello',
    history: [{ role: 'user', content: 'Hello' }],
    tone: 'calm',
    intent: 'laugh',
    memoryEnabled: true,
    memories: [],
    sessionId: 'default-session',
  });

  assert.equal(body.intent, 'laugh');
  assert.equal(body.preferredTone, 'calm');
  const normalChatBody = createChatRequestBody({
    message: 'Hello',
    history: [],
    tone: 'adaptive',
    intent: null,
    memoryEnabled: true,
    memories: [],
    sessionId: 'default-session',
  });
  const anythingCardBody = createChatRequestBody({
    message: 'Hello',
    history: [],
    tone: 'adaptive',
    intent: 'anything',
    memoryEnabled: true,
    memories: [],
    sessionId: 'default-session',
  });

  assert.equal('intent' in normalChatBody, false);
  assert.equal(anythingCardBody.intent, 'anything');
  assert.equal(
    getIntentInstructions(resolveStarterIntent(normalChatBody.intent)),
    getIntentInstructions(resolveStarterIntent(anythingCardBody.intent))
  );
});