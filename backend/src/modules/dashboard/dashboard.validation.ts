import { EmploymentStatus } from '@prisma/client';
import { z } from 'zod';

const uuid = z.string().uuid();

export const dashboardFiltersSchema = z.object({
  countryId: uuid.optional(),
  departmentId: uuid.optional(),
  employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
  currency: z
    .string()
    .length(3)
    .transform((v) => v.toUpperCase())
    .optional(),
});

export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;
