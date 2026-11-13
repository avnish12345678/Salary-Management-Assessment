import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { calculateGross, serializeMoney } from '../../utils/money';
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

async function loadCurrentSalaries(filters: ReportFilters) {
  return prisma.salaryRecord.findMany({
    where: {
      effectiveTo: null,
      ...(filters.currency ? { currency: filters.currency } : {}),
      employee: employeeWhere(filters),
    },
    include: {
      employee: {
        include: {
          country: true,
          department: true,
        },
      },
    },
  });
}

function withinRange(gross: Prisma.Decimal, filters: ReportFilters) {
  const value = Number(gross.toFixed(2));
  if (filters.minSalary !== undefined && value < filters.minSalary) return false;
  if (filters.maxSalary !== undefined && value > filters.maxSalary) return false;
  return true;
}

export async function buildReports(filters: ReportFilters) {
  const salaries = await loadCurrentSalaries(filters);
  const filtered = salaries.filter((row) => withinRange(calculateGross(row), filters));

  const payrollByCountryMap = new Map<
    string,
    { country: string; currency: string; totalPayroll: Prisma.Decimal; employeeCount: number }
  >();
  const payrollByDepartmentMap = new Map<
    string,
    { department: string; currency: string; totalPayroll: Prisma.Decimal; employeeCount: number }
  >();

  for (const row of filtered) {
    const gross = calculateGross(row);
    const countryKey = `${row.employee.country.name}:${row.currency}`;
    const deptKey = `${row.employee.department.name}:${row.currency}`;

    const country = payrollByCountryMap.get(countryKey) ?? {
      country: row.employee.country.name,
      currency: row.currency,
      totalPayroll: new Prisma.Decimal(0),
      employeeCount: 0,
    };
    country.totalPayroll = country.totalPayroll.plus(gross);
    country.employeeCount += 1;
    payrollByCountryMap.set(countryKey, country);

    const dept = payrollByDepartmentMap.get(deptKey) ?? {
      department: row.employee.department.name,
      currency: row.currency,
      totalPayroll: new Prisma.Decimal(0),
      employeeCount: 0,
    };
    dept.totalPayroll = dept.totalPayroll.plus(gross);
    dept.employeeCount += 1;
    payrollByDepartmentMap.set(deptKey, dept);
  }

  const payrollByCountry = [...payrollByCountryMap.values()]
    .map((item) => ({
      country: item.country,
      currency: item.currency,
      totalPayroll: serializeMoney(item.totalPayroll),
      averageSalary: serializeMoney(item.totalPayroll.div(item.employeeCount)),
      employeeCount: item.employeeCount,
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency) || a.country.localeCompare(b.country));

  const departmentAverages = [...payrollByDepartmentMap.values()]
    .map((item) => ({
      department: item.department,
      currency: item.currency,
      totalPayroll: serializeMoney(item.totalPayroll),
      averageSalary: serializeMoney(item.totalPayroll.div(item.employeeCount)),
      employeeCount: item.employeeCount,
    }))
    .sort(
      (a, b) => a.currency.localeCompare(b.currency) || a.department.localeCompare(b.department),
    );

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

  type TopPaid = {
    employeeId: string;
    employeeCode: string;
    fullName: string;
    department: string;
    country: string;
    currency: string;
    grossSalary: string;
    netSalary: string;
  };

  const ranked: TopPaid[] = [...filtered]
    .map((row) => {
      const gross = calculateGross(row);
      return {
        employeeId: row.employee.id,
        employeeCode: row.employee.employeeCode,
        fullName: `${row.employee.firstName} ${row.employee.lastName}`,
        department: row.employee.department.name,
        country: row.employee.country.name,
        currency: row.currency,
        grossSalary: serializeMoney(gross),
        netSalary: serializeMoney(gross.minus(row.deductions)),
      };
    })
    .sort((a, b) => {
      if (a.currency !== b.currency) return a.currency.localeCompare(b.currency);
      return Number(b.grossSalary) - Number(a.grossSalary);
    });

  const topPaidEmployees: TopPaid[] = [];
  const topCounts = new Map<string, number>();
  for (const item of ranked) {
    const count = topCounts.get(item.currency) ?? 0;
    if (count >= 10) continue;
    topPaidEmployees.push(item);
    topCounts.set(item.currency, count + 1);
  }

  const salaryRangeCountByCurrency = new Map<string, number>();
  for (const row of filtered) {
    salaryRangeCountByCurrency.set(
      row.currency,
      (salaryRangeCountByCurrency.get(row.currency) ?? 0) + 1,
    );
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const revisionsThisMonth = await prisma.salaryRevision.count({
    where: {
      createdAt: {
        gte: filters.fromDate ? new Date(`${filters.fromDate}T00:00:00.000Z`) : monthStart,
        lt: filters.toDate ? new Date(`${filters.toDate}T23:59:59.999Z`) : monthEnd,
      },
      employee: employeeWhere(filters),
      ...(filters.currency ? { newRecord: { currency: filters.currency } } : {}),
    },
  });

  const recentRevisions = await prisma.salaryRevision.findMany({
    where: {
      employee: employeeWhere(filters),
      ...(filters.currency ? { newRecord: { currency: filters.currency } } : {}),
      ...(filters.fromDate || filters.toDate
        ? {
            createdAt: {
              ...(filters.fromDate
                ? { gte: new Date(`${filters.fromDate}T00:00:00.000Z`) }
                : {}),
              ...(filters.toDate ? { lte: new Date(`${filters.toDate}T23:59:59.999Z`) } : {}),
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
  });

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
              note:
                !row.previousRecord
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
      topPaidEmployees,
      employeesInSalaryRangeByCurrency: [...salaryRangeCountByCurrency.entries()].map(
        ([currency, count]) => ({
          currency,
          count,
          minSalary: filters.minSalary ?? null,
          maxSalary: filters.maxSalary ?? null,
        }),
      ),
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
