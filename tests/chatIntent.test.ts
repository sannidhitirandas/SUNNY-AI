import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getIntentInstructions,
  isStarterIntent,
  resolveStarterIntent,
  getIntentForPersonalityTone,
  getPersonalityToneForIntent,
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
  assert.match(guidance[0], /Do not rush to advice, solutions/);
  assert.match(guidance[1], /light banter, silly questions, and occasional original jokes/);
  assert.match(guidance[2], /grounded cheerleader, not a motivational speaker/);
  assert.match(guidance[3], /Read the moment instead of mechanically combining/);
  assert.match(guidance[3], /If the user is sharing something painful, listen first/);
  assert.match(guidance[3], /If they need help, be useful and clear/);
  assert.match(guidance[3], /Do not turn every exchange into advice, emotional analysis, a list, or a question/);
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

test('the four companion choices map one-to-one to the saved personality preference', () => {
  const pairs = [
    ['listen', 'gentle'],
    ['laugh', 'playful'],
    ['encourage', 'calm'],
    ['anything', 'adaptive'],
  ] as const;

  for (const [intent, tone] of pairs) {
    assert.equal(getPersonalityToneForIntent(intent), tone);
    assert.equal(getIntentForPersonalityTone(tone), intent);
  }
});
