export type OrderStatus = 'pending' | 'submitted' | 'filled' | 'failed';

export interface Order {
  id: string;
  userId: string;
  evaluationId: string | null;
  snaptradeOrderId: string | null;
  symbol: string;
  amountDollars: number;
  shares: number | null;
  orderType: string;
  status: OrderStatus;
  submittedAt: Date | null;
  filledAt: Date | null;
  filledPrice: number | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface OrderWithEvaluation extends Order {
  evaluation: {
    id: string;
    ruleId: string;
    periodStart: Date;
    periodEnd: Date;
    rule: {
      category: string;
    };
  } | null;
}
