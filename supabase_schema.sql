-- Pharm24: Supabase database schema
-- How to use: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run

-- 1. Medications table
create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null default 'other',
  in_stock boolean not null default true,   -- true = have it at home, false = need to buy
  quantity numeric,
  unit text default 'pcs',
  expiry_date date,
  notes text,
  created_at timestamptz not null default now()
);

-- 2. Enable row level security (each user only sees their own data)
alter table medications enable row level security;

-- 3. Policies: a user can only access their own rows
create policy "select_own_medications"
  on medications for select
  using (auth.uid() = user_id);

create policy "insert_own_medications"
  on medications for insert
  with check (auth.uid() = user_id);

create policy "update_own_medications"
  on medications for update
  using (auth.uid() = user_id);

create policy "delete_own_medications"
  on medications for delete
  using (auth.uid() = user_id);

-- 4. Index for fast per-user lookups
create index if not exists medications_user_id_idx on medications(user_id);
