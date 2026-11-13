import { EmploymentStatus } from '@prisma/client';
import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const uuid = z.string().uuid();

export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  departmentId: uuid.optional(),
  countryId: uuid.optional(),
  employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
  designation: z.string().trim().max(100).optional(),
  sortBy: z.enum(['joiningDate', 'name', 'employeeCode']).default('joiningDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const employeeCreateSchema = z.object({
  employeeCode: z.string().trim().min(3).max(32),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(32).optional().nullable(),
  departmentId: uuid,
  designation: z.string().trim().min(1).max(100),
  countryId: uuid,
  city: z.string().trim().min(1).max(100),
  joiningDate: dateOnly,
  employmentStatus: z.nativeEnum(EmploymentStatus).default(EmploymentStatus.ACTIVE),
  managerId: uuid.optional().nullable(),
  initialSalary: z
    .object({
      baseSalary: z.coerce.number().positive(),
      bonus: z.coerce.number().min(0).default(0),
      allowances: z.coerce.number().min(0).default(0),
      deductions: z.coerce.number().min(0).default(0),
      currency: z.string().length(3).toUpperCase(),
      effectiveFrom: dateOnly,
    })
    .optional(),
});

export const employeeUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().max(32).optional().nullable(),
  departmentId: uuid.optional(),
  designation: z.string().trim().min(1).max(100).optional(),
  countryId: uuid.optional(),
  city: z.string().trim().min(1).max(100).optional(),
  joiningDate: dateOnly.optional(),
  managerId: uuid.optional().nullable(),
});

export const employeeStatusSchema = z.object({
  employmentStatus: z.nativeEnum(EmploymentStatus),
});

export const employeeIdParamsSchema = z.object({
  id: uuid,
});

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
