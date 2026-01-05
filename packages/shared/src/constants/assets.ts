export interface ETFAsset {
  symbol: string;
  name: string;
  description: string;
}

export interface ETFCategory {
  id: string;
  label: string;
  assets: ETFAsset[];
}

// Curated ETF categories
export const CURATED_ETFS: ETFCategory[] = [
  {
    id: 'us-index',
    label: 'U.S. Index Funds',
    assets: [
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', description: 'Entire U.S. market' },
      { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', description: 'S&P 500 index' },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', description: 'S&P 500 index' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', description: 'Nasdaq-100 index' },
      { symbol: 'IWM', name: 'iShares Russell 2000 ETF', description: 'Small-cap U.S. stocks' },
    ],
  },
  {
    id: 'international',
    label: 'International',
    assets: [
      { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', description: 'Ex-U.S. stocks' },
      { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', description: 'Developed markets' },
      { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', description: 'Emerging markets' },
    ],
  },
  {
    id: 'bonds',
    label: 'Bonds',
    assets: [
      { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', description: 'U.S. investment-grade bonds' },
      { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', description: 'U.S. bond market' },
    ],
  },
];

// Flat list of all curated ETFs (for backward compatibility)
export const SUPPORTED_ASSETS = CURATED_ETFS.flatMap((category) => category.assets);

export const DEFAULT_ASSET = 'VTI';

export const DEFAULT_MAX_PER_TRADE = 100;
export const DEFAULT_MAX_PER_MONTH = 500;

export const MAX_RULES_FREE_TIER = 1;
export const MAX_RULES_PAID_TIER = 10;

export const SUBSCRIPTION_PRICE_MONTHLY = 6;
