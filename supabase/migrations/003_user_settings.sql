-- Persist theme and notification preferences for authenticated users.

alter table public.sunny_preferences
  add column if not exists theme text not null default 'sunny-dark',
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;

alter table public.sunny_preferences
  drop constraint if exists sunny_preferences_theme_check;

alter table public.sunny_preferences
  add constraint sunny_preferences_theme_check
  check (theme in ('sunny-dark', 'sunny-light'));