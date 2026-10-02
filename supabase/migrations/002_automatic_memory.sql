-- Automatic memory identity and optional expiry metadata.
-- Existing user_id-based RLS policies remain in force.

alter table public.sunny_memories
  add column if not exists memory_key text,
  add column if not exists expires_at timestamptz;

create unique index if not exists sunny_memories_user_memory_key_unique_idx
  on public.sunny_memories(user_id, memory_key);

create index if not exists sunny_memories_user_expiration_idx
  on public.sunny_memories(user_id, expires_at)
  where expires_at is not null;