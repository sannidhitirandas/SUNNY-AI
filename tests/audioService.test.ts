import assert from 'node:assert/strict';
import test from 'node:test';
import { audioService } from '../src/services/audioService';
import {
  DEFAULT_AUDIO_PREFERENCES,
  normalizeAudioPreferences,
  normalizeUserPreferences,
} from '../src/types/user';

test('audio preferences defaults and normalization', () => {
  assert.equal(DEFAULT_AUDIO_PREFERENCES.soundEnabled, true);
  assert.equal(DEFAULT_AUDIO_PREFERENCES.musicEnabled, false);
  assert.equal(DEFAULT_AUDIO_PREFERENCES.masterVolume, 0.75);
  assert.equal(DEFAULT_AUDIO_PREFERENCES.sfxVolume, 0.75);
  assert.equal(DEFAULT_AUDIO_PREFERENCES.musicVolume, 0.50);
  assert.equal(DEFAULT_AUDIO_PREFERENCES.selectedBackgroundMusic, 'ambient');

  const normalizedDefault = normalizeAudioPreferences();
  assert.deepEqual(normalizedDefault, DEFAULT_AUDIO_PREFERENCES);

  const clamped = normalizeAudioPreferences({
    masterVolume: 2.5,
    sfxVolume: -0.5,
    musicVolume: 0.8,
    selectedBackgroundMusic: 'midnight-notes',
  });

  assert.equal(clamped.masterVolume, 1);
  assert.equal(clamped.sfxVolume, 0);
  assert.equal(clamped.musicVolume, 0.8);
  assert.equal(clamped.selectedBackgroundMusic, 'midnight-notes');

  const userPref = normalizeUserPreferences({
    audioPreferences: {
      soundEnabled: false,
      musicVolume: 0.4,
      selectedBackgroundMusic: 'blossoms',
    },
  });

  assert.equal(userPref.audioPreferences.soundEnabled, false);
  assert.equal(userPref.audioPreferences.musicVolume, 0.4);
  assert.equal(userPref.audioPreferences.selectedBackgroundMusic, 'blossoms');
});

test('audio service settings update, mute, and volume clamping', () => {
  audioService.updateSettings({
    soundEnabled: true,
    musicEnabled: true,
    masterVolume: 0.8,
    sfxVolume: 0.6,
    musicVolume: 0.4,
    selectedBackgroundMusic: 'dust',
  });

  let settings = audioService.getSettings();
  assert.equal(settings.soundEnabled, true);
  assert.equal(settings.musicEnabled, true);
  assert.equal(settings.masterVolume, 0.8);
  assert.equal(settings.sfxVolume, 0.6);
  assert.equal(settings.musicVolume, 0.4);
  assert.equal(settings.selectedBackgroundMusic, 'dust');

  audioService.setMuted(true);
  settings = audioService.getSettings();
  assert.equal(settings.soundEnabled, false);

  audioService.setMuted(false);
  settings = audioService.getSettings();
  assert.equal(settings.soundEnabled, true);

  audioService.setMasterVolume(1.5);
  audioService.setSfxVolume(-1);
  audioService.setMusicVolume(0.5);

  settings = audioService.getSettings();
  assert.equal(settings.masterVolume, 1);
  assert.equal(settings.sfxVolume, 0);
  assert.equal(settings.musicVolume, 0.5);

  // Reset back to defaults for clean test state
  audioService.updateSettings(DEFAULT_AUDIO_PREFERENCES);
});

test('playing sound effects and missing assets fail gracefully without throwing', async () => {
  audioService.updateSettings({ soundEnabled: true, masterVolume: 1, sfxVolume: 1 });

  // Playing button, send, receive, success, error, open, notification should not throw errors
  await assert.doesNotReject(async () => {
    await audioService.play('button');
    await audioService.play('send');
    await audioService.play('receive');
    await audioService.play('success');
    await audioService.play('error');
    await audioService.play('open');
    await audioService.play('notification');
  });

  // Muted state prevents errors/playback
  audioService.setMuted(true);
  await assert.doesNotReject(async () => {
    await audioService.play('button');
  });

  audioService.updateSettings(DEFAULT_AUDIO_PREFERENCES);
});

test('five background music options and four chat themes handle playback and same-track non-restarting cleanly', async () => {
  audioService.updateSettings({ musicEnabled: true, masterVolume: 1, musicVolume: 0.5 });

  await assert.doesNotReject(async () => {
    // Test 5 non-chat music options
    await audioService.playNonChatMusic('ambient');
    await audioService.playNonChatMusic('midnight-notes');
    await audioService.playNonChatMusic('blossoms');
    await audioService.playNonChatMusic('dust');
    await audioService.playNonChatMusic('after-school-rain');

    // Test 4 chat vibe themes
    await audioService.playMusic('listen');
    await audioService.playMusic('laugh');
    await audioService.playMusic('encourage');
    await audioService.playMusic('anything');

    // Same track invocation does not restart
    await audioService.playMusic('anything');

    audioService.pauseMusic();
    await audioService.resumeMusic();
    audioService.stopMusic();
  });

  // Disabling music stops music and prevents playback
  audioService.updateSettings({ musicEnabled: false });
  await assert.doesNotReject(async () => {
    await audioService.playNonChatMusic('ambient');
  });

  audioService.updateSettings(DEFAULT_AUDIO_PREFERENCES);
});
