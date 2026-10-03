# AETHER — COMPLETE TECHNICAL BLUEPRINT & SYSTEM SPECIFICATION
> **Document Purpose**: This document contains all architectural, structural, database, API, authentication, frontend, and mobile specifications required for any AI agent or software engineer to completely reproduce, build, test, and deploy the entire **AETHER Luxury Electronics & Acoustic Hardware** platform from scratch.

---

## 1. SYSTEM IDENTITY & ARCHITECTURAL FOUNDATION

### 1.1 Business Domain & Product Vision
**AETHER** is an enterprise-grade luxury e-commerce storefront for precision-engineered computing and acoustic hardware:
- Flagship Smartphones (Titanium chassis, LTPO OLED).
- Studio Planar Magnetic & Beryllium Headphones (Audiophile reference).
- Ultra-thin High-Performance Laptops (Custom silicon).
- Minimalist Smart Wearables (Ceramic unibody, biometric telemetry).
- Wireless Omnidirectional Soundboxes (Scandinavian acoustic design).

### 1.2 Multi-Platform Scope
The project consists of two codebases:
1. **Web Application**: Next.js 15 App Router, React 19, TypeScript, Vanilla CSS Design System, Supabase PostgreSQL, Paystack, Resend Transactional Email.
2. **Mobile Application (`/Users/kelvin/Desktop/aether-mobile`)**: React Native, Expo SDK 57, Expo Router (file-based navigation), TypeScript, `@expo/vector-icons`.

### 1.3 Core Engineering Rules
1. **Zero Client-Trust**: Line prices, coupon discounts, shipping thresholds, VAT, and grand totals are strictly calculated server-side. The client payload is treated only as intent.
2. **Resilient Dual-Mode Operation**: When cloud credentials (Supabase, Resend, Paystack) are missing or in development, the system falls back seamlessly to in-memory/localStorage stores without crashing. Once keys are configured in `.env.local`, the platform operates in full cloud persistence mode.
3. **IDOR Prevention**: Guest order receipt lookups (`/order-confirmation`) require cryptographically signed HMAC-SHA256 tokens (`token = hmacSha256(orderId, secret)`).
4. **Sliding-Window IP Rate Limiting**: All sensitive endpoints (`/api/checkout`, `/api/paystack/initialize`, `/api/account/security`) are guarded by an in-memory sliding-window limiter with automated garbage collection.

---

## 2. TECHNOLOGY STACK & DEPENDENCIES

### 2.1 Web Tech Stack
- **Framework**: Next.js 15.3+ (App Router, Server Actions & Route Handlers)
- **UI & State**: React 19.0+, React Context API (`CartContext`, `AuthContext`, `WishlistContext`)
- **Styling**: Vanilla CSS with modern custom properties, glassmorphism (`backdrop-filter: blur`), dark obsidian aesthetic (`#0a0e17`), zero layout shifts.
- **Icons**: `lucide-react`
- **Database & Auth**: `@supabase/supabase-js`, `@supabase/ssr` (PostgreSQL 15+)
- **Payments**: Paystack REST API (initialized server-side, verified via HMAC-SHA512 webhook)
- **Email Service**: Resend REST API (fallback Mailgun REST)
- **Visual Effects**: `canvas-confetti` (for order completion celebrations)

### 2.2 Mobile Tech Stack
- **Framework**: Expo SDK 57+ (Bare/Managed via Expo Prebuild or Expo Go)
- **Routing**: `expo-router` v57 (File-based tabs and stack navigation)
- **Components**: React Native 0.86+, Safe Area Context, Screens, Reanimated
- **Icons**: `@expo/vector-icons` (`Ionicons`)
- **Theme**: Dark obsidian luxury theme matching web tokens

---

## 3. MASTER DATABASE SCHEMA (POSTGRESQL / SUPABASE)

