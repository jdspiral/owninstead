export type RuleCategory =
  | 'delivery'
  | 'coffee'
  | 'rideshare'
  | 'restaurants'
  | 'bars'
  | 'shopping'
  | 'entertainment'
  | 'subscriptions'
  | 'custom';

export type InvestType = 'fixed' | 'difference';

export type RulePeriod = 'weekly';

export interface Rule {
  id: string;
  userId: string;
  category: RuleCategory;
  merchantPattern: string | null;
  period: RulePeriod;
  targetSpend: number;
  investType: InvestType;
  investAmount: number | null; // For fixed type
  streakEnabled: boolean;
  active: boolean;
  createdAt: Date;
}

export interface CreateRuleInput {
  category: RuleCategory;
  merchantPattern?: string;
  period?: RulePeriod;
  targetSpend: number;
  investType: InvestType;
  investAmount?: number;
  streakEnabled?: boolean;
}

export interface UpdateRuleInput {
  category?: RuleCategory;
  merchantPattern?: string | null;
  targetSpend?: number;
  investType?: InvestType;
  investAmount?: number | null;
  streakEnabled?: boolean;
  active?: boolean;
}
