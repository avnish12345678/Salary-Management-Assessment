import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { calculateGross, serializeMoney } from '../../utils/money';
import { currencySqlFilter, employeeSqlFilters } from '../../utils/sql-filters';
import { ReportFilters } from './reports.validation';

function employeeWhere(filters: ReportFilters): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {};
  if (filters.countryId) where.countryId = filters.countryId;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.employmentStatus) where.employmentStatus = filters.employmentStatus;
  if (filters.search) {
    const term = filters.search.trim();
    where.OR = [
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { employeeCode: { contains: term, mode: 'insensitive' } },
    ];
  }
  return where;
}

function salaryRangeSql(filters: ReportFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [];
  if (filters.minSalary !== undefined) {
    parts.push(
      Prisma.sql`AND (sr.base_salary + sr.bonus + sr.allowances) >= ${filters.minSalary}`,
    );
  }
  if (filters.maxSalary !== undefined) {
    parts.push(
      Prisma.sql`AND (sr.base_salary + sr.bonus + sr.allowances) <= ${filters.maxSalary}`,
    );
  }
  return parts.length ? Prisma.join(parts, ' ') : Prisma.empty;
}

export async function buildReports(filters: ReportFilters) {
  const empFilter = employeeSqlFilters(filters);
  const curFilter = currencySqlFilter(filters.currency);
  const rangeFilter = salaryRangeSql(filters);

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const revisionFrom = filters.fromDate
    ? new Date(`${filters.fromDate}T00:00:00.000Z`)
    : monthStart;
  const revisionTo = filters.toDate
    ? new Date(`${filters.toDate}T23:59:59.999Z`)
    : monthEnd;

  const [
    payrollByCountryRows,
    departmentRows,
    topPaidRows,
    rangeCountRows,
    revisionsThisMonth,
    recentRevisions,
  ] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        country: string;
        currency: string;
        totalPayroll: Prisma.Decimal;
        averageSalary: Prisma.Decimal;
        employeeCount: number;
      }>
    >`
      SELECT c.name AS country,
             sr.currency,
             SUM(sr.base_salary + sr.bonus + sr.allowances) AS "totalPayroll",
             AVG(sr.base_salary + sr.bonus + sr.allowances) AS "averageSalary",
             COUNT(*)::int AS "employeeCount"
      FROM salary_records sr
      INNER JOIN employees e ON e.id = sr.employee_id
      INNER JOIN countries c ON c.id = e.country_id
      WHERE sr.effective_to IS NULL
      ${empFilter}
      ${curFilter}
      ${rangeFilter}
      GROUP BY c.name, sr.currency
      ORDER BY sr.currency, c.name
    `,
    prisma.$queryRaw<
      Array<{
        department: string;
        currency: string;
        totalPayroll: Prisma.Decimal;
        averageSalary: Prisma.Decimal;
        employeeCount: number;
      }>
    >`
      SELECT d.name AS department,
             sr.currency,
             SUM(sr.base_salary + sr.bonus + sr.allowances) AS "totalPayroll",
             AVG(sr.base_salary + sr.bonus + sr.allowances) AS "averageSalary",
             COUNT(*)::int AS "employeeCount"
      FROM salary_records sr
      INNER JOIN employees e ON e.id = sr.employee_id
      INNER JOIN departments d ON d.id = e.department_id
      WHERE sr.effective_to IS NULL
      ${empFilter}
      ${curFilter}
      ${rangeFilter}
      GROUP BY d.name, sr.currency
      ORDER BY sr.currency, d.name
    `,
    prisma.$queryRaw<
      Array<{
        employeeId: string;
        employeeCode: string;
        fullName: string;
        department: string;
        country: string;
        currency: string;
        grossSalary: Prisma.Decimal;
        netSalary: Prisma.Decimal;
      }>
    >`
      SELECT * FROM (
        SELECT e.id AS "employeeId",
               e.employee_code AS "employeeCode",
               CONCAT(e.first_name, ' ', e.last_name) AS "fullName",
               d.name AS department,
               c.name AS country,
               sr.currency,
               (sr.base_salary + sr.bonus + sr.allowances) AS "grossSalary",
               (sr.base_salary + sr.bonus + sr.allowances - sr.deductions) AS "netSalary",
               ROW_NUMBER() OVER (
                 PARTITION BY sr.currency
                 ORDER BY (sr.base_salary + sr.bonus + sr.allowances) DESC
               ) AS rn
        FROM salary_records sr
        INNER JOIN employees e ON e.id = sr.employee_id
        INNER JOIN departments d ON d.id = e.department_id
        INNER JOIN countries c ON c.id = e.country_id
        WHERE sr.effective_to IS NULL
        ${empFilter}
        ${curFilter}
        ${rangeFilter}
      ) ranked
      WHERE rn <= 10
      ORDER BY currency, "grossSalary" DESC
    `,
    prisma.$queryRaw<Array<{ currency: string; count: number }>>`
      SELECT sr.currency, COUNT(*)::int AS count
      FROM salary_records sr
      INNER JOIN employees e ON e.id = sr.employee_id
      WHERE sr.effective_to IS NULL
      ${empFilter}
      ${curFilter}
      ${rangeFilter}
      GROUP BY sr.currency
      ORDER BY sr.currency
    `,
    prisma.salaryRevision.count({
      where: {
        createdAt: {
          gte: revisionFrom,
          ...(filters.toDate ? { lte: revisionTo } : { lt: monthEnd }),
        },
        employee: employeeWhere(filters),
        ...(filters.currency ? { newRecord: { currency: filters.currency } } : {}),
      },
    }),
    prisma.salaryRevision.findMany({
      where: {
        employee: employeeWhere(filters),
        ...(filters.currency ? { newRecord: { currency: filters.currency } } : {}),
        ...(filters.fromDate || filters.toDate
          ? {
              createdAt: {
                ...(filters.fromDate ? { gte: revisionFrom } : {}),
                ...(filters.toDate ? { lte: revisionTo } : {}),
              },
            }
          : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        previousRecord: true,
        newRecord: true,
        changedByUser: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const payrollByCountry = payrollByCountryRows.map((item) => ({
    country: item.country,
    currency: item.currency,
    totalPayroll: serializeMoney(item.totalPayroll),
    averageSalary: serializeMoney(item.averageSalary),
    employeeCount: Number(item.employeeCount),
  }));

  const departmentAverages = departmentRows.map((item) => ({
    department: item.department,
    currency: item.currency,
    totalPayroll: serializeMoney(item.totalPayroll),
    averageSalary: serializeMoney(item.averageSalary),
    employeeCount: Number(item.employeeCount),
  }));

  const highestPayrollByCurrency = new Map<
    string,
    { department: string; currency: string; totalPayroll: string; employeeCount: number }
  >();
  for (const item of departmentAverages) {
    const current = highestPayrollByCurrency.get(item.currency);
    if (!current || Number(item.totalPayroll) > Number(current.totalPayroll)) {
      highestPayrollByCurrency.set(item.currency, {
        department: item.department,
        currency: item.currency,
        totalPayroll: item.totalPayroll,
        employeeCount: item.employeeCount,
      });
    }
  }

  const highestAverageCountryByCurrency = new Map<
    string,
    { country: string; currency: string; averageSalary: string; employeeCount: number }
  >();
  for (const item of payrollByCountry) {
    const current = highestAverageCountryByCurrency.get(item.currency);
    if (!current || Number(item.averageSalary) > Number(current.averageSalary)) {
      highestAverageCountryByCurrency.set(item.currency, {
        country: item.country,
        currency: item.currency,
        averageSalary: item.averageSalary,
        employeeCount: item.employeeCount,
      });
    }
  }

  const previousVsCurrent = recentRevisions.map((row) => {
    const previousGross = row.previousRecord ? calculateGross(row.previousRecord) : null;
    const currentGross = calculateGross(row.newRecord);
    return {
      revisionId: row.id,
      createdAt: row.createdAt.toISOString(),
      employeeCode: row.employee.employeeCode,
      fullName: `${row.employee.firstName} ${row.employee.lastName}`,
      changedBy: row.changedByUser.email,
      changeReason: row.changeReason,
      previous: row.previousRecord
        ? {
            currency: row.previousRecord.currency,
            grossSalary: serializeMoney(previousGross!),
            netSalary: serializeMoney(previousGross!.minus(row.previousRecord.deductions)),
          }
        : null,
      current: {
        currency: row.newRecord.currency,
        grossSalary: serializeMoney(currentGross),
        netSalary: serializeMoney(currentGross.minus(row.newRecord.deductions)),
      },
      difference:
        row.previousRecord && row.previousRecord.currency === row.newRecord.currency
          ? {
              currency: row.newRecord.currency,
              grossDelta: serializeMoney(currentGross.minus(previousGross!)),
            }
          : {
              currency: null,
              grossDelta: null,
              note: !row.previousRecord
                ? 'No previous record'
                : 'Currencies differ; delta not computed across currencies',
            },
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    filters,
    answers: {
      payrollByCountry,
      highestPayrollDepartmentByCurrency: [...highestPayrollByCurrency.values()],
      averageSalaryByDepartment: departmentAverages,
      topPaidEmployees: topPaidRows.map((row) => ({
        employeeId: row.employeeId,
        employeeCode: row.employeeCode,
        fullName: row.fullName,
        department: row.department,
        country: row.country,
        currency: row.currency,
        grossSalary: serializeMoney(row.grossSalary),
        netSalary: serializeMoney(row.netSalary),
      })),
      employeesInSalaryRangeByCurrency: rangeCountRows.map((row) => ({
        currency: row.currency,
        count: Number(row.count),
        minSalary: filters.minSalary ?? null,
        maxSalary: filters.maxSalary ?? null,
      })),
      highestAverageSalaryCountryByCurrency: [...highestAverageCountryByCurrency.values()],
      salaryRevisionsThisMonth: revisionsThisMonth,
      previousVsCurrentSalary: previousVsCurrent,
    },
    notes: {
      currencyPolicy: 'All financial comparisons and rankings are scoped per currency.',
      topPaidNote: 'Top 10 highest-paid employees are computed independently within each currency.',
    },
  };
}

export function flattenReportForExport(report: Awaited<ReturnType<typeof buildReports>>) {
  const headers = [
    'section',
    'currency',
    'label',
    'metric',
    'value',
    'employeeCount',
    'extra',
  ];

  const rows: Array<Array<string | number | null>> = [];

  for (const item of report.answers.payrollByCountry) {
    rows.push([
      'payroll_by_country',
      item.currency,
      item.country,
      'total_payroll',
      item.totalPayroll,
      item.employeeCount,
      `avg=${item.averageSalary}`,
    ]);
  }

  for (const item of report.answers.highestPayrollDepartmentByCurrency) {
    rows.push([
      'highest_payroll_department',
      item.currency,
      item.department,
      'total_payroll',
      item.totalPayroll,
      item.employeeCount,
      null,
    ]);
  }

  for (const item of report.answers.averageSalaryByDepartment) {
    rows.push([
      'avg_salary_by_department',
      item.currency,
      item.department,
      'average_salary',
      item.averageSalary,
      item.employeeCount,
      `total=${item.totalPayroll}`,
    ]);
  }

  for (const item of report.answers.topPaidEmployees) {
    rows.push([
      'top_paid_employees',
      item.currency,
      item.fullName,
      'gross_salary',
      item.grossSalary,
      1,
      `${item.employeeCode}|${item.department}|${item.country}`,
    ]);
  }

  for (const item of report.answers.employeesInSalaryRangeByCurrency) {
    rows.push([
      'salary_range_count',
      item.currency,
      'in_range',
      'employee_count',
      item.count,
      item.count,
      `min=${item.minSalary ?? ''}|max=${item.maxSalary ?? ''}`,
    ]);
  }

  for (const item of report.answers.highestAverageSalaryCountryByCurrency) {
    rows.push([
      'highest_avg_country',
      item.currency,
      item.country,
      'average_salary',
      item.averageSalary,
      item.employeeCount,
      null,
    ]);
  }

  rows.push([
    'revisions_this_month',
    filtersCurrency(report.filters.currency),
    'all',
    'revision_count',
    report.answers.salaryRevisionsThisMonth,
    null,
    null,
  ]);

  for (const item of report.answers.previousVsCurrentSalary) {
    rows.push([
      'previous_vs_current',
      item.current.currency,
      item.fullName,
      'gross_delta',
      item.difference.grossDelta,
      1,
      `${item.employeeCode}|prev=${item.previous?.grossSalary ?? ''}|curr=${item.current.grossSalary}`,
    ]);
  }

  return { headers, rows };
}

function filtersCurrency(currency?: string) {
  return currency ?? 'MULTI';
}
