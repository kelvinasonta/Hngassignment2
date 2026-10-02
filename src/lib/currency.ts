// Currency configuration and formatting utility

export const DEFAULT_CURRENCY =
  process.env.NEXT_PUBLIC_STORE_CURRENCY ||
  process.env.PAYSTACK_CURRENCY ||
  'NGN';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  JPY: '¥',
};

/**
 * Returns active 3-letter currency code (e.g. 'NGN')
 */
export const getStoreCurrency = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('aether_currency');
    if (saved) return saved.toUpperCase();
  }
  return (DEFAULT_CURRENCY || 'NGN').toUpperCase();
};

/**
 * Returns symbol for given or active currency (e.g. '₦')
 */
export const getCurrencySymbol = (currency?: string): string => {
  const code = (currency || getStoreCurrency()).toUpperCase();
  return CURRENCY_SYMBOLS[code] || `${code} `;
};

/**
 * Formats a numeric price into a localized currency string (e.g. "₦1,299.00")
 */
export const formatPrice = (amount: number, currency?: string): string => {
  const code = (currency || getStoreCurrency()).toUpperCase();
  const symbol = getCurrencySymbol(code);
  const num = Number(amount || 0);

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formatted}`;
};
