export type EvaluationStatus = 'pending' | 'confirmed' | 'skipped' | 'executed';

export interface Evaluation {
  id: string;
  userId: string;
  ruleId: string;
  periodStart: Date;
  periodEnd: Date;
  actualSpend: number;
  targetSpend: number;
  calculatedInvest: number;
  finalInvest: number | null;
  status: EvaluationStatus;
  streakCount: number;
  createdAt: Date;
}

export interface EvaluationWithRule extends Evaluation {
  rule: {
    id: string;
    category: string;
    investType: string;
    investAmount: number | null;
  };
}

export interface EvaluationWithTransactions extends EvaluationWithRule {
  transactions: {
    id: string;
    merchantName: string | null;
    amount: number;
    date: Date;
    excluded: boolean;
  }[];
}

export interface ConfirmEvaluationInput {
  excludedTransactionIds?: string[];
}
