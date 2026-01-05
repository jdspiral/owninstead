import { CATEGORY_MERCHANTS, PLAID_CATEGORY_MAPPING } from '@owninstead/shared';

interface Transaction {
  id: string;
  merchant_name: string | null;
  category: string[] | null;
  amount: number;
  date: string;
  excluded: boolean;
}

interface Rule {
  id: string;
  category: string;
  merchant_pattern: string | null;
}

/**
 * TransactionClassifier
 * Categorizes transactions and matches them to user rules
 */
export class TransactionClassifier {
  /**
   * Classify a transaction into a category
   * Priority: 1) Custom merchant pattern, 2) Known merchant, 3) Plaid category
   */
  classifyTransaction(transaction: Transaction): string | null {
    if (transaction.excluded) {
      return null;
    }

    const merchantName = transaction.merchant_name?.toLowerCase() || '';

    // Check against known merchants for each category
    for (const [category, merchants] of Object.entries(CATEGORY_MERCHANTS)) {
      for (const merchant of merchants) {
        if (merchantName.includes(merchant.toLowerCase())) {
          return category;
        }
      }
    }

    // Fall back to Plaid category mapping
    if (transaction.category && transaction.category.length > 0) {
      const plaidCategory = transaction.category.join(' > ');

      for (const [plaidCat, ourCategory] of Object.entries(PLAID_CATEGORY_MAPPING)) {
        if (plaidCategory.toLowerCase().includes(plaidCat.toLowerCase())) {
          return ourCategory;
        }
      }
    }

    return null;
  }

  /**
   * Check if a transaction matches a specific rule
   */
  matchesRule(transaction: Transaction, rule: Rule): boolean {
    if (transaction.excluded) {
      return false;
    }

    // If rule has a custom merchant pattern, check that first
    if (rule.merchant_pattern) {
      const merchantName = transaction.merchant_name?.toLowerCase() || '';
      const pattern = rule.merchant_pattern.toLowerCase();

      if (merchantName.includes(pattern)) {
        return true;
      }
      return false;
    }

    // Otherwise, check if transaction category matches rule category
    const txCategory = this.classifyTransaction(transaction);
    return txCategory === rule.category;
  }

  /**
   * Filter transactions that match a rule
   */
  filterMatchingTransactions(transactions: Transaction[], rule: Rule): Transaction[] {
    return transactions.filter(tx => this.matchesRule(tx, rule));
  }

  /**
   * Group transactions by category
   */
  groupByCategory(transactions: Transaction[]): Record<string, Transaction[]> {
    const grouped: Record<string, Transaction[]> = {};

    for (const tx of transactions) {
      const category = this.classifyTransaction(tx);
      if (category) {
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(tx);
      }
    }

    return grouped;
  }

  /**
   * Calculate total spend for a category
   */
  calculateCategorySpend(transactions: Transaction[], category: string): number {
    return transactions
      .filter(tx => this.classifyTransaction(tx) === category && !tx.excluded)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }
}

export const classifier = new TransactionClassifier();
