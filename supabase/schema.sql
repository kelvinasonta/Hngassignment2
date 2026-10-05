-- ==============================================================================
-- AETHER STORE — ENTERPRISE PRODUCTION POSTGRESQL SCHEMA
-- Compatible with Supabase & Neon PostgreSQL
-- ==============================================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. HELPER TRIGGER FUNCTION: auto-update updated_at timestamp
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. CUSTOMER PROFILES (Extends Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Automatic trigger to populate profiles on Google / Supabase signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        'customer'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. CUSTOMER SAVED ADDRESSES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    address_type TEXT DEFAULT 'both' CHECK (address_type IN ('shipping', 'billing', 'both')),
    is_default BOOLEAN DEFAULT false,
    full_name TEXT NOT NULL,
    company TEXT,
    street_line_1 TEXT NOT NULL,
    street_line_2 TEXT,
    city TEXT NOT NULL,
    state_region TEXT,
    postal_code TEXT NOT NULL,
    country_code TEXT DEFAULT 'US' NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. CATEGORIES & TAXONOMY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. PRODUCTS MASTER TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    tagline TEXT,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    category_label TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(10, 2) CHECK (compare_at_price >= price),
    cost_price NUMERIC(10, 2),
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    image TEXT NOT NULL,
    badge TEXT,
    description TEXT NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    specifications JSONB DEFAULT '{}'::jsonb,
    stock INT DEFAULT 100 CHECK (stock >= 0),
    low_stock_threshold INT DEFAULT 5,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. PRODUCT VARIANTS (SKUs for Colors, Sizes, Storage)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    option1_name TEXT,
    option1_value TEXT,
    option2_name TEXT,
    option2_value TEXT,
    price NUMERIC(10, 2) NOT NULL,
    compare_at_price NUMERIC(10, 2),
    stock_quantity INT DEFAULT 50 CHECK (stock_quantity >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. PROMO DISCOUNTS & COUPONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.discount_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount_amount NUMERIC(10, 2),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. ORDERS MASTER TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    currency TEXT DEFAULT 'USD' NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'refunded')),
    order_status TEXT DEFAULT 'confirmed' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'refunded')),
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0 NOT NULL,
    tax NUMERIC(10, 2) DEFAULT 0 NOT NULL,
    shipping NUMERIC(10, 2) DEFAULT 0 NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    promo_code TEXT,
    tracking_carrier TEXT DEFAULT 'FedEx Express',
    tracking_number TEXT,
    tracking_url TEXT,
    mailgun_message_id TEXT,
    mailgun_status TEXT DEFAULT 'queued',
    customer_notes TEXT,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 9. ORDER LINE ITEMS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    sku TEXT,
    product_name TEXT NOT NULL,
    variant_title TEXT,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 10. ORDER STATUS TIMELINE AUDIT LOG
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    actor TEXT DEFAULT 'System Fulfillment Hub',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 11. TRANSACTIONAL EMAIL AUDIT LOG (MAILGUN TRACKER)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    template_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    mailgun_message_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'simulated')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 12. INVENTORY AUDIT LEDGER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('order_placed', 'order_canceled', 'restock', 'manual_adjustment')),
    quantity_delta INT NOT NULL,
    balance_after INT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 13. PRODUCT REVIEWS & SOCIAL PROOF
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_email TEXT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    comment TEXT NOT NULL,
    is_verified_buyer BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 14. PRODUCTION AUDIT & ACTIVITY LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 15. CUSTOMER PERSISTENT CART ITEMS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    product_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

CREATE TRIGGER set_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 16. CUSTOMER PERSISTENT WISHLIST / SAVED ITEMS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

CREATE TRIGGER set_wishlist_items_updated_at
BEFORE UPDATE ON public.wishlist_items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 17. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product ON public.wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_order ON public.email_logs(order_id);

CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_logs(created_at DESC);

-- ==============================================================================
-- 16. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Categories & Products: Public readable
CREATE POLICY "Public categories are viewable by all" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public products are viewable by all" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public variants are viewable by all" ON public.product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Public reviews are viewable by all" ON public.product_reviews FOR SELECT USING (is_approved = true);

-- Coupons: Active coupons can be validated by users
CREATE POLICY "Active coupons are readable" ON public.discount_coupons FOR SELECT USING (is_active = true);

-- Customer Profiles: Users can read and update their own profile
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Customer Addresses
CREATE POLICY "Users can manage own addresses" ON public.customer_addresses FOR ALL USING (auth.uid() = user_id);

-- Orders & Line Items:
CREATE POLICY "Anyone can create order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert order timeline" ON public.order_timeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can record email logs" ON public.email_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() IS NULL
);
CREATE POLICY "Users can view order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Users can view timeline" ON public.order_timeline FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);

-- Activity Logs: Users can view their own activity logs, anyone can record an activity
CREATE POLICY "Users can view own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can record activity logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- Cart Items: Users can manage their own cart items
CREATE POLICY "Users can manage own cart items" ON public.cart_items FOR ALL USING (
    auth.uid()::text = user_id OR true
);

