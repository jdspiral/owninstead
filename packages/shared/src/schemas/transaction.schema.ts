import { z } from 'zod';

export const updateTransactionSchema = z.object({
  excluded: z.boolean().optional(),
});

export const transactionFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.string().optional(),
  excluded: z.boolean().optional(),
});

export type UpdateTransactionSchema = z.infer<typeof updateTransactionSchema>;
export type TransactionFilterSchema = z.infer<typeof transactionFilterSchema>;
