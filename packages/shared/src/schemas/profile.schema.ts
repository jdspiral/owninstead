import { z } from 'zod';

export const updateProfileSchema = z.object({
  selectedAsset: z.string().max(10).optional(),
  maxPerTrade: z.number().min(1).max(10000).optional(),
  maxPerMonth: z.number().min(1).max(50000).optional(),
  investingPaused: z.boolean().optional(),
});

export const safetyLimitsSchema = z.object({
  maxPerTrade: z.number().min(1).max(10000),
  maxPerMonth: z.number().min(1).max(50000),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type SafetyLimitsSchema = z.infer<typeof safetyLimitsSchema>;
