/**
 * AETHER — Authentic Electronics Store Application
 * Framer Minimalist E-Commerce Logic & Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. PRODUCTS DATA STORE
  // ==========================================
  const PRODUCTS = {
    'prod-watch-cream': {
      id: 'prod-watch-cream',
      name: 'Horizon Minimalist Smart Watch',
      tagline: 'Sandstone Ceramic Case • 12/9/3/6 Dial',
      category: 'watch',
      categoryLabel: 'Wearables',
      priceUSD: 289,
      rating: 4.9,
      reviewsCount: 128,
      image: 'assets/images/watch_cream.jpg',
      badge: 'Best Seller',
      description: 'Crafted with a sand-beige hypoallergenic fluoroelastomer band and an edge-to-edge monochrome AMOLED watch face. Features 72-hour battery life, ECG heart-rate telemetry, and sapphire glass protection.',
      features: [
        'Always-On High-Contrast AMOLED Display',
        'Advanced Sleep & Heart Rhythm Telemetry',
        'Fast Wireless Magnetic Puck Charging',
        'Water Resistant to 50M (5 ATM)'
      ]
    },
    'prod-speaker-nordic': {
      id: 'prod-speaker-nordic',
      name: 'Nordic Soundbox Wireless Speaker',
      tagline: 'Champagne Aluminum • Saddle Leather',
      category: 'speaker',
      categoryLabel: 'Acoustics',
      priceUSD: 195,
      rating: 4.8,
      reviewsCount: 94,
      image: 'assets/images/speaker_nordic.jpg',
      badge: 'Trending',
      description: 'Scandinavian-engineered portable acoustic soundbox featuring a precision-perforated aluminum grille, custom full-range drivers, and a vegetable-tanned bridle leather carrying strap.',
      features: [
        'True 360-Degree Omnidirectional Sound',
        '24-Hour Continuous Battery Life',
        'IP67 Dust and Water Splash Proof',
        'Multi-Room Bluetooth 5.3 Stereo Link'
      ]
    },
    'prod-headphones-geometric': {
      id: 'prod-headphones-geometric',
      name: 'Aether Prism Studio ANC Headphones',
      tagline: 'Polygonal Acoustic Chambers • Brass Pivots',
      category: 'headphone',
      categoryLabel: 'Audiophile',
      priceUSD: 349,
      rating: 5.0,
      reviewsCount: 210,
      image: 'assets/images/headphones_geometric.jpg',
      badge: 'Staff Pick',
      description: 'Sculpted with low-resonance geometric faceted earcups and champagne-gold articulated hinges. Equipped with 45mm beryllium drivers delivering studio-reference lossless audio reproduction.',
      features: [
        'Hybrid Active Noise Cancellation (Up to 42dB)',
        '45mm Custom Beryllium Diaphragms',
        'Lossless LDAC & Qualcomm aptX HD Audio',
        'Memory Foam Protein Leather Cushioning'
      ]
    },
    'prod-phone-crystal': {
      id: 'prod-phone-crystal',
      name: 'Quantum 16 Pro Flagship Smartphone',
      tagline: 'Amethyst Geode • 256GB Titanium Frame',
      category: 'smartphone',
      categoryLabel: 'Smartphones',
      priceUSD: 999,
      rating: 4.95,
      reviewsCount: 342,
      image: 'assets/images/phone_crystal.jpg',
      badge: 'Flagship',
      description: 'The pinnacle of handheld engineering with an aerospace-grade titanium chassis and a vivid 6.7-inch 120Hz LTPO OLED display depicting hyper-detailed mineral crystals.',
      features: [
        '6.7-inch 120Hz ProMotion LTPO OLED Screen',
        'Next-Gen 3nm Neural Processing Bionic Chip',
        'Triple Optical Camera System with Periscope Zoom',
        '256GB Ultra-Fast NVMe Storage & IP68 Rating'
      ]
    },
    'prod-watch-sport': {
      id: 'prod-watch-sport',
      name: 'Pulse Pro GPS Sport Watch',
      tagline: 'Woven Sport Loop • BioSensor 4.0',
      category: 'watch',
      categoryLabel: 'Wearables',
      priceUSD: 220,
      rating: 4.85,
      reviewsCount: 167,
      image: 'assets/images/watch_sport.jpg',
      badge: 'New Release',
      description: 'Engineered for endurance athletics and nocturnal biometric recovery. Features a breathable tactical woven loop, multi-band GNSS positioning, and real-time athletic stamina meters.',
      features: [
        'Dual-Frequency Multi-Band Satellite GPS',
        'Nightly Recharge & VO2 Max Recovery Scoring',
        'Ultra-Durable Matte Black DLC Coated Bezel',
        'Up to 14 Days Battery in Endurance Mode'
      ]
    },
    'prod-laptop-air': {
      id: 'prod-laptop-air',
      name: 'Aether Book Ultra 15',
      tagline: 'Liquid Retina XDR • Silicon Pro Chip',
      category: 'laptops',
      categoryLabel: 'Computing',
      priceUSD: 1349,
      rating: 4.98,
      reviewsCount: 88,
      image: 'assets/images/laptop_air.jpg',
      badge: 'Pro Performance',
      description: 'Razor-thin anodized aluminum unibody weighing only 1.2kg. Delivers ground-breaking speed, 18 hours of real-world battery life, and a color-calibrated 1000-nit HDR display.',
      features: [
        '15.3-inch Liquid Retina Display with True Tone',
        'Unified High-Bandwidth Memory Architecture',
        'All-Day 18-Hour Battery with MagSafe Fast Charge',
        'Six-Speaker Sound System with Spatial Audio'
      ]
    }
  };

  // Category showcase mapping (for Section 3: Explore by Category)
  const CATEGORY_MAP = {
    smartphone: {
      productId: 'prod-phone-crystal',
      badge: 'Flagship Smartphone',
      title: 'Aether Quantum 16 Pro',
      desc: 'Ultra-thin bezel titanium casing with 120Hz LTPO Amethyst Display and next-generation neural silicon.',
      price: '$999.00',
      image: 'assets/images/phone_crystal.jpg'
    },
    laptops: {
      productId: 'prod-laptop-air',
      badge: 'Ultra Computing',
      title: 'Aether Book Ultra 15',
      desc: 'Precision CNC-machined aerospace chassis, vivid HDR Retina display, and silent fanless performance.',
      price: '$1,349.00',
      image: 'assets/images/laptop_air.jpg'
    },
    headphone: {
      productId: 'prod-headphones-geometric',
      badge: 'Audiophile Acoustic',
      title: 'Aether Prism Geometric Studio',
      desc: 'Beryllium-coated 45mm diaphragms encased in faceted low-resonance polygonal chambers for unmatched clarity.',
      price: '$349.00',
      image: 'assets/images/headphones_geometric.jpg'
    },
    watch: {
      productId: 'prod-watch-sport',
      badge: 'Athletic Wearable',
      title: 'Pulse Pro GPS Sport Watch',
      desc: 'Tactical nylon loop with BioSensor 4.0 health tracking, dual-band GPS, and 14-day battery endurance.',
      price: '$220.00',
      image: 'assets/images/watch_sport.jpg'
    },
    speaker: {
      productId: 'prod-speaker-nordic',
      badge: 'Danish Scandinavian Audio',
      title: 'Nordic Soundbox Wireless',
      desc: 'Micro-perforated champagne grille with bridle leather handle, 360-degree acoustic staging, and 24h battery.',
      price: '$195.00',
      image: 'assets/images/speaker_nordic.jpg'
    }
  };

  // ==========================================
  // 2. STATE MANAGEMENT
  // ==========================================
  const state = {
    cart: JSON.parse(localStorage.getItem('aether_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('aether_wishlist') || '[]'),
    currency: 'USD',
    rates: {
      USD: { symbol: '$', rate: 1.0 },
      EUR: { symbol: '€', rate: 0.92 },
      GBP: { symbol: '£', rate: 0.79 }
    },
    activePromo: null,
    freeShippingThreshold: 150
  };

  // Save to LocalStorage
  function saveCart() {
    localStorage.setItem('aether_cart', JSON.stringify(state.cart));
  }

  function saveWishlist() {
    localStorage.setItem('aether_wishlist', JSON.stringify(state.wishlist));
  }

  // Format currency helper
  function formatPrice(amountUSD) {
    const cur = state.rates[state.currency] || state.rates.USD;
    const converted = amountUSD * cur.rate;
    return `${cur.symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Toast Notification helper
  function showToast(message, icon = '✓') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="color: #10b981; font-weight: bold;">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3100);
  }

  // ==========================================
  // 3. CART SYSTEM
  // ==========================================
  const cartTriggerBtn = document.getElementById('cartTriggerBtn');
  const cartOverlay = document.getElementById('cartOverlay');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartCountEl = document.getElementById('cartCount');
  const cartHeaderCountEl = document.getElementById('cartHeaderCount');
  const cartItemsListEl = document.getElementById('cartItemsList');
  const emptyCartView = document.getElementById('emptyCartView');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartGrandTotalEl = document.getElementById('cartGrandTotal');
  const cartDiscountEl = document.getElementById('cartDiscount');
  const discountLine = document.getElementById('discountLine');
  const shippingProgressText = document.getElementById('shippingProgressText');
  const shippingBarFill = document.getElementById('shippingBarFill');
  const startShoppingBtn = document.getElementById('startShoppingBtn');
  const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');

  function openCart() {
    cartOverlay.classList.add('open');
    cartOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartOverlay.classList.remove('open');
    cartOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (cartTriggerBtn) cartTriggerBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartOverlay) {
    cartOverlay.addEventListener('click', (e) => {
      if (e.target === cartOverlay) closeCart();
    });
  }
  if (startShoppingBtn) {
    startShoppingBtn.addEventListener('click', () => {
      closeCart();
      const el = document.getElementById('picks-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function addToCart(productId, quantity = 1) {
    const product = PRODUCTS[productId];
    if (!product) return;

    const existingIndex = state.cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
      state.cart[existingIndex].quantity += quantity;
    } else {
      state.cart.push({
        id: product.id,
        name: product.name,
        tagline: product.tagline,
        priceUSD: product.priceUSD,
        image: product.image,
        quantity: quantity
      });
    }

    saveCart();
    renderCart();
    showToast(`Added ${product.name} to cart`);
    openCart();
  }

  function updateQuantity(productId, delta) {
    const itemIndex = state.cart.findIndex(i => i.id === productId);
    if (itemIndex === -1) return;

    state.cart[itemIndex].quantity += delta;
    if (state.cart[itemIndex].quantity <= 0) {
      state.cart.splice(itemIndex, 1);
      showToast('Item removed from cart');
    }
    saveCart();
    renderCart();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(i => i.id !== productId);
    saveCart();
    renderCart();
    showToast('Item removed from cart');
  }

  function renderCart() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalUSD = state.cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);

    // Update Badges
    if (cartCountEl) cartCountEl.textContent = totalCount;
    if (cartHeaderCountEl) cartHeaderCountEl.textContent = `(${totalCount} ${totalCount === 1 ? 'item' : 'items'})`;

    // Empty State Check
    if (state.cart.length === 0) {
      if (cartItemsListEl && emptyCartView) {
        cartItemsListEl.innerHTML = '';
        cartItemsListEl.appendChild(emptyCartView);
        emptyCartView.style.display = 'flex';
      }
      if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(0);
      if (cartGrandTotalEl) cartGrandTotalEl.textContent = formatPrice(0);
      if (discountLine) discountLine.style.display = 'none';
      if (shippingProgressText) shippingProgressText.textContent = `Add ${formatPrice(state.freeShippingThreshold)} more for Free Express Delivery`;
      if (shippingBarFill) shippingBarFill.style.width = '0%';
      return;
    }

    // Render items
    if (cartItemsListEl) {
      cartItemsListEl.innerHTML = '';
      state.cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML = `
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-info">
            <div class="cart-item-title-row">
              <span class="cart-item-name">${item.name}</span>
              <button class="cart-item-remove-btn" data-remove-id="${item.id}" aria-label="Remove item">&times;</button>
            </div>
            <span class="cart-item-spec">${item.tagline}</span>
            <div class="cart-item-bottom-row">
              <div class="qty-counter">
                <button class="qty-btn" data-action="minus" data-id="${item.id}">−</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" data-action="plus" data-id="${item.id}">+</button>
              </div>
              <span class="cart-item-price">${formatPrice(item.priceUSD * item.quantity)}</span>
            </div>
          </div>
        `;
        cartItemsListEl.appendChild(row);
      });

      // Bind quantity & remove events
      cartItemsListEl.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.currentTarget.getAttribute('data-action');
          const id = e.currentTarget.getAttribute('data-id');
          updateQuantity(id, action === 'plus' ? 1 : -1);
        });
      });

      cartItemsListEl.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-remove-id');
          removeFromCart(id);
        });
      });
    }

    // Shipping Progress Meter
    const cur = state.rates[state.currency] || state.rates.USD;
    const threshold = state.freeShippingThreshold;
    const progressPercent = Math.min(100, Math.round((subtotalUSD / threshold) * 100));

    if (shippingBarFill) shippingBarFill.style.width = `${progressPercent}%`;
    if (shippingProgressText) {
      if (subtotalUSD >= threshold) {
        shippingProgressText.innerHTML = `🎉 <strong>Congratulations!</strong> You qualified for Free Express Delivery!`;
      } else {
        const remaining = threshold - subtotalUSD;
        shippingProgressText.textContent = `Add ${formatPrice(remaining)} more for Free Express Delivery`;
      }
    }

    // Discounts & Totals
    let discountAmountUSD = 0;
    if (state.activePromo === 'AETHER10') {
      discountAmountUSD = subtotalUSD * 0.1;
      if (discountLine) discountLine.style.display = 'flex';
      if (cartDiscountEl) cartDiscountEl.textContent = `-${formatPrice(discountAmountUSD)}`;
    } else {
      if (discountLine) discountLine.style.display = 'none';
    }

    const grandTotalUSD = Math.max(0, subtotalUSD - discountAmountUSD);
    if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(subtotalUSD);
    if (cartGrandTotalEl) cartGrandTotalEl.textContent = formatPrice(grandTotalUSD);
  }

  // Promo code handler
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoInput = document.getElementById('promoInput');
  if (applyPromoBtn && promoInput) {
    applyPromoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'AETHER10') {
        state.activePromo = 'AETHER10';
        showToast('Promo code applied: 10% discount!');
        renderCart();
      } else if (code === '') {
        state.activePromo = null;
        renderCart();
      } else {
        showToast('Invalid promo code. Try "AETHER10"', '!');
      }
    });
  }

  // Checkout confirmation modal
  const checkoutSuccessModal = document.getElementById('checkoutSuccessModal');
  const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');
  const checkoutModalSummary = document.getElementById('checkoutModalSummary');
  const orderTrackingCode = document.getElementById('orderTrackingCode');

  if (proceedCheckoutBtn) {
    proceedCheckoutBtn.addEventListener('click', () => {
      if (state.cart.length === 0) {
        showToast('Your cart is empty', '!');
        return;
      }

      closeCart();

      // Generate random order code
      const orderNum = Math.floor(10000 + Math.random() * 90000);
      if (orderTrackingCode) orderTrackingCode.textContent = `#AET-${orderNum}`;

      if (checkoutModalSummary) {
        const subtotalUSD = state.cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
        const discountUSD = state.activePromo ? subtotalUSD * 0.1 : 0;
        const totalUSD = subtotalUSD - discountUSD;
        checkoutModalSummary.innerHTML = `
          <div><strong>Items:</strong> ${state.cart.map(i => `${i.name} (x${i.quantity})`).join(', ')}</div>
          <div><strong>Total Paid:</strong> ${formatPrice(totalUSD)}</div>
          <div><strong>Shipping Method:</strong> Express Courier Insured (2-3 days)</div>
          <div><strong>Status:</strong> Processing Warehouse Dispatch</div>
        `;
      }

      if (checkoutSuccessModal) checkoutSuccessModal.classList.add('open');

      // Clear cart
      state.cart = [];
      state.activePromo = null;
      saveCart();
      renderCart();
    });
  }

  if (closeSuccessModalBtn && checkoutSuccessModal) {
    closeSuccessModalBtn.addEventListener('click', () => {
      checkoutSuccessModal.classList.remove('open');
    });
  }

  // ==========================================
  // 4. CURRENCY SELECTOR
  // ==========================================
  const currencySelector = document.getElementById('currencySelector');
  if (currencySelector) {
    currencySelector.addEventListener('change', (e) => {
      state.currency = e.target.value;
      updatePagePrices();
      renderCart();
      showToast(`Switched currency to ${state.currency}`);
    });
  }

  function updatePagePrices() {
    document.querySelectorAll('[data-price]').forEach(el => {
      const baseUSD = parseFloat(el.getAttribute('data-price'));
      if (!isNaN(baseUSD)) {
        el.textContent = formatPrice(baseUSD);
      }
    });

    // Update category preview price
    const currentCategory = document.querySelector('.category-item-btn.active')?.getAttribute('data-category');
    if (currentCategory && CATEGORY_MAP[currentCategory]) {
      const prodId = CATEGORY_MAP[currentCategory].productId;
      const product = PRODUCTS[prodId];
      if (product) {
        const priceTag = document.getElementById('categoryPreviewPrice');
        if (priceTag) priceTag.textContent = formatPrice(product.priceUSD);
      }
    }
  }

  // ==========================================
  // 5. SECTION 3: EXPLORE BY CATEGORY (IMAGE 4)
  // ==========================================
  const categoryButtons = document.querySelectorAll('.category-item-btn');
  const categoryPreviewImg = document.getElementById('categoryPreviewImg');
  const categoryMetaBadge = document.getElementById('categoryMetaBadge');
  const categoryPreviewTitle = document.getElementById('categoryPreviewTitle');
  const categoryPreviewDesc = document.getElementById('categoryPreviewDesc');
  const categoryPreviewPrice = document.getElementById('categoryPreviewPrice');
  const categoryActionBtn = document.getElementById('categoryActionBtn');

  function setCategory(catKey) {
    const data = CATEGORY_MAP[catKey];
    if (!data) return;

    // Update active button state
    categoryButtons.forEach(btn => {
      const isMatch = btn.getAttribute('data-category') === catKey;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    // Smooth image transition
    if (categoryPreviewImg) {
      categoryPreviewImg.classList.add('fade-out');
      setTimeout(() => {
        categoryPreviewImg.src = data.image;
        categoryPreviewImg.alt = data.title;
        categoryPreviewImg.classList.remove('fade-out');
      }, 180);
    }

    // Update text
    if (categoryMetaBadge) categoryMetaBadge.textContent = data.badge;
    if (categoryPreviewTitle) categoryPreviewTitle.textContent = data.title;
    if (categoryPreviewDesc) categoryPreviewDesc.textContent = data.desc;
    if (categoryActionBtn) categoryActionBtn.setAttribute('data-product-id', data.productId);

    // Update price using currency
    const product = PRODUCTS[data.productId];
    if (product && categoryPreviewPrice) {
      categoryPreviewPrice.textContent = formatPrice(product.priceUSD);
    }
  }

  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category');
      setCategory(cat);
    });
  });

  // Category CTA button opens quick view
  if (categoryActionBtn) {
    categoryActionBtn.addEventListener('click', (e) => {
      const prodId = e.currentTarget.getAttribute('data-product-id');
      if (prodId) openQuickView(prodId);
    });
  }

  // Footer category links also navigate & trigger category selection
  document.querySelectorAll('[data-cat-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      const cat = e.currentTarget.getAttribute('data-cat-link');
      if (cat) {
        setCategory(cat);
      }
    });
  });

  // ==========================================
  // 6. SECTION 2: FILTER TABS (IMAGE 5)
  // ==========================================
  const filterTabs = document.querySelectorAll('.filter-tab-btn');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filterType = tab.getAttribute('data-filter');
      const grid = document.getElementById('smartTechGrid');
      if (grid) {
        grid.style.opacity = '0.5';
        grid.style.transform = 'translateY(4px)';
        grid.style.transition = 'all 0.25s ease';

        setTimeout(() => {
          grid.style.opacity = '1';
          grid.style.transform = 'translateY(0)';
        }, 150);
      }
      showToast(`Showing ${tab.textContent} collection`);
    });
  });

  // ==========================================
  // 7. SECTION 5: ACCORDION FOR FAQ (IMAGE 1)
  // ==========================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question-btn');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Toggle this item
      if (isOpen) {
        item.classList.remove('open');
        questionBtn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('open');
        questionBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ==========================================
  // 8. PRODUCT QUICK VIEW MODAL
  // ==========================================
  const quickViewModal = document.getElementById('quickViewModal');
  const closeQuickViewBtn = document.getElementById('closeQuickViewBtn');
  const quickViewContent = document.getElementById('quickViewContent');

  function openQuickView(productId) {
    const p = PRODUCTS[productId];
    if (!p || !quickViewContent) return;

    quickViewContent.innerHTML = `
      <div class="qv-image-box">
        <img src="${p.image}" alt="${p.name}">
      </div>
      <div class="qv-details">
        <span class="qv-tag">${p.categoryLabel} • ${p.badge}</span>
        <h2 class="qv-title">${p.name}</h2>
        <div class="qv-price">${formatPrice(p.priceUSD)}</div>
        <p class="qv-desc">${p.description}</p>
        <ul class="qv-features-list">
          ${p.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
        <div class="qv-actions-row">
          <button class="pill-btn pill-btn-black" id="qvAddToCartBtn" data-product-id="${p.id}">
            <span>Add to Bag</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button class="pill-btn pill-btn-outline" id="qvWishlistBtn" data-product-id="${p.id}">
            Wishlist
          </button>
        </div>
      </div>
    `;

    if (quickViewModal) {
      quickViewModal.classList.add('open');
      quickViewModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Bind modal buttons
      const qvAddToCartBtn = document.getElementById('qvAddToCartBtn');
      if (qvAddToCartBtn) {
        qvAddToCartBtn.addEventListener('click', () => {
          addToCart(p.id, 1);
          closeQuickView();
        });
      }

      const qvWishlistBtn = document.getElementById('qvWishlistBtn');
      if (qvWishlistBtn) {
        qvWishlistBtn.addEventListener('click', () => {
          toggleWishlist(p.id);
        });
      }
    }
  }

  function closeQuickView() {
    if (quickViewModal) {
      quickViewModal.classList.remove('open');
      quickViewModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (closeQuickViewBtn) closeQuickViewBtn.addEventListener('click', closeQuickView);
  if (quickViewModal) {
    quickViewModal.addEventListener('click', (e) => {
      if (e.target === quickViewModal) closeQuickView();
    });
  }

  // Trigger quick view from cards
  document.querySelectorAll('.quick-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.getAttribute('data-product-id');
      if (id) openQuickView(id);
    });
  });

  // Direct "Add to Cart" pill buttons
  document.querySelectorAll('.add-to-cart-pill-btn, .pill-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.getAttribute('data-product-id');
      if (id) addToCart(id, 1);
    });
  });

  // "View All Products" button in Recently Added
  const viewAllProductsBtn = document.getElementById('viewAllProductsBtn');
  if (viewAllProductsBtn) {
    viewAllProductsBtn.addEventListener('click', () => {
      const picks = document.getElementById('picks-section');
      if (picks) picks.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ==========================================
  // 9. WISHLIST SYSTEM
  // ==========================================
  const wishlistCountEl = document.getElementById('wishlistCount');
  const wishlistTriggerBtn = document.getElementById('wishlistTriggerBtn');

  function updateWishlistBadge() {
    if (wishlistCountEl) wishlistCountEl.textContent = state.wishlist.length;
    document.querySelectorAll('.card-wishlist-toggle').forEach(btn => {
      const id = btn.getAttribute('data-product-id');
      const isSaved = state.wishlist.includes(id);
      btn.classList.toggle('active', isSaved);
    });
  }

  function toggleWishlist(productId) {
    const index = state.wishlist.indexOf(productId);
    if (index > -1) {
      state.wishlist.splice(index, 1);
      showToast('Removed from wishlist');
    } else {
      state.wishlist.push(productId);
      showToast('Saved to wishlist', '♥');
    }
    saveWishlist();
    updateWishlistBadge();
  }

  document.querySelectorAll('.card-wishlist-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.getAttribute('data-product-id');
      if (id) toggleWishlist(id);
    });
  });

  if (wishlistTriggerBtn) {
    wishlistTriggerBtn.addEventListener('click', () => {
      if (state.wishlist.length === 0) {
        showToast('Your wishlist is empty');
      } else {
        const itemNames = state.wishlist.map(id => PRODUCTS[id]?.name).filter(Boolean).join(', ');
        showToast(`Wishlist (${state.wishlist.length}): ${itemNames}`, '♥');
      }
    });
  }

  // ==========================================
  // 10. GLOBAL SEARCH OVERLAY
  // ==========================================
  const searchModal = document.getElementById('searchModal');
  const searchTriggerBtn = document.getElementById('searchTriggerBtn');
  const closeSearchBtn = document.getElementById('closeSearchBtn');
  const globalSearchInput = document.getElementById('globalSearchInput');
  const searchDynamicResults = document.getElementById('searchDynamicResults');

  function openSearch() {
    if (searchModal) {
      searchModal.classList.add('open');
      searchModal.setAttribute('aria-hidden', 'false');
      if (globalSearchInput) {
        globalSearchInput.value = '';
        setTimeout(() => globalSearchInput.focus(), 100);
      }
      renderSearchResults('');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeSearch() {
    if (searchModal) {
      searchModal.classList.remove('open');
      searchModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (searchTriggerBtn) searchTriggerBtn.addEventListener('click', openSearch);
  if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeSearch);
  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });
  }

  // Keyboard shortcut CMD+K or Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeQuickView();
      closeCart();
      const chatWin = document.getElementById('chatWidgetWindow');
      if (chatWin) chatWin.classList.remove('open');
    }
  });

  function renderSearchResults(query) {
    if (!searchDynamicResults) return;
    const q = query.toLowerCase().trim();

    const matches = Object.values(PRODUCTS).filter(p => {
      if (!q) return true;
      return p.name.toLowerCase().includes(q) ||
             p.category.toLowerCase().includes(q) ||
             p.tagline.toLowerCase().includes(q) ||
             p.description.toLowerCase().includes(q);
    });

    if (matches.length === 0) {
      searchDynamicResults.innerHTML = `<div style="text-align: center; color: #9ca3af; padding: 24px;">No matching electronics found for "${query}".</div>`;
      return;
    }

    searchDynamicResults.innerHTML = matches.map(p => `
      <div class="search-item-result" data-product-id="${p.id}">
        <img src="${p.image}" alt="${p.name}">
        <div>
          <div class="search-item-title">${p.name}</div>
          <div style="font-size: 12px; color: #6b7280;">${p.categoryLabel} • ${p.badge}</div>
        </div>
        <div class="search-item-price">${formatPrice(p.priceUSD)}</div>
      </div>
    `).join('');

    searchDynamicResults.querySelectorAll('.search-item-result').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-product-id');
        closeSearch();
        openQuickView(id);
      });
    });
  }

  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });
  }

  document.querySelectorAll('.search-tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      if (globalSearchInput) {
        globalSearchInput.value = q;
        renderSearchResults(q);
      }
    });
  });

  // ==========================================
  // 11. FLOATING CONCIERGE CHAT WIDGET
  // ==========================================
  const chatLauncherBtn = document.getElementById('chatLauncherBtn');
  const chatWidgetWindow = document.getElementById('chatWidgetWindow');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const chatForm = document.getElementById('chatForm');
  const chatInputText = document.getElementById('chatInputText');
  const chatMessages = document.getElementById('chatMessages');

  if (chatLauncherBtn && chatWidgetWindow) {
    chatLauncherBtn.addEventListener('click', () => {
      chatWidgetWindow.classList.toggle('open');
      if (chatWidgetWindow.classList.contains('open') && chatInputText) {
        setTimeout(() => chatInputText.focus(), 150);
      }
    });
  }

  if (closeChatBtn && chatWidgetWindow) {
    closeChatBtn.addEventListener('click', () => {
      chatWidgetWindow.classList.remove('open');
    });
  }

  function appendChatMessage(text, sender = 'support') {
    if (!chatMessages) return;
    const msg = document.createElement('div');
    msg.className = `chat-bubble ${sender}`;
    msg.innerHTML = `<p>${text}</p><span class="chat-time">Just now</span>`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleUserChat(userText) {
    appendChatMessage(userText, 'user');

    // Simulate intelligent concierge responses
    setTimeout(() => {
      const lower = userText.toLowerCase();
      let reply = "I would be delighted to assist with that! Our store features certified authentic devices with an official 2-year warranty and express tracked delivery.";

      if (lower.includes('deliver') || lower.includes('shipping')) {
        reply = "We offer insured nationwide delivery (2–4 business days) with free express courier dispatch on orders over $150. International shipping is also available to over 50 countries!";
      } else if (lower.includes('authentic') || lower.includes('real') || lower.includes('fake')) {
        reply = "Every single piece of hardware at Aether is 100% genuine and sourced straight from verified official manufacturers, backed by serial authenticity verification.";
      } else if (lower.includes('watch') || lower.includes('horizon')) {
        reply = "The Horizon Minimalist Smart Watch is one of our best-sellers ($289.00). It features a ceramic case, 72-hour battery life, and high-contrast 12/9/3/6 AMOLED dial.";
      } else if (lower.includes('headphone') || lower.includes('prism')) {
        reply = "The Aether Prism Studio Headphones ($349.00) use custom 45mm beryllium drivers and hybrid active noise cancellation for pristine audiophile clarity.";
      } else if (lower.includes('phone') || lower.includes('crystal')) {
        reply = "The Quantum 16 Pro Flagship ($999.00) features a titanium frame and an LTPO 120Hz display displaying intricate purple amethyst rock geodes.";
      }

      appendChatMessage(reply, 'support');
    }, 600);
  }

  if (chatForm && chatInputText) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = chatInputText.value.trim();
      if (!val) return;
      chatInputText.value = '';
      handleUserChat(val);
    });
  }

  document.querySelectorAll('.chat-prompt-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const msg = pill.getAttribute('data-msg');
      if (msg) handleUserChat(msg);
    });
  });

  // ==========================================
  // 12. FLOATING DEVICE VIEWPORT SIMULATOR
  // ==========================================
  const vpButtons = document.querySelectorAll('.vp-btn[data-vp]');
  const vpFullscreenBtn = document.getElementById('vpFullscreenBtn');

  vpButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      vpButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mode = btn.getAttribute('data-vp');
      document.body.classList.remove('sim-tablet', 'sim-mobile');

      if (mode === 'tablet') {
        document.body.classList.add('sim-tablet');
        showToast('Tablet Preview Mode (820px)');
      } else if (mode === 'mobile') {
        document.body.classList.add('sim-mobile');
        showToast('Mobile Preview Mode (430px)');
      } else {
        showToast('Desktop Mode');
      }
    });
  });

  if (vpFullscreenBtn) {
    vpFullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  // ==========================================
  // 13. NEWSLETTER & ANNOUNCEMENT BAR
  // ==========================================
  const closeAnnouncement = document.getElementById('closeAnnouncement');
  const announcementBar = document.getElementById('announcementBar');
  if (closeAnnouncement && announcementBar) {
    closeAnnouncement.addEventListener('click', () => {
      announcementBar.classList.add('hidden');
    });
  }

  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletterEmail');
      if (emailInput && emailInput.value) {
        showToast(`Thank you! ${emailInput.value} subscribed to VIP drops.`);
        emailInput.value = '';
      }
    });
  }

  // Mobile navigation menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  if (mobileMenuToggle && mobileNavDrawer) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileNavDrawer.classList.toggle('open');
    });

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileNavDrawer.classList.remove('open');
      });
    });
  }

  // Sticky header shadow on scroll
  const siteHeader = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (siteHeader) {
      siteHeader.classList.toggle('scrolled', window.scrollY > 20);
    }
  });

  // Initial render
  updateWishlistBadge();
  renderCart();
  updatePagePrices();
});
