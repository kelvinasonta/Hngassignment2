// Shared in-memory orders store for development fallback
export const globalOrdersStore: Map<string, any> = (globalThis as any).__ordersStore || new Map();
(globalThis as any).__ordersStore = globalOrdersStore;
