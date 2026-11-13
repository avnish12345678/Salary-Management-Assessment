import { EmploymentStatus } from '@prisma/client';
import { z } from 'zod';

const uuid = z.string().uuid();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();

export const reportFiltersSchema = z.object({
  countryId: uuid.optional(),
  departmentId: uuid.optional(),
  employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
  currency: z
    .string()
    .length(3)
    .transform((v) => v.toUpperCase())
    .optional(),
  minSalary: z.coerce.number().min(0).optional(),
  maxSalary: z.coerce.number().min(0).optional(),
  fromDate: dateOnly,
  toDate: dateOnly,
  search: z.string().trim().max(200).optional(),
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;
