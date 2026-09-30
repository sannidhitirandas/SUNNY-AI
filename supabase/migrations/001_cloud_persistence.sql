-- Sunny AI cloud persistence
-- Run this once in the Supabase SQL Editor.

create table if not exists public.sunny_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_tone text not null default 'adaptive',
  interests jsonb not null default '[]'::jsonb,
  preferred_name text not null default 'Sunshine',
  memory_enabled boolean not null default true,
  notifications_enabled boolean not null default true,
  onboarding_completed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.sunny_chat_messages (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null default 'default-session',
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now(),
  delivery_status text not null default 'sent' check (delivery_status in ('sending', 'sent', 'failed')),
  is_demo_response boolean not null default false,
  model text,
  error_message text
);

create index if not exists sunny_chat_messages_user_session_created_idx
  on public.sunny_chat_messages(user_id, session_id, created_at);

create table if not exists public.sunny_memories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  category text not null check (category in ('personal', 'relationships', 'events', 'ongoing', 'preferences')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_confirmed boolean not null default false,
  source_session_id text,
  is_demo_data boolean not null default false
);

create index if not exists sunny_memories_user_updated_idx
  on public.sunny_memories(user_id, updated_at desc);

alter table public.sunny_preferences enable row level security;
alter table public.sunny_chat_messages enable row level security;
alter table public.sunny_memories enable row level security;

drop policy if exists "Users can read their Sunny preferences" on public.sunny_preferences;
create policy "Users can read their Sunny preferences"
  on public.sunny_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their Sunny preferences" on public.sunny_preferences;
create policy "Users can insert their Sunny preferences"
  on public.sunny_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their Sunny preferences" on public.sunny_preferences;
create policy "Users can update their Sunny preferences"
  on public.sunny_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their Sunny chat messages" on public.sunny_chat_messages;
create policy "Users can read their Sunny chat messages"
  on public.sunny_chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their Sunny chat messages" on public.sunny_chat_messages;
create policy "Users can insert their Sunny chat messages"
  on public.sunny_chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their Sunny chat messages" on public.sunny_chat_messages;
create policy "Users can update their Sunny chat messages"
  on public.sunny_chat_messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their Sunny chat messages" on public.sunny_chat_messages;
create policy "Users can delete their Sunny chat messages"
  on public.sunny_chat_messages for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read their Sunny memories" on public.sunny_memories;
create policy "Users can read their Sunny memories"
  on public.sunny_memories for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their Sunny memories" on public.sunny_memories;
create policy "Users can insert their Sunny memories"
  on public.sunny_memories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their Sunny memories" on public.sunny_memories;
create policy "Users can update their Sunny memories"
  on public.sunny_memories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their Sunny memories" on public.sunny_memories;
create policy "Users can delete their Sunny memories"
  on public.sunny_memories for delete
  using (auth.uid() = user_id);
