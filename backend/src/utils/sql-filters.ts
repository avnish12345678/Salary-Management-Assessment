import { EmploymentStatus, Prisma } from '@prisma/client';

export type EmployeeSqlFilters = {
  countryId?: string;
  departmentId?: string;
  employmentStatus?: EmploymentStatus;
  currency?: string;
  search?: string;
};

/** Builds AND ... fragments for employee/salary joins. Safe parameterized SQL. */
export function employeeSqlFilters(filters: EmployeeSqlFilters, alias = 'e'): Prisma.Sql {
  const parts: Prisma.Sql[] = [];

  if (filters.countryId) {
    parts.push(Prisma.sql`AND ${Prisma.raw(alias)}.country_id = ${filters.countryId}::uuid`);
  }
  if (filters.departmentId) {
    parts.push(Prisma.sql`AND ${Prisma.raw(alias)}.department_id = ${filters.departmentId}::uuid`);
  }
  if (filters.employmentStatus) {
    parts.push(
      Prisma.sql`AND ${Prisma.raw(alias)}.employment_status = CAST(${filters.employmentStatus} AS "EmploymentStatus")`,
    );
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    parts.push(Prisma.sql`AND (
      ${Prisma.raw(alias)}.first_name ILIKE ${term}
      OR ${Prisma.raw(alias)}.last_name ILIKE ${term}
      OR ${Prisma.raw(alias)}.email ILIKE ${term}
      OR ${Prisma.raw(alias)}.employee_code ILIKE ${term}
    )`);
  }

  return parts.length > 0 ? Prisma.join(parts, ' ') : Prisma.empty;
}

export function currencySqlFilter(currency: string | undefined, alias = 'sr'): Prisma.Sql {
  if (!currency) return Prisma.empty;
  return Prisma.sql`AND ${Prisma.raw(alias)}.currency = ${currency}`;
}
