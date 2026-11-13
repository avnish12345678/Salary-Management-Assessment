import { EmploymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { calculateGross, serializeMoney } from '../../utils/money';
import { DashboardFilters } from './dashboard.validation';

type SalaryWithEmployee = {
  id: string;
  currency: string;
  baseSalary: Prisma.Decimal;
  bonus: Prisma.Decimal;
  allowances: Prisma.Decimal;
  deductions: Prisma.Decimal;
  employee: {
    id: string;
    employmentStatus: EmploymentStatus;
    countryId: string;
    departmentId: string;
    country: { id: string; name: string; code: string };
    department: { id: string; name: string; code: string };
  };
};

function employeeWhere(filters: DashboardFilters): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {};
  if (filters.countryId) where.countryId = filters.countryId;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.employmentStatus) where.employmentStatus = filters.employmentStatus;
  return where;
}

async function loadCurrentSalaries(filters: DashboardFilters): Promise<SalaryWithEmployee[]> {
  return prisma.salaryRecord.findMany({
    where: {
      effectiveTo: null,
      ...(filters.currency ? { currency: filters.currency } : {}),
      employee: employeeWhere(filters),
    },
    select: {
      id: true,
      currency: true,
      baseSalary: true,
      bonus: true,
      allowances: true,
      deductions: true,
      employee: {
        select: {
          id: true,
          employmentStatus: true,
          countryId: true,
          departmentId: true,
          country: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });
}

function grossOf(row: SalaryWithEmployee) {
  return calculateGross(row);
}

function pushBucket(
  map: Map<string, { key: string; label: string; currency: string; total: Prisma.Decimal; count: number }>,
  key: string,
  label: string,
  currency: string,
  amount: Prisma.Decimal,
) {
  const existing = map.get(key);
  if (existing) {
    existing.total = existing.total.plus(amount);
    existing.count += 1;
  } else {
    map.set(key, { key, label, currency, total: amount, count: 1 });
  }
}

export async function getDashboardAnalytics(filters: DashboardFilters) {
  const employeeFilter = employeeWhere(filters);

  const [totalEmployees, activeEmployees, totalDepartments, countriesCovered, salaries, revisionRows] =
    await Promise.all([
      prisma.employee.count({ where: employeeFilter }),
      prisma.employee.count({
        where: { ...employeeFilter, employmentStatus: EmploymentStatus.ACTIVE },
      }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.employee.findMany({
        where: employeeFilter,
        distinct: ['countryId'],
        select: { countryId: true },
      }),
      loadCurrentSalaries(filters),
      prisma.salaryRevision.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1),
          },
          ...(filters.currency || filters.countryId || filters.departmentId || filters.employmentStatus
            ? {
                employee: {
                  ...(filters.countryId ? { countryId: filters.countryId } : {}),
                  ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
                  ...(filters.employmentStatus
                    ? { employmentStatus: filters.employmentStatus }
                    : {}),
                },
                ...(filters.currency
                  ? { newRecord: { currency: filters.currency } }
                  : {}),
              }
            : {}),
        },
        select: { createdAt: true },
      }),
    ]);

  const payrollByCurrency = new Map<
    string,
    { currency: string; totalAnnualPayroll: Prisma.Decimal; employeeCount: number }
  >();

  const countryPayroll = new Map<
    string,
    { key: string; label: string; currency: string; total: Prisma.Decimal; count: number }
  >();
  const departmentPayroll = new Map<
    string,
    { key: string; label: string; currency: string; total: Prisma.Decimal; count: number }
  >();
  const employeesByCountry = new Map<string, { country: string; countryCode: string; count: number }>();
  const histogramByCurrency = new Map<string, Map<string, number>>();

  for (const row of salaries) {
    const gross = grossOf(row);
    const currencyBucket = payrollByCurrency.get(row.currency) ?? {
      currency: row.currency,
      totalAnnualPayroll: new Prisma.Decimal(0),
      employeeCount: 0,
    };
    currencyBucket.totalAnnualPayroll = currencyBucket.totalAnnualPayroll.plus(gross);
    currencyBucket.employeeCount += 1;
    payrollByCurrency.set(row.currency, currencyBucket);

    pushBucket(
      countryPayroll,
      `${row.employee.country.id}:${row.currency}`,
      row.employee.country.name,
      row.currency,
      gross,
    );
    pushBucket(
      departmentPayroll,
      `${row.employee.department.id}:${row.currency}`,
      row.employee.department.name,
      row.currency,
      gross,
    );

    const countryKey = row.employee.country.id;
    const countryAgg = employeesByCountry.get(countryKey) ?? {
      country: row.employee.country.name,
      countryCode: row.employee.country.code,
      count: 0,
    };
    countryAgg.count += 1;
    employeesByCountry.set(countryKey, countryAgg);

    const buckets = histogramByCurrency.get(row.currency) ?? new Map<string, number>();
    const value = Number(gross.toFixed(2));
    const bucketSize = row.currency === 'INR' ? 500000 : 25000;
    const bucketStart = Math.floor(value / bucketSize) * bucketSize;
    const label = `${bucketStart}-${bucketStart + bucketSize - 1}`;
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
    histogramByCurrency.set(row.currency, buckets);
  }

  const payrollByCurrencyList = [...payrollByCurrency.values()]
    .map((item) => ({
      currency: item.currency,
      totalAnnualPayroll: serializeMoney(item.totalAnnualPayroll),
      averageAnnualSalary: serializeMoney(
        item.employeeCount === 0
          ? new Prisma.Decimal(0)
          : item.totalAnnualPayroll.div(item.employeeCount),
      ),
      employeeCount: item.employeeCount,
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));

  const monthlyTrendsMap = new Map<string, number>();
  for (const row of revisionRows) {
    const key = `${row.createdAt.getUTCFullYear()}-${String(row.createdAt.getUTCMonth() + 1).padStart(2, '0')}`;
    monthlyTrendsMap.set(key, (monthlyTrendsMap.get(key) ?? 0) + 1);
  }

  return {
    kpis: {
      totalEmployees,
      activeEmployees,
      totalDepartments,
      countriesCovered: countriesCovered.length,
      // Financial KPIs are always currency-specific — never a single cross-currency total.
      payrollByCurrency: payrollByCurrencyList,
    },
    charts: {
      countryPayroll: [...countryPayroll.values()]
        .map((item) => ({
          country: item.label,
          currency: item.currency,
          totalPayroll: serializeMoney(item.total),
          employeeCount: item.count,
        }))
        .sort((a, b) => a.currency.localeCompare(b.currency) || a.country.localeCompare(b.country)),
      departmentPayroll: [...departmentPayroll.values()]
        .map((item) => ({
          department: item.label,
          currency: item.currency,
          totalPayroll: serializeMoney(item.total),
          employeeCount: item.count,
        }))
        .sort(
          (a, b) =>
            a.currency.localeCompare(b.currency) || a.department.localeCompare(b.department),
        ),
      departmentAverageSalary: [...departmentPayroll.values()]
        .map((item) => ({
          department: item.label,
          currency: item.currency,
          averageSalary: serializeMoney(item.total.div(item.count)),
          employeeCount: item.count,
        }))
        .sort(
          (a, b) =>
            a.currency.localeCompare(b.currency) || a.department.localeCompare(b.department),
        ),
      salaryHistogram: [...histogramByCurrency.entries()].flatMap(([currency, buckets]) =>
        [...buckets.entries()]
          .map(([bucket, count]) => ({ currency, bucket, count }))
          .sort((a, b) => a.bucket.localeCompare(b.bucket, undefined, { numeric: true })),
      ),
      employeesByCountry: [...employeesByCountry.values()].sort((a, b) => b.count - a.count),
      monthlyRevisionTrends: [...monthlyTrendsMap.entries()]
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    },
    notes: {
      annualBasis:
        'Current open gross salary is treated as annual compensation for payroll KPIs and charts.',
      currencyPolicy: 'Financial amounts are never aggregated across currencies.',
    },
  };
}
