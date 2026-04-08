# Supabase Sync Setup

## Goal

Enable cross-device sync for the main dashboard state by using one Supabase account per parent account.

## 1) Create table and policies

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.app_sync_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state_json jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_sync_state enable row level security;

drop policy if exists "sync_select_own" on public.app_sync_state;
create policy "sync_select_own"
on public.app_sync_state
for select
using (auth.uid() = user_id);

drop policy if exists "sync_insert_own" on public.app_sync_state;
create policy "sync_insert_own"
on public.app_sync_state
for insert
with check (auth.uid() = user_id);

drop policy if exists "sync_update_own" on public.app_sync_state;
create policy "sync_update_own"
on public.app_sync_state
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## 2) Configure built-in project credentials

The app now uses built-in Supabase credentials from `src/persistence/supabase-config.ts`.
If you need to switch project, update:

- `DEFAULT_SUPABASE_URL`
- `DEFAULT_SUPABASE_ANON_KEY` (publishable / anon public key)

## 3) Use in app

In app homepage:

1. Click top-right profile chip.
2. Fill account email + password.
3. Click `注册` (first time) or `登录`.
4. Use:
   - `上传本地到云端`
   - `下载云端到本地`
   - `双向同步` (recommended)

## Notes

- Current sync scope: `src/domain` main app state (`xiuxiuzhushou_v2_state`).
- Other local modules (height, morning-reading, interest, reading) are still local-only for now.
