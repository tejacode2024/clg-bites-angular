# ⚡ Supabase Setup Guide for ClgBites Admin

## Step 1: Create Supabase Project

1. Go to **https://supabase.com** → Click **"Start your project"**
2. Sign up with GitHub (easiest) or email — **completely free, no card needed**
3. Click **"New project"**
4. Fill in:
   - **Name:** clgbites
   - **Database Password:** (set a strong password, save it)
   - **Region:** Southeast Asia (Singapore) — closest to India
5. Click **"Create new project"** — wait ~2 minutes

---

## Step 2: Create the Database Tables

1. In your project → click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. **Copy and paste this entire SQL** and click **"Run"**:

```sql
-- Table 1: Admin Settings (single row)
create table admin_settings (
  id integer primary key default 1,
  orders_accepting boolean default true,
  orders_off_message text default 'Orders are currently closed. Please check back later.',
  unavailable_restaurants text[] default '{}',
  unavailable_items jsonb default '{}',
  delivery_time text default '7:30-8:30',
  price_overrides jsonb default '{}'
);

-- Insert the default row
insert into admin_settings (id) values (1);

-- Table 2: Coupons
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent', 'flat')),
  value numeric not null,
  min_order numeric default 0,
  active boolean default true,
  description text default '',
  created_at timestamptz default now()
);

-- Table 3: Orders
-- IMPORTANT: id is an integer (NOT serial/identity) so we can set it to
-- the token number ourselves. token_number mirrors id for clarity.
create table orders (
  id integer primary key,            -- equals token_number
  token_number integer not null,     -- same as id; shown to customer / admin
  customer_name text,
  customer_phone text,
  items jsonb,
  payment_mode text default 'prepaid',
  total numeric default 0,
  pay_status text default 'pending',
  pending_amount numeric,
  deliver_status text default 'pending',
  created_at timestamptz default now(),
  delivered_at timestamptz
);

-- Table 4: Daily token counter (one row per calendar day)
-- Used by get_next_daily_token() to issue unique tokens atomically.
create table daily_token_counter (
  day date primary key,
  last_token integer not null default 0
);

-- ── Atomic token function ────────────────────────────────────────────────────
-- Returns a unique, ever-increasing token for today.
-- Two concurrent callers will NEVER get the same value because the UPDATE
-- uses a row-level lock (FOR UPDATE). This is the fix for duplicate tokens.
create or replace function get_next_daily_token()
returns integer
language plpgsql
as $$
declare
  today date := current_date;
  next_token integer;
begin
  -- Insert today's row if it doesn't exist yet, then lock and increment
  insert into daily_token_counter (day, last_token)
  values (today, 0)
  on conflict (day) do nothing;

  update daily_token_counter
  set    last_token = last_token + 1
  where  day = today
  returning last_token into next_token;

  return next_token;
end;
$$;

-- ── RLS Policies ─────────────────────────────────────────────────────────────
alter table admin_settings      enable row level security;
alter table coupons             enable row level security;
alter table orders              enable row level security;
alter table daily_token_counter enable row level security;

create policy "Public read admin_settings"  on admin_settings      for select using (true);
create policy "Public write admin_settings" on admin_settings      for update using (true);
create policy "Public read coupons"         on coupons             for select using (true);
create policy "Public write coupons"        on coupons             for all    using (true);
create policy "Public read orders"          on orders              for select using (true);
create policy "Public insert orders"        on orders              for insert with check (true);
create policy "Public update orders"        on orders              for update using (true);
create policy "Public delete orders"        on orders              for delete using (true);
create policy "Public read token counter"   on daily_token_counter for select using (true);
create policy "Public write token counter"  on daily_token_counter for all    using (true);

-- ── Realtime ─────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table admin_settings;
alter publication supabase_realtime add table coupons;
alter publication supabase_realtime add table orders;
```

---

## Step 3: Get Your API Keys

1. In left sidebar → click **"Project Settings"** (gear icon at bottom)
2. Click **"API"**
3. Copy two things:
   - **Project URL** (looks like: `https://abcxyzabc.supabase.co`)
   - **anon public** key (long JWT string under "Project API keys")

---

## Step 4: Paste into Angular Project

Open `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://abcxyzabc.supabase.co',   // ← your Project URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI...',  // ← your anon key
  },
  adminPassword: 'clgbites@admin2024',  // ← change this!
};
```

Do the same in `src/environments/environment.prod.ts`

---

## Step 5: Install & Run

```bash
npm install
npm start
```

Visit: **http://localhost:4200/admin/login**

Password: `clgbites@admin2024` (or whatever you set above)

---

## Step 6: If you already have an existing `orders` table

If your Supabase project already has an `orders` table (with `serial` or `identity` id),
run this migration instead:

```sql
-- 1. Drop the old auto-increment default on id (if any)
alter table orders alter column id drop default;
alter table orders alter column id type integer;

-- 2. Add token_number column if not already present
alter table orders add column if not exists token_number integer;

-- 3. Create the daily counter table
create table if not exists daily_token_counter (
  day date primary key,
  last_token integer not null default 0
);

-- 4. Create the atomic token function (same as above)
create or replace function get_next_daily_token()
returns integer language plpgsql as $$
declare
  today date := current_date;
  next_token integer;
begin
  insert into daily_token_counter (day, last_token) values (today, 0)
  on conflict (day) do nothing;
  update daily_token_counter set last_token = last_token + 1
  where day = today returning last_token into next_token;
  return next_token;
end;
$$;

-- 5. Add RLS for the new table
alter table daily_token_counter enable row level security;
create policy "Public write token counter" on daily_token_counter for all using (true);
```

---

## ✅ What's Free on Supabase (Spark Plan)

| Feature | Free Limit |
|---|---|
| Database | 500 MB |
| API requests | Unlimited |
| Realtime connections | 200 concurrent |
| Users | Unlimited |

More than enough for ClgBites! 🎉

---

## 🔑 Summary of Fixes Applied

| # | Bug | Fix |
|---|-----|-----|
| 1 | WhatsApp redirect blocked on iOS/Android | `window.open('', '_blank')` called synchronously during button click (before any `await`), then redirected after DB save |
| 2 | Two users can get the same token | `get_next_daily_token()` Postgres function uses row-level locking — atomically increments and returns a unique value |
| 3 | Duplicate token in WhatsApp message & only one order saved | Same root cause as #2; now fixed by atomic RPC call before insert |
| 4 | DB `id` does not match token number shown in admin | `id` is now set explicitly to `token_number` (integer primary key, no auto-increment) |