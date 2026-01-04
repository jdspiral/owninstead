import { z } from 'zod';

export const confirmEvaluationSchema = z.object({
  excludedTransactionIds: z.array(z.string().uuid()).optional(),
});

export const evaluationFilterSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'skipped', 'executed']).optional(),
  ruleId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ConfirmEvaluationSchema = z.infer<typeof confirmEvaluationSchema>;
export type EvaluationFilterSchema = z.infer<typeof evaluationFilterSchema>;
