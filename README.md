# AETHER — Precision Electronics & Acoustic Hardware

> A luxury, enterprise-grade e-commerce platform for high-end personal computing and acoustic hardware. Built with Next.js 15 (App Router), React 19, TypeScript, Vanilla CSS, Supabase PostgreSQL, Google Cloud OAuth 2.0, and Mailgun.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server (http://localhost:3000)
npm run dev

# 3. Compile and validate production build across all 33 routes
npm run build
```

---

## 🏗️ Architectural Overview

AETHER enforces strict separation of concerns, zero client-trust pricing, and full server-side authorization:

```
UI (Client)
  ↓
Next.js App Router (Server API & Route Handlers)
  ↓
Validation & Rate Limiting (Sliding Window IP Rate Limiter)
  ↓
Business Logic (Server-side price recalculation & stock lock)
  ↓
Database (Supabase / PostgreSQL with RLS & 19 Tables)
  ↓
Audit & Dispatch (activity_logs, inventory_ledger, Mailgun REST)
```

---

## 🔑 Core Features & Portals

### 1. Storefront & Catalog
- **Catalog Browsing**: Smartphones, Computing Hardware, Audiophile Headphones, Wearables, and Wireless Soundboxes.
- **Instant Search & Category Filtering**: Real-time multi-field query matching.
- **Product Quick-View**: Deep technical specifications, high-res photography, and stock status.
- **Cart Drawer**: Animated slide-over, free shipping meter ($150 target), and promo code engine (`WELCOME10`, `TECH20`).

### 2. Secure Checkout (`/checkout`)
- **Modern Web Forms Compliance**: Semantic HTML inputs, autocomplete attributes (`shipping address-line1`, `cc-number`, `cc-exp`), and `inputmode="numeric"`.
- **Zero Client-Trust**: All line prices, discounts, taxes, and final totals are recalculated authoritatively on the server.
- **Inventory Ledger**: Stock deductions are verified atomically to prevent overselling.
- **IDOR Protection**: Order confirmations issue cryptographically signed HMAC-SHA256 guest tokens so unauthorized users cannot access receipts.

### 3. Customer Self-Service Portal (`/account`)
- `/account`: Account overview and active orders.
- `/account/profile`: Customer profile details and phone updates.
- `/account/addresses`: Saved shipping and billing destinations with primary address toggling.
- `/account/orders`: Real-time order tracking with line items and itemized printable receipts.
- `/account/security`: High-entropy password updates with dynamic 3-tier strength meter and personal audit logs.
- `/account/reviews`: Verified buyer review authoring (1-5 star ratings, headline, commentary).

### 4. Operations & Staff Control Terminal (`/admin`)
- **Role Guard**: Enforces `role === 'admin' || role === 'staff'` (includes 1-click Demo Admin switcher in development mode).
- `/admin`: Executive dashboard with live GMV, total volume, pending fulfillment counts, and low-inventory alerts.
- `/admin/orders`: Complete fulfillment pipeline. Assign carriers (`FedEx Priority`, `DHL Express`, `UPS Worldwide`), tracking numbers, update statuses, and dispatch automatic customer email notifications.
- `/admin/products`: Hardware catalog stock editor and unit pricing manager with automatic `inventory_ledger` logging.
- `/admin/coupons`: Promotional discount campaigns manager with usage caps and expiration dates.
- `/admin/logs`: Immutable system compliance audit feed.

---

## 🗄️ Database Architecture (`supabase/schema.sql`)

19 normalized tables and sections:
1. `profiles`: Linked to Supabase Auth (`customer`, `staff`, `admin`).
2. `customer_addresses`: Saved shipping and billing locations.
3. `categories`: Hardware taxonomy.
4. `products`: Master catalog with SKUs, MSRP, cost, and stock.
5. `product_variants`: Colors, sizes, and specs.
6. `discount_coupons`: Promo codes with usage caps and date bounds.
7. `orders`: Master transaction orders.
8. `order_items`: Order line items with historical price snapshots.
9. `order_timeline`: Chronological fulfillment history.
10. `email_logs`: Transactional Mailgun dispatch records.
11. `inventory_ledger`: Auditable stock deductions and restocks.
12. `product_reviews`: Verified customer ratings and commentary.
13. `activity_logs`: Immutable audit events.
14. B-Tree performance indexes.
15. Row-Level Security (RLS) policies.
16. Automatic `updated_at` triggers.
17. Hardware catalog seed data.

---

## 🛠️ Environment Configuration (`.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Base URL (e.g. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase private service role key |
| `MAILGUN_API_KEY` | Mailgun REST API key |
| `MAILGUN_DOMAIN` | Mailgun sending domain |
| `MAILGUN_FROM_EMAIL` | Transactional sender address |
| `GOOGLE_CLIENT_ID` | Google Cloud Console OAuth 2.0 Web Client ID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console OAuth 2.0 Client Secret |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin (`http://localhost:3000`) |

---

## 🧪 Verification

```bash
npm run build
```
Generates 33 static and dynamic routes with **0 type errors, 0 lint warnings, and 0 missing chunks**.
