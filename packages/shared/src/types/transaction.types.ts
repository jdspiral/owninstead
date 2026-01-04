export interface Transaction {
  id: string;
  userId: string;
  plaidTransactionId: string;
  amount: number;
  merchantName: string | null;
  category: string[];
  date: Date;
  excluded: boolean;
  createdAt: Date;
}

export interface TransactionWithClassification extends Transaction {
  classifiedCategory: string | null;
  matchedRuleId: string | null;
}

export interface UpdateTransactionInput {
  excluded?: boolean;
}
