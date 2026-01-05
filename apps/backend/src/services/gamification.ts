import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

// XP rewards for different actions
export const XP_REWARDS = {
  BEAT_TARGET: 10,
  STREAK_MULTIPLIER: 5, // × streak count
  FIRST_INVESTMENT: 50,
  COMPLETE_ONBOARDING: 25,
  ACHIEVEMENT_UNLOCKED: 25,
  CHALLENGE_COMPLETED: 50,
} as const;

// Level thresholds
export const LEVELS = [
  { level: 1, xpRequired: 0, title: 'Beginner' },
  { level: 2, xpRequired: 100, title: 'Saver' },
  { level: 3, xpRequired: 300, title: 'Investor' },
  { level: 4, xpRequired: 600, title: 'Pro Investor' },
  { level: 5, xpRequired: 1000, title: 'Wealth Builder' },
  { level: 6, xpRequired: 1500, title: 'Money Master' },
  { level: 7, xpRequired: 2500, title: 'Financial Guru' },
  { level: 8, xpRequired: 4000, title: 'Investment Legend' },
  { level: 9, xpRequired: 6000, title: 'Savings Champion' },
  { level: 10, xpRequired: 10000, title: 'Wealth Titan' },
] as const;

// Achievement definitions
export const ACHIEVEMENTS = {
  // Investment milestones
  FIRST_INVESTMENT: {
    id: 'first_investment',
    title: 'First Steps',
    description: 'Made your first investment',
    icon: '🎯',
  },
  INVESTED_100: {
    id: 'invested_100',
    title: 'Century Club',
    description: 'Invested $100 total',
    icon: '💯',
  },
  INVESTED_500: {
    id: 'invested_500',
    title: 'Serious Saver',
    description: 'Invested $500 total',
    icon: '💰',
  },
  INVESTED_1000: {
    id: 'invested_1000',
    title: 'Grand Investor',
    description: 'Invested $1,000 total',
    icon: '🏆',
  },
  INVESTED_5000: {
    id: 'invested_5000',
    title: 'High Roller',
    description: 'Invested $5,000 total',
    icon: '💎',
  },

  // Streak achievements
  STREAK_3: {
    id: 'streak_3',
    title: 'Getting Started',
    description: 'Maintained a 3-week streak',
    icon: '🔥',
  },
  STREAK_5: {
    id: 'streak_5',
    title: 'On Fire',
    description: 'Maintained a 5-week streak',
    icon: '🔥🔥',
  },
  STREAK_10: {
    id: 'streak_10',
    title: 'Unstoppable',
    description: 'Maintained a 10-week streak',
    icon: '⚡',
  },
  STREAK_25: {
    id: 'streak_25',
    title: 'Half Year Hero',
    description: 'Maintained a 25-week streak',
    icon: '🌟',
  },
  STREAK_52: {
    id: 'streak_52',
    title: 'Year of Discipline',
    description: 'Maintained a 52-week streak',
    icon: '👑',
  },

  // Savings milestones
  SAVED_100: {
    id: 'saved_100',
    title: 'Penny Pincher',
    description: 'Saved $100 by beating targets',
    icon: '🐷',
  },
  SAVED_500: {
    id: 'saved_500',
    title: 'Frugal Master',
    description: 'Saved $500 by beating targets',
    icon: '💵',
  },
  SAVED_1000: {
    id: 'saved_1000',
    title: 'Savings Superstar',
    description: 'Saved $1,000 by beating targets',
    icon: '⭐',
  },

  // Special achievements
  PERFECT_MONTH: {
    id: 'perfect_month',
    title: 'Perfect Month',
    description: 'Beat all targets every week for a month',
    icon: '🏅',
  },
  EARLY_ADOPTER: {
    id: 'early_adopter',
    title: 'Early Adopter',
    description: 'One of the first users',
    icon: '🚀',
  },
  RULE_MASTER: {
    id: 'rule_master',
    title: 'Rule Master',
    description: 'Created 5 different rules',
    icon: '📋',
  },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;

class GamificationService {
  /**
   * Award XP to a user
   */
  async awardXP(
    userId: string,
    amount: number,
    eventType: string,
    description?: string
  ): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    const currentXP = profile?.xp || 0;
    const currentLevel = profile?.level || 1;
    const newXP = currentXP + amount;
    const newLevel = this.calculateLevel(newXP);
    const leveledUp = newLevel > currentLevel;

    // Update profile
    await supabase
      .from('profiles')
      .update({ xp: newXP, level: newLevel })
      .eq('id', userId);

    // Log XP event
    await supabase.from('xp_events').insert({
      user_id: userId,
      event_type: eventType,
      xp_amount: amount,
      description,
    });

    logger.info(
      { userId, amount, eventType, newXP, newLevel, leveledUp },
      'Awarded XP'
    );

    // Check for level-up achievement
    if (leveledUp) {
      await this.checkAchievements(userId);
    }

    return { newXP, newLevel, leveledUp };
  }

  /**
   * Calculate level from XP
   */
  calculateLevel(xp: number): number {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].xpRequired) {
        return LEVELS[i].level;
      }
    }
    return 1;
  }

  /**
   * Get level info for a given level
   */
  getLevelInfo(level: number): (typeof LEVELS)[number] | undefined {
    return LEVELS.find((l) => l.level === level);
  }

  /**
   * Get XP needed for next level
   */
  getXPForNextLevel(currentXP: number): { current: number; needed: number; progress: number } {
    const currentLevel = this.calculateLevel(currentXP);
    const nextLevel = LEVELS.find((l) => l.level === currentLevel + 1);

    if (!nextLevel) {
      return { current: currentXP, needed: currentXP, progress: 100 };
    }

    const currentLevelXP = LEVELS.find((l) => l.level === currentLevel)?.xpRequired || 0;
    const xpInCurrentLevel = currentXP - currentLevelXP;
    const xpNeededForLevel = nextLevel.xpRequired - currentLevelXP;
    const progress = Math.floor((xpInCurrentLevel / xpNeededForLevel) * 100);

    return {
      current: xpInCurrentLevel,
      needed: xpNeededForLevel,
      progress,
    };
  }

  /**
   * Unlock an achievement
   */
  async unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
    const achievement = Object.values(ACHIEVEMENTS).find((a) => a.id === achievementId);
    if (!achievement) return false;

    // Check if already unlocked
    const { data: existing } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_type', achievementId)
      .single();

    if (existing) return false;

    // Unlock achievement
    const { error } = await supabase.from('achievements').insert({
      user_id: userId,
      achievement_type: achievementId,
    });

    if (error) {
      logger.error({ error, userId, achievementId }, 'Failed to unlock achievement');
      return false;
    }

    // Award XP for achievement
    await this.awardXP(
      userId,
      XP_REWARDS.ACHIEVEMENT_UNLOCKED,
      'achievement',
      `Unlocked: ${achievement.title}`
    );

    logger.info({ userId, achievementId, title: achievement.title }, 'Achievement unlocked');
    return true;
  }

  /**
   * Check and unlock any earned achievements
   */
  async checkAchievements(userId: string): Promise<string[]> {
    const unlocked: string[] = [];

    // Get user stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_invested, total_saved')
      .eq('id', userId)
      .single();

    // Get max streak
    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('streak_count')
      .eq('user_id', userId)
      .order('streak_count', { ascending: false })
      .limit(1);

    // Get order count
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'filled');

    // Get rule count
    const { count: ruleCount } = await supabase
      .from('rules')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const totalInvested = profile?.total_invested || 0;
    const totalSaved = profile?.total_saved || 0;
    const maxStreak = evaluations?.[0]?.streak_count || 0;
    const orders = orderCount || 0;
    const rules = ruleCount || 0;

    // Check investment achievements
    if (orders >= 1 && (await this.unlockAchievement(userId, 'first_investment'))) {
      unlocked.push('first_investment');
    }
    if (totalInvested >= 100 && (await this.unlockAchievement(userId, 'invested_100'))) {
      unlocked.push('invested_100');
    }
    if (totalInvested >= 500 && (await this.unlockAchievement(userId, 'invested_500'))) {
      unlocked.push('invested_500');
    }
    if (totalInvested >= 1000 && (await this.unlockAchievement(userId, 'invested_1000'))) {
      unlocked.push('invested_1000');
    }
    if (totalInvested >= 5000 && (await this.unlockAchievement(userId, 'invested_5000'))) {
      unlocked.push('invested_5000');
    }

    // Check streak achievements
    if (maxStreak >= 3 && (await this.unlockAchievement(userId, 'streak_3'))) {
      unlocked.push('streak_3');
    }
    if (maxStreak >= 5 && (await this.unlockAchievement(userId, 'streak_5'))) {
      unlocked.push('streak_5');
    }
    if (maxStreak >= 10 && (await this.unlockAchievement(userId, 'streak_10'))) {
      unlocked.push('streak_10');
    }
    if (maxStreak >= 25 && (await this.unlockAchievement(userId, 'streak_25'))) {
      unlocked.push('streak_25');
    }
    if (maxStreak >= 52 && (await this.unlockAchievement(userId, 'streak_52'))) {
      unlocked.push('streak_52');
    }

    // Check savings achievements
    if (totalSaved >= 100 && (await this.unlockAchievement(userId, 'saved_100'))) {
      unlocked.push('saved_100');
    }
    if (totalSaved >= 500 && (await this.unlockAchievement(userId, 'saved_500'))) {
      unlocked.push('saved_500');
    }
    if (totalSaved >= 1000 && (await this.unlockAchievement(userId, 'saved_1000'))) {
      unlocked.push('saved_1000');
    }

    // Check rule master
    if (rules >= 5 && (await this.unlockAchievement(userId, 'rule_master'))) {
      unlocked.push('rule_master');
    }

    return unlocked;
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string): Promise<{
    unlocked: { achievement: (typeof ACHIEVEMENTS)[keyof typeof ACHIEVEMENTS]; unlockedAt: string }[];
    locked: (typeof ACHIEVEMENTS)[keyof typeof ACHIEVEMENTS][];
  }> {
    const { data: userAchievements } = await supabase
      .from('achievements')
      .select('achievement_type, unlocked_at')
      .eq('user_id', userId);

    const unlockedIds = new Set(userAchievements?.map((a) => a.achievement_type) || []);

    const unlocked = (userAchievements || [])
      .map((ua) => {
        const achievement = Object.values(ACHIEVEMENTS).find((a) => a.id === ua.achievement_type);
        return achievement ? { achievement, unlockedAt: ua.unlocked_at } : null;
      })
      .filter(Boolean) as { achievement: (typeof ACHIEVEMENTS)[keyof typeof ACHIEVEMENTS]; unlockedAt: string }[];

    const locked = Object.values(ACHIEVEMENTS).filter((a) => !unlockedIds.has(a.id));

    return { unlocked, locked };
  }

  /**
   * Get user's gamification stats
   */
  async getUserStats(userId: string): Promise<{
    xp: number;
    level: number;
    levelTitle: string;
    nextLevelProgress: { current: number; needed: number; progress: number };
    totalInvested: number;
    totalSaved: number;
    achievementCount: number;
  }> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level, total_invested, total_saved')
      .eq('id', userId)
      .single();

    const { count: achievementCount } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const xp = profile?.xp || 0;
    const level = profile?.level || 1;
    const levelInfo = this.getLevelInfo(level);

    return {
      xp,
      level,
      levelTitle: levelInfo?.title || 'Beginner',
      nextLevelProgress: this.getXPForNextLevel(xp),
      totalInvested: profile?.total_invested || 0,
      totalSaved: profile?.total_saved || 0,
      achievementCount: achievementCount || 0,
    };
  }

  /**
   * Update user's total invested/saved amounts
   */
  async updateTotals(userId: string, investedAmount: number, savedAmount: number): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_invested, total_saved')
      .eq('id', userId)
      .single();

    await supabase
      .from('profiles')
      .update({
        total_invested: (profile?.total_invested || 0) + investedAmount,
        total_saved: (profile?.total_saved || 0) + savedAmount,
      })
      .eq('id', userId);
  }

  /**
   * Process XP for beating a target (called during evaluation)
   */
  async processTargetBeat(userId: string, savedAmount: number, streakCount: number): Promise<void> {
    // Base XP for beating target
    await this.awardXP(userId, XP_REWARDS.BEAT_TARGET, 'beat_target', 'Beat spending target');

    // Streak bonus XP
    if (streakCount > 1) {
      const streakBonus = XP_REWARDS.STREAK_MULTIPLIER * streakCount;
      await this.awardXP(userId, streakBonus, 'streak_bonus', `${streakCount}-week streak bonus`);
    }

    // Update totals
    await this.updateTotals(userId, 0, savedAmount);

    // Check for new achievements
    await this.checkAchievements(userId);
  }

  /**
   * Process XP for completed investment
   */
  async processInvestment(userId: string, amount: number, isFirstInvestment: boolean): Promise<void> {
    if (isFirstInvestment) {
      await this.awardXP(userId, XP_REWARDS.FIRST_INVESTMENT, 'first_investment', 'First investment');
    }

    // Update totals
    await this.updateTotals(userId, amount, 0);

    // Check for new achievements
    await this.checkAchievements(userId);
  }

  /**
   * Create weekly challenges for a user
   */
  async createWeeklyChallenges(userId: string): Promise<void> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Check if user already has challenges this week
    const { data: existingChallenges } = await supabase
      .from('challenges')
      .select('id')
      .eq('user_id', userId)
      .gte('starts_at', startOfWeek.toISOString())
      .limit(1);

    if (existingChallenges && existingChallenges.length > 0) {
      return; // Already has challenges
    }

    // Get user's rules to create personalized challenges
    const { data: rules } = await supabase
      .from('rules')
      .select('category, weekly_target')
      .eq('user_id', userId)
      .eq('is_active', true);

    const challenges = [];

    // Challenge 1: Beat all targets
    if (rules && rules.length > 0) {
      challenges.push({
        user_id: userId,
        challenge_type: 'weekly',
        title: 'Perfect Week',
        description: 'Beat all your spending targets this week',
        target_value: rules.length,
        xp_reward: 75,
        starts_at: startOfWeek.toISOString(),
        ends_at: endOfWeek.toISOString(),
      });
    }

    // Challenge 2: Save extra amount
    challenges.push({
      user_id: userId,
      challenge_type: 'weekly',
      title: 'Super Saver',
      description: 'Save at least $50 this week',
      target_value: 50,
      xp_reward: 50,
      starts_at: startOfWeek.toISOString(),
      ends_at: endOfWeek.toISOString(),
    });

    // Challenge 3: Maintain streak
    challenges.push({
      user_id: userId,
      challenge_type: 'weekly',
      title: 'Keep It Going',
      description: 'Maintain or extend your streak',
      target_value: 1,
      xp_reward: 30,
      starts_at: startOfWeek.toISOString(),
      ends_at: endOfWeek.toISOString(),
    });

    if (challenges.length > 0) {
      await supabase.from('challenges').insert(challenges);
      logger.info({ userId, count: challenges.length }, 'Created weekly challenges');
    }
  }

  /**
   * Get user's active challenges
   */
  async getActiveChallenges(userId: string): Promise<{
    id: string;
    challengeType: string;
    title: string;
    description: string;
    targetValue: number;
    currentValue: number;
    xpReward: number;
    progress: number;
    endsAt: string;
    completed: boolean;
  }[]> {
    const now = new Date().toISOString();

    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .is('completed_at', null);

    return (challenges || []).map((c) => ({
      id: c.id,
      challengeType: c.challenge_type,
      title: c.title,
      description: c.description || '',
      targetValue: c.target_value,
      currentValue: c.current_value || 0,
      xpReward: c.xp_reward,
      progress: Math.min(100, Math.floor(((c.current_value || 0) / c.target_value) * 100)),
      endsAt: c.ends_at,
      completed: false,
    }));
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(
    userId: string,
    challengeType: string,
    incrementBy: number
  ): Promise<void> {
    const now = new Date().toISOString();

    // Get active challenges of this type
    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_type', challengeType)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .is('completed_at', null);

    for (const challenge of challenges || []) {
      const newValue = (challenge.current_value || 0) + incrementBy;

      if (newValue >= challenge.target_value) {
        // Challenge completed!
        await supabase
          .from('challenges')
          .update({
            current_value: newValue,
            completed_at: now,
          })
          .eq('id', challenge.id);

        // Award XP
        await this.awardXP(
          userId,
          challenge.xp_reward,
          'challenge',
          `Completed: ${challenge.title}`
        );

        logger.info({ userId, challengeId: challenge.id, title: challenge.title }, 'Challenge completed');
      } else {
        // Update progress
        await supabase
          .from('challenges')
          .update({ current_value: newValue })
          .eq('id', challenge.id);
      }
    }
  }

  /**
   * Get completed challenges count
   */
  async getCompletedChallengesCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    return count || 0;
  }
}

export const gamificationService = new GamificationService();
