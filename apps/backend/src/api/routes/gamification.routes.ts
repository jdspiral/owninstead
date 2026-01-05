import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { gamificationService, ACHIEVEMENTS, LEVELS } from '../../services/gamification.js';

export const gamificationRoutes = Router();

// All routes require authentication
gamificationRoutes.use(authMiddleware);

// Get user's gamification stats
gamificationRoutes.get('/stats', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const stats = await gamificationService.getUserStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's achievements
gamificationRoutes.get('/achievements', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const achievements = await gamificationService.getUserAchievements(userId);

    res.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    next(error);
  }
});

// Get all available achievements with user's unlock status
gamificationRoutes.get('/achievements/all', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const userAchievements = await gamificationService.getUserAchievements(userId);
    const unlockedMap = new Map(
      userAchievements.unlocked.map((a) => [a.achievement.id, a.unlockedAt])
    );

    const allAchievements = Object.values(ACHIEVEMENTS).map((achievement) => ({
      type: achievement.id,
      name: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      unlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id) || null,
    }));

    res.json({
      success: true,
      data: allAchievements,
    });
  } catch (error) {
    next(error);
  }
});

// Get level definitions
gamificationRoutes.get('/levels', async (_req, res, next) => {
  try {
    res.json({
      success: true,
      data: LEVELS,
    });
  } catch (error) {
    next(error);
  }
});

// Manually check achievements (useful for catching up)
gamificationRoutes.post('/achievements/check', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const unlocked = await gamificationService.checkAchievements(userId);

    res.json({
      success: true,
      data: {
        newlyUnlocked: unlocked,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get active challenges
gamificationRoutes.get('/challenges', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    // Create challenges if needed
    await gamificationService.createWeeklyChallenges(userId);

    const challenges = await gamificationService.getActiveChallenges(userId);

    res.json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    next(error);
  }
});
