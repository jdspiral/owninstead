export const RULE_CATEGORIES = {
  DELIVERY: 'delivery',
  COFFEE: 'coffee',
  RIDESHARE: 'rideshare',
  RESTAURANTS: 'restaurants',
  BARS: 'bars',
  SHOPPING: 'shopping',
  ENTERTAINMENT: 'entertainment',
  SUBSCRIPTIONS: 'subscriptions',
  CUSTOM: 'custom',
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  delivery: 'Food Delivery',
  coffee: 'Coffee Shops',
  rideshare: 'Rideshare',
  restaurants: 'Restaurants',
  bars: 'Bars & Nightlife',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  subscriptions: 'Subscriptions',
  custom: 'Custom',
};

export const CATEGORY_MERCHANTS: Record<string, string[]> = {
  delivery: [
    'doordash',
    'uber eats',
    'ubereats',
    'grubhub',
    'postmates',
    'seamless',
    'caviar',
    'instacart',
  ],
  coffee: [
    'starbucks',
    'dunkin',
    'peet',
    'blue bottle',
    'philz',
    'coffee bean',
    'caribou coffee',
  ],
  rideshare: ['uber', 'lyft', 'via'],
  restaurants: [], // Use Plaid category instead
  bars: ['bar', 'pub', 'tavern', 'brewery', 'winery'],
  shopping: ['amazon', 'target', 'walmart', 'costco', 'best buy'],
  entertainment: ['netflix', 'spotify', 'hulu', 'disney+', 'hbo', 'apple tv'],
  subscriptions: [], // Use Plaid category instead
};

export const PLAID_CATEGORY_MAPPING: Record<string, string> = {
  'Food and Drink > Restaurants': 'restaurants',
  'Food and Drink > Coffee Shop': 'coffee',
  'Food and Drink > Bar': 'bars',
  'Travel > Taxi': 'rideshare',
  'Shops > Supermarkets and Groceries': 'shopping',
  'Recreation > Arts and Entertainment': 'entertainment',
  'Service > Subscription': 'subscriptions',
};
