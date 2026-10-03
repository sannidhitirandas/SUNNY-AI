-- Persist audio preferences for authenticated users.

alter table public.sunny_preferences
  add column if not exists audio_preferences jsonb not null default '{
    "soundEnabled": true,
    "musicEnabled": false,
    "masterVolume": 1,
    "sfxVolume": 1,
    "musicVolume": 0.25
  }'::jsonb;
