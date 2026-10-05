'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/lib/products-data';

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aether_hardware_compare');
      if (stored) {
        setCompareItems(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse compare items from storage', e);
    }
  }, []);

  const saveItems = (items: Product[]) => {
    setCompareItems(items);
    try {
      localStorage.setItem('aether_hardware_compare', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save compare items', e);
    }
  };

  const addToCompare = (product: Product): boolean => {
    if (compareItems.some((item) => item.id === product.id)) {
      removeFromCompare(product.id);
      return false;
    }

    if (compareItems.length >= 4) {
      alert('You can compare a maximum of 4 hardware units simultaneously.');
      return false;
    }

    const updated = [...compareItems, product];
    saveItems(updated);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    const updated = compareItems.filter((item) => item.id !== productId);
    saveItems(updated);
  };

  const clearCompare = () => {
    saveItems([]);
  };

  const isInCompare = (productId: string) => {
    return compareItems.some((item) => item.id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        isCompareModalOpen,
        setIsCompareModalOpen,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
