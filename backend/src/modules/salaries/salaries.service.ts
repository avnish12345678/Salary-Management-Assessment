import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors';
import {
  dayBefore,
  parseDateOnly,
  rangesOverlap,
  serializeMoney,
  serializeSalaryRecord,
} from '../../utils/money';
import { getPaginationMeta, getSkipTake } from '../../utils/pagination';
import { writeAuditLog } from '../audit/audit.service';
import {
  CreateOrReviseSalaryInput,
  GlobalHistoryQuery,
  SalaryHistoryQuery,
} from './salaries.validation';

async function getEmployeeOrThrow(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      email: true,
      employmentStatus: true,
    },
  });
  if (!employee) throw new NotFoundError('Employee not found');
  return employee;
}

export async function getCurrentSalary(employeeId: string) {
  await getEmployeeOrThrow(employeeId);
  const current = await prisma.salaryRecord.findFirst({
    where: { employeeId, effectiveTo: null },
    orderBy: { effectiveFrom: 'desc' },
  });
  return current ? serializeSalaryRecord(current) : null;
}

export async function listSalaryHistory(employeeId: string, query: SalaryHistoryQuery) {
  await getEmployeeOrThrow(employeeId);
  const { skip, take } = getSkipTake(query);

  const [total, rows] = await prisma.$transaction([
    prisma.salaryRecord.count({ where: { employeeId } }),
    prisma.salaryRecord.findMany({
      where: { employeeId },
      orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
    }),
  ]);

  return {
    items: rows.map(serializeSalaryRecord),
    meta: getPaginationMeta(total, query.page, query.pageSize),
  };
}

