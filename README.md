# 🏪 Smart Shop v3 — Vercel Native

## 📋 Vercel Setup (Mobile-Friendly & Automated)

### Step 1: Create Account
1. Open **Chrome/Safari** on your device
2. Go to **https://vercel.com/signup**
3. Select **Continue with GitHub** and authorize your account.

### Step 2: Deploy Frontend & Serverless API (All-in-One)
Since we are using **Vercel**, both your high-performance Vite React frontend and Node.js serverless API are deployed instantly as a single cohesive unified app!

1. Go to the **Vercel Dashboard** → Click **"Add New"** → **"Project"**
2. Import the `Smartshop` repository from your GitHub.
3. Configure the Project Settings:
   - **Framework Preset**: select **Vite** or let Vercel auto-detect it.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the following **Environment Variables** in the project settings:
   - `VITE_API_URL`: `https://your-project-name.vercel.app/api`
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot Token for notification dispatches
5. Click **"Deploy"**!

Your application will be live in under 2 minutes at `https://your-project-name.vercel.app` 🎉

### Step 3: Serverless Cron Jobs (Bi-weekly & Daily Subscriptions)
Vercel Hobby accounts restrict cron schedules to at most once per day. To accommodate daily subscription expirations, a serverless Cron Job is configured in `vercel.json` and runs every night at midnight to safely process renewals:
- **Cron Endpoint:** `/api/cron/subscriptions`
- **Schedule:** `"0 0 * * *"` (Daily at midnight)

---

## 🚀 What's Built

### Frontend & Serverless Backend — Unified Platform ✅
- **Vite + React + shadcn/ui + Tailwind + TypeScript**
- **API Engine (`api/index.ts`)**: Built natively inside Node.js on Vercel's serverless edge.
- **Pages**: Home, Shop, Product, Cart, Wishlist, Orders, OrderDetail, Profile, Checkout, Confirmation, GiftCards, Compare, Tracking, Admin, Vendor, Subscriptions
- **40+ Core Features**: AI Recommendations, Follow Shops, Price Alerts, Q&A, Invoices, Multi-Vendor Cart, etc.
- **5 Languages**: Amharic, English, Oromoo, Tigrinya, Somali
- **Theme customizer** and mobile-responsive WebApp design.

### Admin Panel (`src/pages/admin/AdminPanel.tsx`) — Phase 3 ✅
- **shadcn/ui design system**
- 10 tabs: Dashboard, Products, Orders, Vendors, Marketplace, Coupons, Disputes, Subscriptions, Audit, Settings
- Full CRUD for products, vendors, coupons, and subscription goods.
- Platform commission controller.

---

## 💰 Cost: $0/month (Hobby Friendly)

| Layer | Service | Cost |
|-------|---------|------|
| Frontend | Vercel Platform | FREE (unlimited bandwidth) |
| Backend | Vercel Serverless Functions | FREE (100k req/day) |
| Database | Supabase DB | FREE (500MB) |
| Images | Supabase Storage | FREE (1GB) |

---

## 🗺️ All 50+ Features

### 🧠 AI & Personalization
- 🤖 AI Recommendations (browsing-based)
- 📉 Price Drop Alerts
- 👥 "Also Bought Together"

### 🛒 Shopping
- 🏪 Multi-Vendor Cart (grouped by seller)
- ⚡ Express Checkout
- 💳 Saved Payment Methods
- 🚚 Delivery Estimates
- 🔥 Flash Sales Timer
- 💼 Sponsored Products
- 📊 Product Comparison
- 🔔 Stock Notifications

### 💬 Social
- ❓ Product Q&A
- 🏪 Follow Shops
- 📤 Share Products
- ⭐ Seller Ratings

### 📄 Account
- 📄 Invoice Generation
- 🎁 Digital Gift Cards
- 🚨 Abandoned Cart Recovery
- 🏆 Loyalty Tiers with Benefits
- 📈 Price History Charts

### ⚙️ Admin (shadcn/ui)
- 📊 Dashboard with analytics
- 📦 Product CRUD with edit modal
- 📋 Order lifecycle management
- 🏪 Vendor approval/suspend
- 🚀 Marketplace (Flash, Sponsored, Bundles)
- 🏷️ Coupon manager
- ⚖️ Dispute center
- 📦 Subscription manager
- 📋 Audit log
- ⚙️ Settings (commission rates, store config)
