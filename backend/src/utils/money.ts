import { Decimal } from '@prisma/client/runtime/library';

export type MoneyParts = {
  baseSalary: Decimal | string | number;
  bonus: Decimal | string | number;
  allowances: Decimal | string | number;
  deductions: Decimal | string | number;
};

function toDecimal(value: Decimal | string | number): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function calculateGross(parts: MoneyParts): Decimal {
  return toDecimal(parts.baseSalary)
    .plus(toDecimal(parts.bonus))
    .plus(toDecimal(parts.allowances));
}

export function calculateNet(parts: MoneyParts): Decimal {
  return calculateGross(parts).minus(toDecimal(parts.deductions));
}

export function serializeMoney(value: Decimal | string | number): string {
  return toDecimal(value).toFixed(2);
}

export function serializeSalaryRecord(record: {
  id: string;
  employeeId: string;
  baseSalary: Decimal;
  bonus: Decimal;
  allowances: Decimal;
  deductions: Decimal;
  currency: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const gross = calculateGross(record);
  const net = calculateNet(record);
  return {
    id: record.id,
    employeeId: record.employeeId,
    baseSalary: serializeMoney(record.baseSalary),
    bonus: serializeMoney(record.bonus),
    allowances: serializeMoney(record.allowances),
    deductions: serializeMoney(record.deductions),
    grossSalary: serializeMoney(gross),
    netSalary: serializeMoney(net),
    currency: record.currency,
    effectiveFrom: record.effectiveFrom.toISOString().slice(0, 10),
    effectiveTo: record.effectiveTo ? record.effectiveTo.toISOString().slice(0, 10) : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/** Day before a date (UTC date-only). */
export function dayBefore(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid date: ${value}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month, day));
}

export function rangesOverlap(
  aFrom: Date,
  aTo: Date | null,
  bFrom: Date,
  bTo: Date | null,
): boolean {
  const aEnd = aTo ?? new Date('9999-12-31T00:00:00.000Z');
  const bEnd = bTo ?? new Date('9999-12-31T00:00:00.000Z');
  return aFrom <= bEnd && bFrom <= aEnd;
}