export async function listRevisions(employeeId: string, query: SalaryHistoryQuery) {
  await getEmployeeOrThrow(employeeId);
  const { skip, take } = getSkipTake(query);

  const [total, rows] = await prisma.$transaction([
    prisma.salaryRevision.count({ where: { employeeId } }),
    prisma.salaryRevision.findMany({
      where: { employeeId },
      include: {
        previousRecord: true,
        newRecord: true,
        changedByUser: { select: { id: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      changeReason: row.changeReason,
      createdAt: row.createdAt.toISOString(),
      changedBy: row.changedByUser,
      previous: row.previousRecord ? serializeSalaryRecord(row.previousRecord) : null,
      current: serializeSalaryRecord(row.newRecord),
      delta: row.previousRecord
        ? {
            baseSalary: serializeMoney(
              new Prisma.Decimal(row.newRecord.baseSalary).minus(row.previousRecord.baseSalary),
            ),
            bonus: serializeMoney(
              new Prisma.Decimal(row.newRecord.bonus).minus(row.previousRecord.bonus),
            ),
            allowances: serializeMoney(
              new Prisma.Decimal(row.newRecord.allowances).minus(row.previousRecord.allowances),
            ),
            deductions: serializeMoney(
              new Prisma.Decimal(row.newRecord.deductions).minus(row.previousRecord.deductions),
            ),
            currencyChanged: row.previousRecord.currency !== row.newRecord.currency,
          }
        : null,
    })),
    meta: getPaginationMeta(total, query.page, query.pageSize),
  };
}

export async function compareCurrentAndPrevious(employeeId: string) {
  await getEmployeeOrThrow(employeeId);

  const records = await prisma.salaryRecord.findMany({
    where: { employeeId },
    orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
    take: 2,
  });

  const current = records.find((r) => r.effectiveTo === null) ?? records[0] ?? null;
  const previous =
    records.find((r) => current && r.id !== current.id) ??
    (records.length > 1 ? records[1] : null);

  return {
    current: current ? serializeSalaryRecord(current) : null,
    previous: previous ? serializeSalaryRecord(previous) : null,
    sameCurrency: current && previous ? current.currency === previous.currency : true,
  };
}

export async function reviseSalary(
  employeeId: string,
  input: CreateOrReviseSalaryInput,
  actorUserId: string,
  ipAddress?: string | null,
) {
  await getEmployeeOrThrow(employeeId);
  const effectiveFrom = parseDateOnly(input.effectiveFrom);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.salaryRecord.findMany({
        where: { employeeId },
        orderBy: { effectiveFrom: 'asc' },
      });

      const open = existing.find((r) => r.effectiveTo === null) ?? null;

      // Proposed new open period: [effectiveFrom, +inf)
      for (const record of existing) {
        if (open && record.id === open.id) continue;
        if (rangesOverlap(record.effectiveFrom, record.effectiveTo, effectiveFrom, null)) {
          throw new ConflictError('Salary effective period overlaps an existing record');
        }
      }

      if (open) {
        if (effectiveFrom <= open.effectiveFrom) {
          throw new ValidationError(
            'New effectiveFrom must be after the current salary effectiveFrom',
          );
        }
        const closeTo = dayBefore(effectiveFrom);
        if (closeTo < open.effectiveFrom) {
          throw new ValidationError('Invalid effective date relative to current salary period');
        }
        await tx.salaryRecord.update({
          where: { id: open.id },
          data: { effectiveTo: closeTo },
        });
      }

      const created = await tx.salaryRecord.create({
        data: {
          employeeId,
          baseSalary: input.baseSalary,
          bonus: input.bonus,
          allowances: input.allowances,
          deductions: input.deductions,
          currency: input.currency.toUpperCase(),
          effectiveFrom,
          effectiveTo: null,
        },
      });

      const revision = await tx.salaryRevision.create({
        data: {
          employeeId,
          previousRecordId: open?.id ?? null,
          newRecordId: created.id,
          changedBy: actorUserId,
          changeReason: input.changeReason ?? null,
        },
      });

      await writeAuditLog(tx, {
        actorUserId,
        action: open ? 'SALARY_UPDATE' : 'SALARY_CREATE',
        entityType: 'salary_record',
        entityId: created.id,
        beforeJson: open
          ? {
              id: open.id,
              baseSalary: serializeMoney(open.baseSalary),
              bonus: serializeMoney(open.bonus),
              allowances: serializeMoney(open.allowances),
              deductions: serializeMoney(open.deductions),
              currency: open.currency,
              effectiveFrom: open.effectiveFrom.toISOString().slice(0, 10),
            }
          : null,
        afterJson: {
          id: created.id,
          baseSalary: serializeMoney(created.baseSalary),
          bonus: serializeMoney(created.bonus),
          allowances: serializeMoney(created.allowances),
          deductions: serializeMoney(created.deductions),
          currency: created.currency,
          effectiveFrom: created.effectiveFrom.toISOString().slice(0, 10),
          revisionId: revision.id,
        },
        ipAddress,
      });

      return { created, revisionId: revision.id, previousId: open?.id ?? null };
    });

    return {
      current: serializeSalaryRecord(result.created),
      revisionId: result.revisionId,
      previousRecordId: result.previousId,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Only one active salary record is allowed per employee');
    }
    throw error;
  }
}

export async function listGlobalRevisions(query: GlobalHistoryQuery) {
  const { skip, take } = getSkipTake(query);
  const where: Prisma.SalaryRevisionWhereInput = {};

  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.search) {
    const term = query.search.trim();
    where.employee = {
      OR: [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { employeeCode: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ],
    };
  }

  const [total, rows] = await prisma.$transaction([
    prisma.salaryRevision.count({ where }),
    prisma.salaryRevision.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        previousRecord: true,
        newRecord: true,
        changedByUser: { select: { id: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      changeReason: row.changeReason,
      employee: {
        id: row.employee.id,
        employeeCode: row.employee.employeeCode,
        fullName: `${row.employee.firstName} ${row.employee.lastName}`,
        email: row.employee.email,
      },
      changedBy: row.changedByUser,
      previous: row.previousRecord ? serializeSalaryRecord(row.previousRecord) : null,
      current: serializeSalaryRecord(row.newRecord),
    })),
    meta: getPaginationMeta(total, query.page, query.pageSize),
  };
}
