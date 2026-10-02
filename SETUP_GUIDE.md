# AETHER Store — Complete Setup & Configuration Guide

This guide walks you through connecting **Google Cloud Console OAuth**, **Supabase / Neon PostgreSQL Database**, and **Mailgun Transactional Emails** to power your React store.

---

## 🚀 Quick Start (Running Locally)

1. Make sure dependencies are installed:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> [!TIP]
> The store includes an immediate zero-configuration fallback mode: product browsing, search, cart, checkout, receipt generation, and simulated Mailgun dispatches work instantly without waiting for API keys!

---

## 1. 🗄️ Supabase / Neon Database Setup

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and click **New Project**.
2. Give your project a name (e.g., `aether-store`) and set a secure database password.
3. Select your preferred geographic region.

### Step 2: Run the Database Schema
1. In your Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Copy the contents of [`supabase/schema.sql`](file:///Users/kelvin/Desktop/hng/supabase/schema.sql) and paste them into the query editor.
4. Click **Run**. This will create the `products`, `orders`, and `order_items` tables with Row-Level Security and pre-seed the hardware catalog.

### Step 3: Copy Supabase API Keys to `.env.local`
1. In Supabase, navigate to **Project Settings** → **API**.
2. Copy the **Project URL** and paste it into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   ```
3. Copy the **anon / public** API key and paste it into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. (Optional) Copy the **service_role** secret for elevated backend administration:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```

---

## 2. 📧 Mailgun Transactional Email Setup

### Step 1: Obtain Mailgun API Credentials
1. Go to [https://www.mailgun.com](https://www.mailgun.com) and log in.
2. Under **Sending** → **Domains**, choose your sending domain (or use your Mailgun `sandboxXXXXX.mailgun.org` test domain).
3. Under **Settings** → **API Keys**, copy your **Sending API Key** (or Primary Account API key).

### Step 2: Configure `.env.local`
Add your credentials to `.env.local`:
```env
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=sandboxXXXXX.mailgun.org
MAILGUN_FROM_EMAIL="AETHER Store <orders@sandboxXXXXX.mailgun.org>"
```

### Step 3: Test Mailgun Dispatch
1. Open the store in your browser: **[http://localhost:3000/setup](http://localhost:3000/setup)**
2. In the **Test Mailgun Email Dispatch** tool, enter your email and click **Send Test Receipt**.
3. Check your inbox for the responsive HTML order confirmation receipt.

---

## 3. 🔐 Google Auth using Google Cloud Console

### Step 1: Create a Google Cloud Project
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top and click **New Project** (e.g. `Aether Store Auth`).
3. Click **Create**.

### Step 2: Configure OAuth Consent Screen
1. In the Google Cloud Console sidebar, go to **APIs & Services** → **OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the required fields:
   - **App name**: `Aether Store`
   - **User support email**: your email
   - **Developer contact information**: your email
4. Click **Save and Continue** through the Scopes and Test Users screens.
5. In **Test Users**, add your personal Google account email so you can test logins before verification.

### Step 3: Create OAuth 2.0 Client Credentials
1. Go to **APIs & Services** → **Credentials**.
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**.
3. Select Application type: **Web application**.
4. Set **Name**: `Aether Web Store Client`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - Your production domain (e.g. `https://your-store.vercel.app`)
6. Under **Authorized redirect URIs**, add:
   - If using Supabase Auth (Recommended):
     `https://<your-project-id>.supabase.co/auth/v1/callback`
   - If using Direct OAuth:
     `http://localhost:3000/api/auth/callback/google`
7. Click **Create**. A dialog will appear with your **Client ID** and **Client Secret**.

### Step 4: Link Google Credentials in Supabase Auth
1. Open your **Supabase Dashboard**.
2. Go to **Authentication** → **Providers** → **Google**.
3. Toggle Google to **Enabled**.
4. Paste the **Client ID** and **Client Secret** obtained from Google Cloud Console.
5. Click **Save**.

### Step 5: Configure `.env.local`
```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 💳 Paystack Payment Gateway Setup

### Step 1: Obtain Paystack API Keys
1. Sign up or log into [Paystack Dashboard](https://dashboard.paystack.com/).
2. Navigate to **Settings** → **API Keys & Webhooks**.
3. Copy your **Test Secret Key** (`sk_test_...`) and **Test Public Key** (`pk_test_...`).

### Step 2: Configure `.env.local`
Add your keys to `.env.local`:
```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_CURRENCY=USD
```
*(Note: AETHER includes a built-in simulation mode. If keys are not configured, test checkouts will simulate the Paystack flow seamlessly without errors).*

### Step 3: Configure Paystack Webhook (Optional for Production)
1. In your Paystack Dashboard under **API Keys & Webhooks**, set the **Webhook URL** to:
   `https://<your-domain>/api/webhooks/paystack`
2. Paystack will securely send signed HMAC-SHA512 `charge.success` events to automatically settle orders and dispatch receipts.

---

## 🛒 Store Features Overview

- **Live Paystack Checkout**: Cards (Visa, Mastercard, Verve), Apple Pay, Bank Transfer, and USSD with real-time verification and badges.
- **Event-Driven Transactional Emails**: Customers automatically receive Mailgun HTML emails for:
  - Payment & Order Confirmation
  - Status updates (processing, delivered, cancelled)
  - Courier dispatch with live tracking links
  - Password & account security alerts
- **Full Catalog & Filtering**: Browse by category (*Smartphones*, *Computing*, *Wearables*, *Audiophile*, *Acoustics*), search in realtime, view ratings and specs.
- **Quick-View Modal**: Inspect detailed engineering specifications, high-res images, and stock availability.
- **Interactive Sliding Cart Drawer**: Dynamic subtotal, free shipping progress bar ($150 target), promo codes (`WELCOME10`, `TECH20`), and quantity controls.
- **Customer Portal (`/account`)**: Profile management, address book, security settings, and order history.
- **Operations Portal (`/admin`)**: Live telemetry, order fulfillment, stock management with inventory ledger, and promo code creator.
- **Celebratory Confirmation Page (`/order-confirmation`)**: Interactive confetti, Paystack verification banner, order tracking timeline, and itemized receipt.

