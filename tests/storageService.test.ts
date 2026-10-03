import assert from 'node:assert/strict';
import test from 'node:test';
import { storageService } from '../src/services/storageService';

test('account cache cleanup preserves guest-only local data', async () => {
  await storageService.setItem(storageService.KEYS.USER_PREFERENCES, { preferredName: 'Account' });
  await storageService.setItem(storageService.KEYS.GUEST_PREFERENCES, { preferredName: 'Guest' });
  await storageService.setItem('@sunny_chat_messages_default-session', [{ id: 'account-chat' }]);
  await storageService.setItem('@sunny_guest_chat_messages_default-session', [{ id: 'guest-chat' }]);

  const cleared = await storageService.clearAccountCache();

  assert.equal(cleared, true);
  assert.deepEqual(await storageService.getItem(storageService.KEYS.USER_PREFERENCES, null), null);
  assert.deepEqual(await storageService.getItem('@sunny_chat_messages_default-session', null), null);
  assert.deepEqual(await storageService.getItem(storageService.KEYS.GUEST_PREFERENCES, null), { preferredName: 'Guest' });
  assert.deepEqual(await storageService.getItem('@sunny_guest_chat_messages_default-session', null), [{ id: 'guest-chat' }]);
});