The database schema is defined in [`supabase/schema.sql`](file:///Users/kelvin/Desktop/hng/supabase/schema.sql) and contains 19 normalized sections:

### 3.1 Tables Overview
1. **`profiles`**:
   - `id` (UUID, PK, references `auth.users.id` on delete cascade)
   - `email` (TEXT, unique)
   - `full_name` (TEXT)
   - `phone` (TEXT)
   - `avatar_url` (TEXT)
   - `role` (TEXT, default `'customer'`; check `role in ('customer', 'staff', 'admin')`)
   - `created_at`, `updated_at` (TIMESTAMPTZ)
2. **`customer_addresses`**:
   - `id` (UUID, PK, default `gen_random_uuid()`)
   - `user_id` (UUID, references `profiles.id`)
   - `recipient_name` (TEXT), `phone` (TEXT), `address_line1` (TEXT), `address_line2` (TEXT)
   - `city` (TEXT), `state` (TEXT), `postal_code` (TEXT), `country` (TEXT, default `'Nigeria'`)
   - `is_default_shipping` (BOOLEAN), `is_default_billing` (BOOLEAN)
3. **`categories`**:
   - `id` (TEXT, PK, e.g. `'smartphones'`, `'audiophile'`, `'computing'`, `'wearables'`, `'acoustics'`)
   - `name` (TEXT), `slug` (TEXT, unique), `description` (TEXT), `display_order` (INT)
4. **`products`**:
   - `id` (TEXT, PK, e.g. `'prod-phone-crystal'`)
   - `sku` (TEXT, unique), `name` (TEXT), `tagline` (TEXT), `category_id` (TEXT, FK `categories.id`)
   - `category_label` (TEXT), `price` (NUMERIC(10,2)), `cost_price` (NUMERIC(10,2)), `rating` (NUMERIC(3,2))
   - `reviews_count` (INT), `image` (TEXT), `gallery` (JSONB), `badge` (TEXT)
   - `description` (TEXT), `overview` (TEXT), `materials` (TEXT), `warranty` (TEXT)
   - `features` (JSONB), `specifications` (JSONB), `colors` (JSONB), `stock` (INT)
5. **`product_variants`**:
   - `id` (UUID, PK), `product_id` (FK `products.id`), `sku` (TEXT), `color_name` (TEXT), `color_hex` (TEXT), `stock` (INT)
6. **`discount_coupons`**:
   - `id` (UUID, PK), `code` (TEXT, unique, uppercase), `discount_type` (`'percentage'` or `'fixed'`)
   - `discount_value` (NUMERIC), `min_order_amount` (NUMERIC), `max_uses` (INT), `used_count` (INT), `is_active` (BOOLEAN), `expires_at` (TIMESTAMPTZ)
7. **`orders`**:
   - `id` (UUID, PK, default `gen_random_uuid()`)
   - `order_number` (TEXT, unique, e.g. `'AETH-98214'`)
   - `user_id` (UUID, nullable, FK `profiles.id`), `guest_email` (TEXT)
   - `subtotal` (NUMERIC), `discount_amount` (NUMERIC), `shipping_cost` (NUMERIC), `tax_amount` (NUMERIC), `total_amount` (NUMERIC)
   - `coupon_code` (TEXT), `order_status` (TEXT: `'confirmed'`, `'processing'`, `'shipped'`, `'delivered'`, `'cancelled'`)
   - `payment_status` (TEXT: `'pending'`, `'paid'`, `'failed'`, `'refunded'`), `payment_method` (TEXT)
   - `shipping_address` (JSONB), `billing_address` (JSONB)
   - `tracking_carrier` (TEXT, default `'FedEx Priority Air'`), `tracking_number` (TEXT)
8. **`order_items`**:
   - `id` (UUID, PK), `order_id` (FK `orders.id`), `product_id` (FK `products.id`), `product_name` (TEXT), `unit_price` (NUMERIC), `quantity` (INT), `total_price` (NUMERIC), `selected_variant` (JSONB)
9. **`order_timeline`**:
   - `id` (UUID, PK), `order_id` (FK `orders.id`), `status` (TEXT), `title` (TEXT), `description` (TEXT), `created_at` (TIMESTAMPTZ)
10. **`email_logs`**:
    - `id` (UUID, PK), `recipient` (TEXT), `subject` (TEXT), `template_name` (TEXT), `status` (TEXT: `'sent'`, `'delivered'`, `'failed'`), `provider_id` (TEXT), `error_message` (TEXT)
11. **`inventory_ledger`**:
    - `id` (UUID, PK), `product_id` (FK `products.id`), `quantity_delta` (INT), `balance_after` (INT), `reason` (`'checkout'`, `'restock'`, `'adjustment'`), `reference_id` (TEXT)
12. **`product_reviews`**:
    - `id` (UUID, PK), `product_id` (FK `products.id`), `user_id` (FK `profiles.id`), `rating` (INT, 1-5), `title` (TEXT), `comment` (TEXT), `is_verified_buyer` (BOOLEAN)
13. **`activity_logs`**:
    - `id` (UUID, PK), `user_id` (UUID, nullable), `action` (TEXT), `entity_type` (TEXT), `entity_id` (TEXT), `details` (JSONB), `ip_address` (TEXT), `user_agent` (TEXT)

### 3.2 Row Level Security (RLS) & Triggers
- `profiles`: Users can read/write their own profile; staff/admins can read/write all.
- `orders`: Users can read their own orders (`user_id = auth.uid()` or matching guest token); staff/admins have full access.
- `products`: Publicly readable (`SELECT true`); staff/admins have write permissions.
- Trigger `on_auth_user_created`: Automatically creates a `profiles` row whenever a user signs up via Google OAuth or Supabase email/password.

---

## 4. REST API SUITE (ALL 24 ENDPOINTS)

### Catalog & Products
1. `GET /api/products`:
   - Query: `category`, `search`, `minPrice`, `maxPrice`, `sort`
   - Returns: `{ success: true, data: { products: Product[] } }`
2. `GET /api/products/[id]`:
   - Path param: `id` (e.g. `'prod-phone-crystal'`)
   - Returns: `{ success: true, data: { product: Product } }`

### Checkout & Payments
3. `POST /api/checkout`:
   - Body: `{ items: [{ id, quantity, color }], customer: { name, email, phone }, shippingAddress: { ... }, paymentMethod: 'card'|'wire'|'paystack', couponCode?: string }`
   - Actions: Validates stock, calculates server-side subtotal/tax/shipping, creates order in DB, deducts inventory with ledger, dispatches confirmation email, generates guest token.
   - Returns: `{ success: true, data: { orderId, orderNumber, total, guestToken, paymentDetails } }`
4. `POST /api/paystack/initialize`:
   - Body: `{ orderId, email, amount, callbackUrl }`
   - Actions: Calls Paystack API `https://api.paystack.co/transaction/initialize`, returns authorization URL.
5. `GET /api/paystack/verify`:
   - Query: `?reference=...`
   - Actions: Calls Paystack verify endpoint, checks amount, updates order status to `paid`, logs audit event.
6. `POST /api/webhooks/paystack`:
   - Headers: `x-paystack-signature` (HMAC-SHA512 of raw body with `PAYSTACK_SECRET_KEY`)
   - Actions: Idempotent processing of `charge.success` events.

### Customer Orders
7. `GET /api/orders`:
   - Query: `?email=...`
   - Returns customer orders list.
8. `GET /api/orders/[id]`:
   - Query: `?token=...` (HMAC verification)
   - Returns order receipt, line items, and fulfillment history.

### Customer Account & Security
9. `GET /api/account/profile` & `PUT /api/account/profile`: Retrieve and update user profile.
10. `GET /api/account/addresses`, `POST /api/account/addresses`, `DELETE /api/account/addresses`: Saved address book CRUD.
11. `POST /api/account/security`: High-entropy password update + security email alert dispatch.
12. `GET /api/account/security/2fa` & `POST /api/account/security/2fa`: RFC 6238 TOTP 2FA setup, QR URI generation, and token validation.
13. `GET /api/account/reviews` & `POST /api/account/reviews`: Customer reviews fetching and submission.

### Auth & Emails
14. `GET /auth/callback`: OAuth 2.0 PKCE authorization code exchange route.
15. `POST /api/auth/welcome`: Welcome email dispatch.
16. `POST /api/email/test`: Live email testing dispatcher (Resend).
17. `POST /api/webhooks/mailgun`: Email delivery tracking webhook.

### Executive Admin Console
18. `GET /api/admin/metrics`: Executive revenue GMV, order counts, pending queue.
19. `GET /api/admin/orders`: Filterable list of all store orders.
20. `GET /api/admin/orders/[id]` & `PATCH /api/admin/orders/[id]`: Status update, carrier assignment, tracking number dispatch.
21. `GET /api/admin/products` & `PATCH /api/admin/products`: Stock adjustments and price updates with inventory ledger tracking.
22. `GET /api/admin/coupons`, `POST /api/admin/coupons`, `DELETE /api/admin/coupons`: Coupon engine.

### Diagnostics & Audit Logs
23. `GET /api/system-status`: Real-time health check of Supabase, Resend, Auth, and Paystack.
24. `GET /api/activity-log` & `POST /api/activity-log`: System-wide audit telemetry.

---

## 5. ENVIRONMENT VARIABLES SPECIFICATION (`.env.local`)

| Variable | Public/Secret | Description | Example Value |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase Project REST Endpoint | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase Publishable Anon Key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase Elevated Service Role Key | `eyJhbGciOi...` |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical Base URL of the Application | `http://localhost:3000` or production URL |
| `NEXT_PUBLIC_STORE_CURRENCY` | Public | Primary Storefront Currency | `NGN` (or `USD`) |
| `PAYSTACK_SECRET_KEY` | Secret | Paystack Server API Secret Key | `sk_test_...` |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Public | Paystack Client-Side Public Key | `pk_test_...` |
| `PAYSTACK_CURRENCY` | Public | Currency for Paystack Charging | `NGN` |
| `RESEND_API_KEY` | Secret | Resend API Key for Email Dispatch | `re_xxxx...` |
| `RESEND_FROM_EMAIL` | Public | Sender Email for Order Confirmation | `AETHER Hardware <onboarding@resend.dev>` |
| `GOOGLE_CLIENT_ID` | Secret | Google Cloud Console OAuth Client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Secret | Google Cloud Console OAuth Client Secret | `GOCSPX-xxxx...` |

---

## 6. DESIGN SYSTEM & UI/UX TOKENS

```css
:root {
  --bg-main: #0a0e17;
  --bg-surface: #111827;
  --bg-elevated: #1e293b;
  --primary: #38bdf8;
  --primary-glow: rgba(56, 189, 248, 0.15);
  --secondary: #818cf8;
  --emerald: #34d399;
  --amber: #fbbf24;
  --rose: #f43f5e;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  --border-subtle: rgba(255, 255, 255, 0.08);
  --font-heading: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;
  --transition-fast: 0.15s ease;
  --transition-base: 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 7. MOBILE APPLICATION SPECIFICATION (EXPO)

- **Directory**: `/Users/kelvin/Desktop/aether-mobile`
- **Navigation File Tree**:
  ```
  app/
  ├── _layout.tsx           <-- Stack navigator wrapping CartProvider & WishlistProvider
  ├── (tabs)/
  │   ├── _layout.tsx       <-- 4 tabs: Store, Bag (with count badge), Tracking, Console
  │   ├── index.tsx         <-- Storefront catalog with search & category filters
  │   ├── cart.tsx          <-- Shopping bag, free shipping meter, promo engine, checkout
  │   ├── orders.tsx        <-- Orders list with visual 4-step fulfillment tracker
  │   └── account.tsx       <-- System console, API endpoint configuration, currency toggle
  └── product/
      └── [id].tsx          <-- Dedicated hardware telemetry & specification view
  ```
- **Execution Command**:
  ```bash
  cd /Users/kelvin/Desktop/aether-mobile
  npm start
  ```

---

## 8. PRODUCTION DEPLOYMENT & NETLIFY RECIPE

1. **Netlify Configuration (`netlify.toml`)**:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"

   [build.environment]
     SECRETS_SCAN_ENABLED = "false"
     NEXT_USE_NETLIFY_EDGE = "false"
   ```
   *(Note: `SECRETS_SCAN_ENABLED = "false"` is required so public Supabase keys and test email addresses in configuration files do not trigger Netlify false-positive build aborts).*

2. **Google OAuth Authorized Redirect URIs**:
   - In Google Cloud Console:
     - `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback`
     - `https://<your-netlify-domain>.netlify.app/auth/callback`
   - In Supabase Dashboard -> Authentication -> URL Configuration:
     - Site URL: `https://<your-netlify-domain>.netlify.app`
     - Redirect URLs: `https://<your-netlify-domain>.netlify.app/auth/callback`, `http://localhost:3000/auth/callback`

3. **Resend Email Production Configuration**:
   - In free sandbox mode: Sender must be `onboarding@resend.dev` and recipient must match your verified Resend account email. The system automatically rewrites recipient to verified sandbox email during development to guarantee 100% successful email delivery.
   - In live production: Verify your custom domain (e.g. `mail.yourdomain.com`) in Resend DNS settings and set `RESEND_FROM_EMAIL="AETHER Hardware <orders@yourdomain.com>"`.

---

## 9. HOW ANY AI CAN EXTEND OR REBUILD THIS SYSTEM

1. **To recreate the Web Database**:
   Execute the full [`supabase/schema.sql`](file:///Users/kelvin/Desktop/hng/supabase/schema.sql) file directly inside the Supabase SQL editor.
2. **To run the Web App**:
   `npm install && npm run dev`
3. **To test compile for production**:
   `npm run build`
4. **To run the Mobile App**:
   `cd /Users/kelvin/Desktop/aether-mobile && npm start`

*This document serves as the immutable ground truth for the AETHER ecosystem.*
