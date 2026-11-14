import { EmploymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { serializeMoney } from '../../utils/money';
import { currencySqlFilter, employeeSqlFilters } from '../../utils/sql-filters';
import { DashboardFilters } from './dashboard.validation';

type AggregateRow = {
  currency: string;
  total: Prisma.Decimal;
  count: number;
  label?: string | null;
  code?: string | null;
};

type MonthRow = { month: string; count: number };
type HistogramRow = { currency: string; bucket: string; count: number };

function employeeWhere(filters: DashboardFilters): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {};
  if (filters.countryId) where.countryId = filters.countryId;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.employmentStatus) where.employmentStatus = filters.employmentStatus;
  return where;
}

export async function getDashboardAnalytics(filters: DashboardFilters) {
  const empFilter = employeeSqlFilters(filters);
  const curFilter = currencySqlFilter(filters.currency);
  const employeeFilter = employeeWhere(filters);

  const [
    totalEmployees,
    activeEmployees,
    totalDepartments,
    countriesCovered,
    payrollByCurrencyRows,
    countryPayrollRows,
    departmentPayrollRows,
    employeesByCountryRows,
    histogramRows,
    monthlyRows,
  ] = await Promise.all([
    prisma.employee.count({ where: employeeFilter }),
    prisma.employee.count({
      where: { ...employeeFilter, employmentStatus: EmploymentStatus.ACTIVE },
    }),
    prisma.department.count({ where: { isActive: true } }),
    prisma.employee.groupBy({
      by: ['countryId'],
      where: employeeFilter,
      _count: { _all: true },
    }),
    prisma.$queryRaw<AggregateRow[]>`
      SELECT sr.currency,
             SUM(sr.base_salary + sr.bonus + sr.allowances) AS total,
             COUNT(*)::int AS count
      FROM salary_records sr
      INNER JOIN employees e ON e.id = sr.employee_id
      WHERE sr.effective_to IS NULL
      ${empFilter}
      ${curFilter}
      GROUP BY sr.currency
      ORDER BY sr.currency
    `,
    prisma.$queryRaw<AggregateRow[]>`
      SELECT c.name AS label,
             c.code AS code,
             sr.currency,
             SUM(sr.base_salary + sr.bonus + sr.allowances) AS total,
             COUNT(*)::int AS count
      FROM salary_records sr
      INNER JOIN employees e ON e.id = sr.employee_id
      INNER JOIN countries c ON c.id = e.country_id
      WHERE sr.effective_to IS NULL
      ${empFilter}
      ${curFilter}
      GROUP BY c.name, c.code, sr.currency
      ORDER BY sr.currency, c.name
    `,
    prisma.$queryRaw<AggregateRow[]>`
      SELECT d.name AS label,
             d.code AS code,
             sr.currency,
             SUM(sr.base_salary + sr.bonus + sr.allowances) AS total,
             COUNT(*)::int AS count
      FROM salary_records sr
      INNER JOIN employees e ON e.id = sr.employee_id
      INNER JOIN departments d ON d.id = e.department_id
      WHERE sr.effective_to IS NULL
      ${empFilter}
      ${curFilter}
      GROUP BY d.name, d.code, sr.currency
      ORDER BY sr.currency, d.name
    `,
    prisma.$queryRaw<Array<{ country: string; countryCode: string; count: number }>>`
      SELECT c.name AS country,
             c.code AS "countryCode",
             COUNT(*)::int AS count
      FROM employees e
      INNER JOIN countries c ON c.id = e.country_id
      WHERE 1=1
      ${empFilter}
      GROUP BY c.name, c.code
      ORDER BY count DESC, c.name
    `,
    prisma.$queryRaw<HistogramRow[]>`
      SELECT sr.currency,
             CONCAT(
               (FLOOR(
                 (sr.base_salary + sr.bonus + sr.allowances)::numeric
                 / CASE WHEN sr.currency = 'INR' THEN 500000 ELSE 25000 END
               ) * CASE WHEN sr.currency = 'INR' THEN 500000 ELSE 25000 END)::bigint,
               '-',
               (FLOOR(
                 (sr.base_salary + sr.bonus + sr.allowances)::numeric
                 / CASE WHEN sr.currency = 'INR' THEN 500000 ELSE 25000 END
               ) * CASE WHEN sr.currency = 'INR' THEN 500000 ELSE 25000 END
               + CASE WHEN sr.currency = 'INR' THEN 500000 ELSE 25000 END - 1)::bigint
             ) AS bucket,
             COUNT(*)::int AS count
      FROM salary_records sr
      INNER JOIN employees e ON e.id = sr.employee_id
      WHERE sr.effective_to IS NULL
      ${empFilter}
      ${curFilter}
      GROUP BY sr.currency, bucket
      ORDER BY sr.currency, bucket
    `,
    prisma.$queryRaw<MonthRow[]>`
      SELECT TO_CHAR(DATE_TRUNC('month', r.created_at), 'YYYY-MM') AS month,
             COUNT(*)::int AS count
      FROM salary_revisions r
      INNER JOIN employees e ON e.id = r.employee_id
      INNER JOIN salary_records sr ON sr.id = r.new_record_id
      WHERE r.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
      ${empFilter}
      ${curFilter}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const payrollByCurrencyList = payrollByCurrencyRows.map((item) => ({
    currency: item.currency,
    totalAnnualPayroll: serializeMoney(item.total),
    averageAnnualSalary: serializeMoney(
      item.count === 0 ? new Prisma.Decimal(0) : new Prisma.Decimal(item.total).div(item.count),
    ),
    employeeCount: Number(item.count),
  }));

  return {
    kpis: {
      totalEmployees,
      activeEmployees,
      totalDepartments,
      countriesCovered: countriesCovered.length,
      payrollByCurrency: payrollByCurrencyList,
    },
    charts: {
      countryPayroll: countryPayrollRows.map((item) => ({
        country: item.label ?? 'Unknown',
        countryCode: item.code ?? 'XX',
        currency: item.currency,
        totalPayroll: serializeMoney(item.total),
        employeeCount: Number(item.count),
      })),
      departmentPayroll: departmentPayrollRows.map((item) => ({
        department: item.label ?? 'Unknown',
        departmentCode: item.code ?? 'UNK',
        currency: item.currency,
        totalPayroll: serializeMoney(item.total),
        employeeCount: Number(item.count),
      })),
      departmentAverageSalary: departmentPayrollRows.map((item) => ({
        department: item.label ?? 'Unknown',
        departmentCode: item.code ?? 'UNK',
        currency: item.currency,
        averageSalary: serializeMoney(new Prisma.Decimal(item.total).div(item.count)),
        employeeCount: Number(item.count),
      })),
      salaryHistogram: histogramRows.map((row) => ({
        currency: row.currency,
        bucket: row.bucket,
        count: Number(row.count),
      })),
      employeesByCountry: employeesByCountryRows.map((row) => ({
        country: row.country,
        countryCode: row.countryCode,
        count: Number(row.count),
      })),
      monthlyRevisionTrends: monthlyRows.map((row) => ({
        month: row.month,
        count: Number(row.count),
      })),
    },
    notes: {
      annualBasis:
        'Current open gross salary is treated as annual compensation for payroll KPIs and charts.',
      currencyPolicy: 'Financial amounts are never aggregated across currencies.',
    },
  };
}
