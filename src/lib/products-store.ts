import { INITIAL_PRODUCTS, Product } from './products-data';

// Global shared store for custom products added by admin (persists across hot reloads via globalThis)
const globalForProducts = globalThis as unknown as {
  aetherCustomProducts: Product[];
  aetherProductOverrides: Map<string, Partial<Product>>;
};

if (!globalForProducts.aetherCustomProducts) {
  globalForProducts.aetherCustomProducts = [];
}

if (!globalForProducts.aetherProductOverrides) {
  globalForProducts.aetherProductOverrides = new Map<string, Partial<Product>>();
}

export const customProducts = globalForProducts.aetherCustomProducts;
export const productOverrides = globalForProducts.aetherProductOverrides;

export function addCustomProduct(prod: Product) {
  const existingIdx = customProducts.findIndex((p) => p.id === prod.id);
  if (existingIdx >= 0) {
    customProducts[existingIdx] = prod;
  } else {
    customProducts.unshift(prod);
  }
  return prod;
}

export function updateCustomProduct(id: string, updates: Partial<Product>) {
  // Check custom products first
  const customIdx = customProducts.findIndex((p) => p.id === id);
  if (customIdx >= 0) {
    customProducts[customIdx] = { ...customProducts[customIdx], ...updates };
    return customProducts[customIdx];
  }

  // Update in-memory overrides for initial products
  const current = productOverrides.get(id) || {};
  const next = { ...current, ...updates };
  productOverrides.set(id, next);

  const initial = INITIAL_PRODUCTS.find((p) => p.id === id);
  if (initial) {
    return { ...initial, ...next };
  }
  return null;
}

export function getAllMergedProducts(): Product[] {
  const custom = customProducts;
  const initial = INITIAL_PRODUCTS.map((p) => {
    const override = productOverrides.get(p.id);
    return {
      ...p,
      ...override,
      stock: override?.stock ?? p.stock,
      price: override?.price ?? p.price,
    };
  });

  const customIds = new Set(custom.map((c) => c.id));
  return [...custom, ...initial.filter((p) => !customIds.has(p.id))];
}
