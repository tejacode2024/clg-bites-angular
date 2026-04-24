# CLGBITES — New Features Setup Guide

## What Changed

### New Features Added
1. **User Login System** — Name + Phone + Location login (no password). Supabase `users` table stores profiles.
2. **Proceed to Checkout** — Replaced the "Order on WhatsApp" button with a proper checkout flow.
3. **30-Second Cancel Window** — After clicking checkout, a countdown timer lets users cancel or place immediately.
4. **Order Confirmed Page** — Shows token number, order ID, delivery info, and payment method after order is saved.
5. **My Orders Page** — Users can view all their past orders fetched from Supabase by phone number.
6. **Header Updates** — Drawer now shows user name/phone/location and a logout button. "My Orders" link added.

### Files Added
```
src/app/services/user.service.ts               ← Login/register via Supabase
src/app/guards/user.guard.ts                   ← Redirects to /login if not logged in
src/app/pages/user-login/user-login.component.ts
src/app/pages/order-confirm/order-confirm.component.ts
src/app/pages/my-orders/my-orders.component.ts
src/app/components/checkout-timeline/checkout-timeline.component.ts
USERS_TABLE_SQL.sql                            ← Run this in Supabase first!
```

### Files Modified
```
src/app/app.routes.ts                          ← New routes added
src/app/pages/cart/cart.component.ts           ← WhatsApp → Checkout Timeline flow
src/app/components/app-header/app-header.component.ts  ← My Orders + logout in drawer
```

---

## Step 1 — Run the SQL in Supabase

1. Go to [supabase.com](https://supabase.com) → your project
2. Click **SQL Editor** in the sidebar
3. Paste the contents of `USERS_TABLE_SQL.sql` and click **Run**

---

## Step 2 — Install & Run

```bash
npm install
npm start
```

---

## How the New Flow Works

### User Login
- User opens site → redirected to `/login`
- Enters name, phone number, and selects location
- If phone exists in `users` table → profile retrieved and updated
- If phone is new → new row inserted into `users` table
- Session stored in `sessionStorage` (clears when tab closes)

### Checkout Flow
```
Cart → "Proceed to Checkout" 
     → Checkout Timeline (30s countdown + order preview)
     → [Cancel: back to cart] OR [Place Now / 30s elapsed]
     → Order saved to `orders` table in Supabase
     → Token assigned via get_next_daily_token() RPC
     → Redirect to /order-confirm
```

### My Orders
- Available via `/my-orders` or the drawer menu
- Fetches all orders from `orders` table filtered by `customer_phone`
- Shows token number, status, items, payment mode

---

## No Changes To
- ✅ Menu data (all restaurants and items preserved)
- ✅ Admin dashboard and admin login
- ✅ Coupon system
- ✅ Supabase orders table structure
- ✅ Token number RPC (`get_next_daily_token`)
- ✅ Floating cart bar, emoji animations
- ✅ Category filters, search
