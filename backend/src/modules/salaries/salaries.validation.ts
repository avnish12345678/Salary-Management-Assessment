import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const uuid = z.string().uuid();
const money = z.coerce.number().min(0);

export const employeeIdParamsSchema = z.object({
  employeeId: uuid,
});

export const salaryHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createOrReviseSalarySchema = z
  .object({
    baseSalary: z.coerce.number().positive(),
    bonus: money.default(0),
    allowances: money.default(0),
    deductions: money.default(0),
    currency: z.string().length(3).toUpperCase(),
    effectiveFrom: dateOnly,
    changeReason: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const gross = value.baseSalary + value.bonus + value.allowances;
    if (value.deductions > gross) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Deductions cannot exceed gross salary',
        path: ['deductions'],
      });
    }
  });

export const globalHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  employeeId: uuid.optional(),
  search: z.string().trim().max(200).optional(),
});

export type CreateOrReviseSalaryInput = z.infer<typeof createOrReviseSalarySchema>;
export type SalaryHistoryQuery = z.infer<typeof salaryHistoryQuerySchema>;
export type GlobalHistoryQuery = z.infer<typeof globalHistoryQuerySchema>;
