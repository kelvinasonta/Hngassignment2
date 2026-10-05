'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '@/lib/products-data';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  promoCode: string;
  promoDiscount: number;
  applyPromoCode: (code: string) => boolean;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
  isSyncing: boolean;
  cartAnimationKey: number;
  lastAddedQuantity: number;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscountRate, setPromoDiscountRate] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cartAnimationKey, setCartAnimationKey] = useState(0);
  const [lastAddedQuantity, setLastAddedQuantity] = useState(1);

  const prevUserIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  // 1. Initial Load & Guest Cart Retrieval
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (user?.id) {
        // Logged-in user cached cart
        const userSaved = localStorage.getItem(`aether_cart_user_${user.id}`);
        if (userSaved) {
          setCart(JSON.parse(userSaved));
        }
      } else {
        // Guest cart
        const guestSaved =
          localStorage.getItem('aether_cart_guest') || localStorage.getItem('aether_cart_v2');
        if (guestSaved) {
          setCart(JSON.parse(guestSaved));
        }
      }
    } catch (e) {
      console.warn('[Cart] Error reading initial cart from localStorage', e);
    }
  }, []);

  // 2. Synchronization on Auth State Changes (Login / Logout / Device Load)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentUserId = user?.id || null;
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = currentUserId;

    // A. User logged in (or changed account)
    if (currentUserId) {
      if (prevUserId !== currentUserId) {
        setIsSyncing(true);

        // Gather any items added while logged out (guest)
        let guestItems: CartItem[] = [];
        try {
          const guestRaw =
            localStorage.getItem('aether_cart_guest') || localStorage.getItem('aether_cart_v2');
          if (guestRaw) {
            guestItems = JSON.parse(guestRaw);
          } else if (!prevUserId && cart.length > 0) {
            guestItems = [...cart];
          }
        } catch (e) {
          // ignore parsing error
        }

        // Send merge request to database
        fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            localItems: guestItems,
            userId: currentUserId,
            email: user?.email,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && Array.isArray(data.data?.cart)) {
              setCart(data.data.cart);
              localStorage.setItem(
                `aether_cart_user_${currentUserId}`,
                JSON.stringify(data.data.cart)
              );
              // Clean up guest local storage so items don't re-merge redundantly
              localStorage.removeItem('aether_cart_guest');
              localStorage.removeItem('aether_cart_v2');
            }
          })
          .catch((err) => {
            console.warn('[Cart Sync] Error synchronizing cart on login:', err);
          })
          .finally(() => {
            setIsSyncing(false);
            isInitializedRef.current = true;
          });
      }
    } else if (prevUserId && !currentUserId) {
      // B. User logged out: clear state and reset to clean guest cart
      setCart([]);
      localStorage.removeItem('aether_cart_guest');
      localStorage.removeItem('aether_cart_v2');
      isInitializedRef.current = true;
    } else {
      isInitializedRef.current = true;
    }
  }, [user]);

  // 3. LocalStorage persistence helper
  const persistLocally = useCallback(
    (newCart: CartItem[]) => {
      try {
        if (user?.id) {
          localStorage.setItem(`aether_cart_user_${user.id}`, JSON.stringify(newCart));
        } else {
          localStorage.setItem('aether_cart_guest', JSON.stringify(newCart));
          localStorage.setItem('aether_cart_v2', JSON.stringify(newCart));
        }
      } catch (e) {
        console.warn('[Cart] Local storage write warning:', e);
      }
    },
    [user]
  );

  // 4. Cart Operations with Instant UI + Asynchronous Database Sync
  const addToCart = (product: Product, quantity: number = 1) => {
    const sanitizedQty = Math.max(1, quantity);

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + sanitizedQty } : item
        );
      } else {
        updated = [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: sanitizedQty,
            category: product.category,
          },
        ];
      }
      persistLocally(updated);
      return updated;
    });

    // Trigger cart entry animation on icon without opening cart drawer
    setCartAnimationKey((k) => k + 1);
    setLastAddedQuantity(sanitizedQty);

    // If logged in, update DB record immediately
    if (user?.id) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: sanitizedQty,
          productData: product,
          userId: user.id,
          email: user.email,
        }),
      }).catch((err) => console.warn('[Cart DB Update Warning]', err));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.id !== productId);
      persistLocally(updated);
      return updated;
    });

    // If logged in, remove from DB
    if (user?.id) {
      fetch(
        `/api/cart?productId=${encodeURIComponent(productId)}&userId=${encodeURIComponent(user.id)}`,
        { method: 'DELETE' }
      ).catch((err) => console.warn('[Cart DB Remove Warning]', err));
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) => {
      const updated = prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
      persistLocally(updated);
      return updated;
    });

    // If logged in, update DB exact quantity
    if (user?.id) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity,
          setExactQuantity: true,
          userId: user.id,
          email: user.email,
        }),
      }).catch((err) => console.warn('[Cart DB Update Warning]', err));
    }
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode('');
    setPromoDiscountRate(0);
    persistLocally([]);

    if (user?.id) {
      fetch(`/api/cart?all=true&userId=${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
      }).catch((err) => console.warn('[Cart DB Clear Warning]', err));
    }
  };

  const applyPromoCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'WELCOME10') {
      setPromoCode(clean);
      setPromoDiscountRate(0.1);
      return true;
    } else if (clean === 'TECH20') {
      setPromoCode(clean);
      setPromoDiscountRate(0.2);
      return true;
    }
    return false;
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const promoDiscount = subtotal * promoDiscountRate;
  const shipping = subtotal > 150 || subtotal === 0 ? 0 : 15;
  const tax = Math.round((subtotal - promoDiscount) * 0.08 * 100) / 100;
  const total = Math.max(0, Math.round((subtotal - promoDiscount + tax + shipping) * 100) / 100);
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isInCart = useCallback(
    (productId: string): boolean => {
      return cart.some((item) => item.id === productId);
    },
    [cart]
  );

  const getItemQuantity = useCallback(
    (productId: string): number => {
      return cart.find((item) => item.id === productId)?.quantity || 0;
    },
    [cart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        promoCode,
        promoDiscount,
        applyPromoCode,
        subtotal,
        tax,
        shipping,
        total,
        itemCount,
        isSyncing,
        cartAnimationKey,
        lastAddedQuantity,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
