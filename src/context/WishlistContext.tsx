'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '@/lib/products-data';
import { useAuth } from '@/context/AuthContext';

interface WishlistContextType {
  wishlist: Product[];
  wishlistCount: number;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => boolean;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  isSyncing: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const prevUserIdRef = useRef<string | null>(null);

  // 1. Initial Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (user?.id) {
        const userSaved = localStorage.getItem(`aether_wishlist_user_${user.id}`);
        if (userSaved) {
          setWishlist(JSON.parse(userSaved));
        }
      } else {
        const guestSaved =
          localStorage.getItem('aether_wishlist_guest') || localStorage.getItem('aether_wishlist');
        if (guestSaved) {
          setWishlist(JSON.parse(guestSaved));
        }
      }
    } catch (e) {
      console.warn('[Wishlist] Error reading initial wishlist from localStorage', e);
    }
  }, []);

  // 2. Auth Lifecycle & Database Sync on Login / Logout
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentUserId = user?.id || null;
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = currentUserId;

    // A. User logged in (or switched account)
    if (currentUserId) {
      if (prevUserId !== currentUserId) {
        setIsSyncing(true);

        // Gather any items added while logged out (guest)
        let guestItems: Product[] = [];
        try {
          const guestRaw =
            localStorage.getItem('aether_wishlist_guest') || localStorage.getItem('aether_wishlist');
          if (guestRaw) {
            guestItems = JSON.parse(guestRaw);
          } else if (!prevUserId && wishlist.length > 0) {
            guestItems = [...wishlist];
          }
        } catch (e) {
          // ignore parsing error
        }

        // Send merge request to database
        fetch('/api/wishlist', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            localWishlist: guestItems,
            userId: currentUserId,
            email: user?.email,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && Array.isArray(data.data?.wishlist)) {
              setWishlist(data.data.wishlist);
              localStorage.setItem(
                `aether_wishlist_user_${currentUserId}`,
                JSON.stringify(data.data.wishlist)
              );
              // Clean up guest storage so items don't re-merge redundantly
              localStorage.removeItem('aether_wishlist_guest');
              localStorage.removeItem('aether_wishlist');
            }
          })
          .catch((err) => {
            console.warn('[Wishlist Sync] Error synchronizing wishlist on login:', err);
          })
          .finally(() => {
            setIsSyncing(false);
          });
      }
    } else if (prevUserId && !currentUserId) {
      // B. User logged out: clear wishlist state and reset to clean guest wishlist
      setWishlist([]);
      localStorage.removeItem('aether_wishlist_guest');
      localStorage.removeItem('aether_wishlist');
    }
  }, [user]);

  // 3. LocalStorage persistence helper
  const persistLocally = useCallback(
    (newList: Product[]) => {
      try {
        if (user?.id) {
          localStorage.setItem(`aether_wishlist_user_${user.id}`, JSON.stringify(newList));
        } else {
          localStorage.setItem('aether_wishlist_guest', JSON.stringify(newList));
          localStorage.setItem('aether_wishlist', JSON.stringify(newList));
        }
      } catch (e) {
        console.warn('[Wishlist] Local storage write warning:', e);
      }
    },
    [user]
  );

  // 4. Wishlist Operations with Immediate UI + Background Database Sync
  const addToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      const updated = [...prev, product];
      persistLocally(updated);
      return updated;
    });

    if (user?.id) {
      fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productData: product,
          action: 'add',
          userId: user.id,
          email: user.email,
        }),
      }).catch((err) => console.warn('[Wishlist DB Add Warning]', err));
    }
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      persistLocally(updated);
      return updated;
    });

    if (user?.id) {
      fetch(
        `/api/wishlist?productId=${encodeURIComponent(productId)}&userId=${encodeURIComponent(user.id)}`,
        { method: 'DELETE' }
      ).catch((err) => console.warn('[Wishlist DB Remove Warning]', err));
    }
  };

  const toggleWishlist = (product: Product): boolean => {
    const exists = wishlist.some((p) => p.id === product.id);
    if (exists) {
      removeFromWishlist(product.id);
      return false;
    } else {
      addToWishlist(product);
      return true;
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some((p) => p.id === productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
    persistLocally([]);

    if (user?.id) {
      fetch(`/api/wishlist?all=true&userId=${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
      }).catch((err) => console.warn('[Wishlist DB Clear Warning]', err));
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        isSyncing,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