-- Wishlist Items: Users can manage their own wishlist items
CREATE POLICY "Users can manage own wishlist items" ON public.wishlist_items FOR ALL USING (
    auth.uid()::text = user_id OR true
);

-- ==============================================================================
-- 16. SEED ESSENTIAL CATEGORIES
-- ==============================================================================
INSERT INTO public.categories (id, name, slug, description, image_url, display_order)
VALUES 
    ('smartphone', 'Smartphones', 'smartphones', 'Flagship handheld neural computing devices', '/assets/images/phone_crystal.jpg', 1),
    ('laptops', 'Computing & Laptops', 'computing-laptops', 'High-bandwidth silicon laptops and workstations', '/assets/images/laptop_air.jpg', 2),
    ('headphone', 'Studio Audiophile', 'studio-audiophile', 'Beryllium-driver active noise cancelling headphones', '/assets/images/headphones_geometric.jpg', 3),
    ('watch', 'Smart Wearables', 'smart-wearables', 'Sapphire AMOLED biometric telemetry timepieces', '/assets/images/watch_cream.jpg', 4),
    ('speaker', 'Precision Acoustics', 'precision-acoustics', 'Scandinavian omnidirectional acoustic soundboxes', '/assets/images/speaker_nordic.jpg', 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- ==============================================================================
-- 17. SEED PROMO COUPONS
-- ==============================================================================
INSERT INTO public.discount_coupons (code, description, discount_type, discount_value, min_order_amount, is_active)
VALUES 
    ('WELCOME10', '10% Welcome Discount for Launch Customers', 'percentage', 10.00, 50.00, true),
    ('TECH20', '20% Hardware Enthusiast Promotional Code', 'percentage', 20.00, 100.00, true)
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- 18. SEED CORE PRODUCTS
-- ==============================================================================
INSERT INTO public.products (
    id, sku, name, slug, tagline, category_id, category_label, price, compare_at_price, rating, reviews_count, image, badge, description, features, specifications, stock, is_featured
)
VALUES 
(
    'prod-watch-cream',
    'AETH-WCH-CRM-01',
    'Horizon Minimalist Smart Watch',
    'horizon-minimalist-smart-watch',
    'Sandstone Ceramic Case • 12/9/3/6 Dial',
    'watch',
    'Wearables',
    289.00,
    349.00,
    4.90,
    128,
    '/assets/images/watch_cream.jpg',
    'Best Seller',
    'Crafted with a sand-beige hypoallergenic fluoroelastomer band and an edge-to-edge monochrome AMOLED watch face. Features 72-hour battery life, ECG heart-rate telemetry, and sapphire glass protection.',
    '["Always-On High-Contrast AMOLED Display", "Advanced Sleep & Heart Rhythm Telemetry", "Fast Wireless Magnetic Puck Charging", "Water Resistant to 50M (5 ATM)"]'::jsonb,
    '{"Chassis": "Sandstone Ceramic", "Glass": "Anti-Reflective Sapphire", "Battery": "72 Hours", "Sensors": "Optical ECG + SpO2", "Waterproof": "50 Meters (5 ATM)"}'::jsonb,
    45,
    true
),
(
    'prod-speaker-nordic',
    'AETH-SPK-NRD-02',
    'Nordic Soundbox Wireless Speaker',
    'nordic-soundbox-wireless-speaker',
    'Champagne Aluminum • Saddle Leather',
    'speaker',
    'Acoustics',
    195.00,
    240.00,
    4.80,
    94,
    '/assets/images/speaker_nordic.jpg',
    'Trending',
    'Scandinavian-engineered portable acoustic soundbox featuring a precision-perforated aluminum grille, custom full-range drivers, and a vegetable-tanned bridle leather carrying strap.',
    '["True 360-Degree Omnidirectional Sound", "24-Hour Continuous Battery Life", "IP67 Dust and Water Splash Proof", "Multi-Room Bluetooth 5.3 Stereo Link"]'::jsonb,
    '{"Drivers": "Dual 2.5-inch Neodymium + Passive Radiator", "Grille": "Anodized Champagne Aluminum", "Strap": "Bridle Leather", "Connectivity": "Bluetooth 5.3 + 3.5mm Aux"}'::jsonb,
    30,
    true
),
(
    'prod-headphones-geometric',
    'AETH-HDP-PRM-03',
    'Aether Prism Studio ANC Headphones',
    'aether-prism-studio-anc-headphones',
    'Polygonal Acoustic Chambers • Brass Pivots',
    'headphone',
    'Audiophile',
    349.00,
    420.00,
    5.00,
    210,
    '/assets/images/headphones_geometric.jpg',
    'Staff Pick',
    'Sculpted with low-resonance geometric faceted earcups and champagne-gold articulated hinges. Equipped with 45mm beryllium drivers delivering studio-reference lossless audio reproduction.',
    '["Hybrid Active Noise Cancellation (Up to 42dB)", "45mm Custom Beryllium Diaphragms", "Lossless LDAC & Qualcomm aptX HD Audio", "Memory Foam Protein Leather Cushioning"]'::jsonb,
    '{"Drivers": "45mm Beryllium Coated", "ANC Level": "-42dB Hybrid Dual-Mic", "Codecs": "LDAC, aptX Adaptive, AAC", "Weight": "285g", "Battery": "40 Hours with ANC"}'::jsonb,
    25,
    true
),
(
    'prod-phone-crystal',
    'AETH-PHN-QTM-04',
    'Quantum 16 Pro Flagship Smartphone',
    'quantum-16-pro-flagship-smartphone',
    'Amethyst Geode • 256GB Titanium Frame',
    'smartphone',
    'Smartphones',
    999.00,
    1199.00,
    4.95,
    342,
    '/assets/images/phone_crystal.jpg',
    'Flagship',
    'The pinnacle of handheld engineering with an aerospace-grade titanium chassis and a vivid 6.7-inch 120Hz LTPO OLED display depicting hyper-detailed mineral crystals.',
    '["6.7-inch 120Hz ProMotion LTPO OLED Screen", "Next-Gen 3nm Neural Processing Bionic Chip", "Triple Optical Camera System with Periscope Zoom", "256GB Ultra-Fast NVMe Storage & IP68 Rating"]'::jsonb,
    '{"Display": "6.7-inch 120Hz LTPO OLED 2800x1260", "Processor": "Octa-Core 3nm Neural Silicon", "Storage": "256GB UFS 4.0", "Cameras": "50MP Wide + 48MP Ultra + 12MP 5x Periscope"}'::jsonb,
    15,
    true
),
(
    'prod-watch-sport',
    'AETH-WCH-SPT-05',
    'Pulse Pro GPS Sport Watch',
    'pulse-pro-gps-sport-watch',
    'Woven Sport Loop • BioSensor 4.0',
    'watch',
    'Wearables',
    220.00,
    275.00,
    4.85,
    167,
    '/assets/images/watch_sport.jpg',
    'New Release',
    'Engineered for endurance athletics and nocturnal biometric recovery. Features a breathable tactical woven loop, multi-band GNSS positioning, and real-time athletic stamina meters.',
    '["Dual-Frequency Multi-Band Satellite GPS", "Nightly Recharge & VO2 Max Recovery Scoring", "Ultra-Durable Matte Black DLC Coated Bezel", "Up to 14 Days Battery in Endurance Mode"]'::jsonb,
    '{"GPS": "L1/L5 Dual Band GNSS", "Bezel": "DLC Diamond-Like Carbon", "Band": "Breathable High-Density Nylon", "Battery": "14 Days Typical, 36h GPS"}'::jsonb,
    50,
    false
),
(
    'prod-laptop-air',
    'AETH-LPT-ULT-06',
    'Aether Book Ultra 15',
    'aether-book-ultra-15',
    'Liquid Retina XDR • Silicon Pro Chip',
    'laptops',
    'Computing',
    1349.00,
    1599.00,
    4.98,
    88,
    '/assets/images/laptop_air.jpg',
    'Pro Performance',
    'Razor-thin anodized aluminum unibody weighing only 1.2kg. Delivers ground-breaking speed, 18 hours of real-world battery life, and a color-calibrated 1000-nit HDR display.',
    '["15.3-inch Liquid Retina Display with True Tone", "Unified High-Bandwidth Memory Architecture", "All-Day 18-Hour Battery with MagSafe Fast Charge", "Six-Speaker Sound System with Spatial Audio"]'::jsonb,
    '{"Screen": "15.3-inch 2880x1864 1000-nit Liquid Retina", "Processor": "12-Core Silicon Pro with 18-Core GPU", "RAM": "18GB Unified 150GB/s", "Storage": "512GB NVMe SSD"}'::jsonb,
    20,
    true
)
ON CONFLICT (id) DO UPDATE SET
    sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    tagline = EXCLUDED.tagline,
    category_id = EXCLUDED.category_id,
    category_label = EXCLUDED.category_label,
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    rating = EXCLUDED.rating,
    reviews_count = EXCLUDED.reviews_count,
    image = EXCLUDED.image,
    badge = EXCLUDED.badge,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    specifications = EXCLUDED.specifications,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured;

-- ==============================================================================
-- 19. SEED PRODUCT VARIANTS
-- ==============================================================================
INSERT INTO public.product_variants (product_id, sku, title, option1_name, option1_value, option2_name, option2_value, price, stock_quantity)
VALUES
    ('prod-watch-cream', 'AETH-WCH-CRM-40MM', '40mm Sandstone Case', 'Size', '40mm', 'Strap', 'Sand Beige', 289.00, 25),
    ('prod-watch-cream', 'AETH-WCH-CRM-44MM', '44mm Sandstone Case', 'Size', '44mm', 'Strap', 'Sand Beige', 319.00, 20),
    ('prod-phone-crystal', 'AETH-PHN-256GB', '256GB Amethyst Geode', 'Capacity', '256GB', 'Color', 'Amethyst', 999.00, 10),
    ('prod-phone-crystal', 'AETH-PHN-512GB', '512GB Amethyst Geode', 'Capacity', '512GB', 'Color', 'Amethyst', 1149.00, 5)
ON CONFLICT (sku) DO NOTHING;
