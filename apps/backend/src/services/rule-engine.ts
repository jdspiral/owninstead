import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { classifier } from './classifier.js';

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
  user_id: string;
  category: string;
  merchant_pattern: string | null;
  period: string;
  target_spend: number;
  invest_type: string;
  invest_amount: number | null;
  streak_enabled: boolean;
  active: boolean;
}

interface Profile {
  id: string;
  max_per_trade: number;
  max_per_month: number;
  investing_paused: boolean;
}

interface EvaluationResult {
  ruleId: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  actualSpend: number;
  targetSpend: number;
  calculatedInvest: number;
  cappedInvest: number;
  streakCount: number;
  matchingTransactionIds: string[];
}

/**
 * RuleEngine
 * Evaluates spending rules and calculates investment amounts
 */
export class RuleEngine {
  /**
   * Get the start and end of the current week (Sunday to Saturday)
   */
  getCurrentWeekRange(): { start: Date; end: Date } {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday

    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Get the previous week range
   */
  getPreviousWeekRange(): { start: Date; end: Date } {
    const { start: currentStart } = this.getCurrentWeekRange();

    const end = new Date(currentStart);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    return { start, end };
  }

  /**
   * Evaluate a single rule against transactions
   */
  async evaluateRule(
    rule: Rule,
    transactions: Transaction[],
    profile: Profile
  ): Promise<EvaluationResult> {
    const { start, end } = this.getPreviousWeekRange();

    // Filter transactions to the evaluation period
    const periodTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    });

    // Find matching transactions for this rule
    const matchingTransactions = classifier.filterMatchingTransactions(
      periodTransactions,
      rule
    );

    // Calculate actual spend
    const actualSpend = matchingTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    // Get streak count from previous evaluations
    const streakCount = await this.getStreakCount(rule.id);

    // Calculate investment amount
    let calculatedInvest = 0;

    if (actualSpend < rule.target_spend) {
      // User beat the target!
      if (rule.invest_type === 'difference') {
        calculatedInvest = rule.target_spend - actualSpend;
      } else if (rule.invest_type === 'fixed' && rule.invest_amount) {
        calculatedInvest = rule.invest_amount;
      }

      // Apply streak bonus (10% per week)
      if (rule.streak_enabled && streakCount > 0) {
        const bonus = calculatedInvest * (streakCount * 0.1);
        calculatedInvest += bonus;
      }
    }

    // Apply caps
    const cappedInvest = await this.applyCaps(
      calculatedInvest,
      profile,
      rule.user_id
    );

    return {
      ruleId: rule.id,
      userId: rule.user_id,
      periodStart: start,
      periodEnd: end,
      actualSpend,
      targetSpend: rule.target_spend,
      calculatedInvest,
      cappedInvest,
      streakCount: actualSpend < rule.target_spend ? streakCount + 1 : 0,
      matchingTransactionIds: matchingTransactions.map(tx => tx.id),
    };
  }

  /**
   * Evaluate all active rules for a user
   */
  async evaluateUserRules(userId: string): Promise<EvaluationResult[]> {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile || profile.investing_paused) {
      return [];
    }

    // Get active rules
    const { data: rules } = await supabase
      .from('rules')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (!rules || rules.length === 0) {
      return [];
    }

    // Get transactions from the past week
    const { start, end } = this.getPreviousWeekRange();
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0]);

    // Evaluate each rule
    const results: EvaluationResult[] = [];
    for (const rule of rules) {
      const result = await this.evaluateRule(
        rule,
        transactions || [],
        profile
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Create evaluation records in the database
   */
  async createEvaluations(userId: string): Promise<void> {
    const results = await this.evaluateUserRules(userId);

    for (const result of results) {
      // Check if evaluation already exists for this period
      const { data: existing } = await supabase
        .from('evaluations')
        .select('id')
        .eq('rule_id', result.ruleId)
        .eq('period_start', result.periodStart.toISOString().split('T')[0])
        .single();

      if (existing) {
        continue; // Skip if already evaluated
      }

      const { error } = await supabase.from('evaluations').insert({
        user_id: result.userId,
        rule_id: result.ruleId,
        period_start: result.periodStart.toISOString().split('T')[0],
        period_end: result.periodEnd.toISOString().split('T')[0],
        actual_spend: result.actualSpend,
        target_spend: result.targetSpend,
        calculated_invest: result.calculatedInvest,
        final_invest: result.cappedInvest,
        status: result.cappedInvest > 0 ? 'pending' : 'skipped',
        streak_count: result.streakCount,
      });

      if (error) {
        logger.error({ error, ruleId: result.ruleId }, 'Failed to create evaluation');
      } else {
        logger.info(
          {
            ruleId: result.ruleId,
            actualSpend: result.actualSpend,
            targetSpend: result.targetSpend,
            invest: result.cappedInvest,
          },
          'Created evaluation'
        );
      }
    }
  }

  /**
   * Get current streak count for a rule
   */
  private async getStreakCount(ruleId: string): Promise<number> {
    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('streak_count')
      .eq('rule_id', ruleId)
      .order('period_end', { ascending: false })
      .limit(1);

    if (evaluations && evaluations.length > 0) {
      return evaluations[0].streak_count || 0;
    }
    return 0;
  }

  /**
   * Apply per-trade and monthly caps
   */
  private async applyCaps(
    amount: number,
    profile: Profile,
    userId: string
  ): Promise<number> {
    if (amount <= 0) return 0;

    // Per-trade cap
    let capped = Math.min(amount, profile.max_per_trade);

    // Monthly cap
    const monthlyInvested = await this.getMonthlyInvested(userId);
    const remainingMonthly = profile.max_per_month - monthlyInvested;

    if (remainingMonthly <= 0) {
      return 0;
    }

    capped = Math.min(capped, remainingMonthly);

    return Math.round(capped * 100) / 100; // Round to cents
  }

  /**
   * Get total invested this month
   */
  private async getMonthlyInvested(userId: string): Promise<number> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: orders } = await supabase
      .from('orders')
      .select('amount_dollars')
      .eq('user_id', userId)
      .eq('status', 'filled')
      .gte('filled_at', monthStart.toISOString());

    if (!orders) return 0;

    return orders.reduce((sum, order) => sum + (order.amount_dollars || 0), 0);
  }

  /**
   * Preview current week's progress (without creating evaluations)
   */
  async previewCurrentWeek(userId: string): Promise<{
    rules: Array<{
      ruleId: string;
      category: string;
      targetSpend: number;
      currentSpend: number;
      projectedInvest: number;
      onTrack: boolean;
    }>;
  }> {
    const { start } = this.getCurrentWeekRange();

    // Get active rules
    const { data: rules } = await supabase
      .from('rules')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (!rules) {
      return { rules: [] };
    }

    // Get this week's transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', start.toISOString().split('T')[0]);

    const results = rules.map(rule => {
      const matching = classifier.filterMatchingTransactions(
        transactions || [],
        rule
      );
      const currentSpend = matching.reduce((sum, tx) => sum + tx.amount, 0);
      const onTrack = currentSpend <= rule.target_spend;

      let projectedInvest = 0;
      if (onTrack) {
        if (rule.invest_type === 'difference') {
          projectedInvest = rule.target_spend - currentSpend;
        } else if (rule.invest_amount) {
          projectedInvest = rule.invest_amount;
        }
      }

      return {
        ruleId: rule.id,
        category: rule.category,
        targetSpend: rule.target_spend,
        currentSpend,
        projectedInvest,
        onTrack,
      };
    });

    return { rules: results };
  }
}

export const ruleEngine = new RuleEngine();
