# CLGBITES — Supabase Setup for User Login & Orders Features

Run these SQL statements in your **Supabase SQL Editor** (project → SQL Editor → New Query).

---

## 1. Create the `users` table

```sql
create table if not exists public.users (
  id         bigint generated always as identity primary key,
  name       text        not null,
  phone      text        not null,
  location   text        not null,
  created_at timestamptz not null default now()
);

-- Optional: index to speed up login lookups
create index if not exists users_phone_idx on public.users (phone);
```

---

## 2. Enable Row Level Security (RLS) on `users`

```sql
alter table public.users enable row level security;

-- Allow anyone (anon key) to SELECT (needed for login lookup)
create policy "Allow anon read"
  on public.users for select
  using (true);

-- Allow anyone (anon key) to INSERT (needed for new user registration)
create policy "Allow anon insert"
  on public.users for insert
  with check (true);
```

> **Note:** These policies are intentionally open because CLGBITES uses the
> anon key on a campus app without auth sessions. If you want tighter security
> later, you can restrict by phone or add Supabase Auth.

---

## 3. Verify the `orders` table has `customer_phone` column

The new "My Orders" feature fetches orders by phone number. Make sure your
`orders` table has this column (it should already if you followed the original
SUPABASE_SETUP.md):

```sql
-- Run this only if the column is missing
alter table public.orders add column if not exists customer_phone text;

-- Index for fast per-user order lookups
create index if not exists orders_phone_idx on public.orders (customer_phone);
```

---

## 4. Confirm RLS on `orders` allows anon reads (for user order history)

```sql
-- Check existing policies
select policyname, cmd from pg_policies where tablename = 'orders';

-- If there's no SELECT policy for anon, add one:
create policy "Allow anon select"
  on public.orders for select
  using (true);
```

---

## 5. Quick verification

After running the above, test in the SQL Editor:

```sql
-- Should return 0 rows (empty) with no error
select * from public.users limit 5;

-- Should return your existing orders
select id, customer_name, customer_phone, token_number from public.orders limit 5;
```

---

## Summary of what changed in the app

| Feature | How it works |
|---|---|
| **Login screen** | User enters name + phone + location. App checks `users` table — returns existing row or inserts new one. Session stored in `sessionStorage`. |
| **Checkout** | "Proceed to Checkout" → 30-second countdown timeline. User can cancel or click "Place Order Now". Order saved to `orders` table with atomic token via `get_next_daily_token()` RPC. |
| **Order confirmed page** | Shows token number (= order ID), delivery location, payment mode. |
| **My Orders tab** | Fetches all orders from `orders` table where `customer_phone` matches the logged-in user's phone. |
| **Profile page** | Shows user name, phone, location from login. Includes sign-out button. |
