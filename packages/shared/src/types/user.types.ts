export interface User {
  id: string;
  email: string;
  createdAt: Date;
  onboardingCompleted: boolean;
  selectedAsset: string;
  maxPerTrade: number;
  maxPerMonth: number;
  investingPaused: boolean;
}

export interface PlaidConnection {
  id: string;
  userId: string;
  itemId: string;
  institutionName: string | null;
  createdAt: Date;
  lastSyncedAt: Date | null;
}

export interface SnapTradeConnection {
  id: string;
  userId: string;
  snaptradeUserId: string;
  accountId: string | null;
  brokerageName: string | null;
  supportsNotional: boolean;
  createdAt: Date;
}

export interface UserProfile extends User {
  plaidConnections: PlaidConnection[];
  snaptradeConnection: SnapTradeConnection | null;
}
