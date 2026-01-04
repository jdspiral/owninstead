import { z } from 'zod';

export const ruleCategorySchema = z.enum([
  'delivery',
  'coffee',
  'rideshare',
  'restaurants',
  'bars',
  'shopping',
  'entertainment',
  'subscriptions',
  'custom',
]);

export const investTypeSchema = z.enum(['fixed', 'difference']);

export const rulePeriodSchema = z.enum(['weekly']);

export const createRuleSchema = z
  .object({
    category: ruleCategorySchema,
    merchantPattern: z.string().max(100).optional(),
    period: rulePeriodSchema.default('weekly'),
    targetSpend: z.number().min(0).max(10000),
    investType: investTypeSchema,
    investAmount: z.number().min(1).max(1000).optional(),
    streakEnabled: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.investType === 'fixed' && !data.investAmount) {
        return false;
      }
      return true;
    },
    {
      message: 'investAmount is required when investType is "fixed"',
      path: ['investAmount'],
    }
  );

export const updateRuleSchema = z.object({
  category: ruleCategorySchema.optional(),
  merchantPattern: z.string().max(100).nullable().optional(),
  targetSpend: z.number().min(0).max(10000).optional(),
  investType: investTypeSchema.optional(),
  investAmount: z.number().min(1).max(1000).nullable().optional(),
  streakEnabled: z.boolean().optional(),
  active: z.boolean().optional(),
});

export type CreateRuleSchema = z.infer<typeof createRuleSchema>;
export type UpdateRuleSchema = z.infer<typeof updateRuleSchema>;
