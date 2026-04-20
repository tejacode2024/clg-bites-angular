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
  unavailable_items jsonb default '{}'
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

-- Allow public read access (customers need to read settings & coupons)
alter table admin_settings enable row level security;
alter table coupons enable row level security;

create policy "Public read admin_settings" on admin_settings for select using (true);
create policy "Public write admin_settings" on admin_settings for update using (true);
create policy "Public read coupons" on coupons for select using (true);
create policy "Public write coupons" on coupons for all using (true);

-- Enable realtime
alter publication supabase_realtime add table admin_settings;
alter publication supabase_realtime add table coupons;
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

## Step 6: Deploy Free on Vercel (Optional)

```bash
# Build
npm run build

# Deploy on Vercel (free)
npx vercel --prod
```

Or connect your GitHub repo to **https://vercel.com** for auto-deploy on every push.

---

## ✅ What's Free on Supabase (Spark Plan)

| Feature | Free Limit |
|---|---|
| Database | 500 MB |
| API requests | Unlimited |
| Realtime connections | 200 concurrent |
| Users | Unlimited |

More than enough for ClgBites! 🎉
