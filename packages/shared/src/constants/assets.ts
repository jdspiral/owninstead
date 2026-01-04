export const SUPPORTED_ASSETS = [
  {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    description: 'Tracks the entire U.S. stock market',
  },
  {
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    description: 'Tracks the S&P 500 index',
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    description: 'Tracks the S&P 500 index',
  },
] as const;

export const DEFAULT_ASSET = 'VTI';

export const DEFAULT_MAX_PER_TRADE = 100;
export const DEFAULT_MAX_PER_MONTH = 500;

export const MAX_RULES_FREE_TIER = 1;
export const MAX_RULES_PAID_TIER = 10;

export const SUBSCRIPTION_PRICE_MONTHLY = 6;
