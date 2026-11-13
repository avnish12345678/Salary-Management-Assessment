import { EmploymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors';
import { parseDateOnly, serializeSalaryRecord } from '../../utils/money';
import { getPaginationMeta, getSkipTake } from '../../utils/pagination';
import { writeAuditLog } from '../audit/audit.service';
import {
  EmployeeCreateInput,
  EmployeeListQuery,
  EmployeeUpdateInput,
} from './employees.validation';

const employeeInclude = {
  department: { select: { id: true, code: true, name: true } },
  country: { select: { id: true, code: true, name: true, currencyCode: true } },
  manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
  salaryRecords: {
    where: { effectiveTo: null },
    take: 1,
    orderBy: { effectiveFrom: 'desc' as const },
  },
} satisfies Prisma.EmployeeInclude;

function mapEmployee(
  employee: Prisma.EmployeeGetPayload<{ include: typeof employeeInclude }>,
) {
  const current = employee.salaryRecords[0] ?? null;
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    fullName: `${employee.firstName} ${employee.lastName}`,
    email: employee.email,
    phone: employee.phone,
    departmentId: employee.departmentId,
    department: employee.department,
    designation: employee.designation,
    countryId: employee.countryId,
    country: employee.country,
    city: employee.city,
    joiningDate: employee.joiningDate.toISOString().slice(0, 10),
    employmentStatus: employee.employmentStatus,
    managerId: employee.managerId,
    manager: employee.manager
      ? {
          id: employee.manager.id,
          employeeCode: employee.manager.employeeCode,
          fullName: `${employee.manager.firstName} ${employee.manager.lastName}`,
        }
      : null,
    currentSalary: current ? serializeSalaryRecord(current) : null,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}

function buildWhere(query: EmployeeListQuery): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {};

  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.countryId) where.countryId = query.countryId;
  if (query.employmentStatus) where.employmentStatus = query.employmentStatus;
  if (query.designation) {
    where.designation = { equals: query.designation, mode: 'insensitive' };
  }

  if (query.search) {
    const term = query.search.trim();
    where.OR = [
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { employeeCode: { contains: term, mode: 'insensitive' } },
    ];
  }

  return where;
}

function buildOrderBy(
  query: EmployeeListQuery,
): Prisma.EmployeeOrderByWithRelationInput | Prisma.EmployeeOrderByWithRelationInput[] {
  if (query.sortBy === 'name') {
    return [{ lastName: query.sortOrder }, { firstName: query.sortOrder }];
  }
  if (query.sortBy === 'employeeCode') {
    return { employeeCode: query.sortOrder };
  }
  return { joiningDate: query.sortOrder };
}

export async function listEmployees(query: EmployeeListQuery) {
  const where = buildWhere(query);
  const { skip, take } = getSkipTake(query);

  const [total, rows] = await prisma.$transaction([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      include: employeeInclude,
      orderBy: buildOrderBy(query),
      skip,
      take,
    }),
  ]);

  return {
    items: rows.map(mapEmployee),
    meta: getPaginationMeta(total, query.page, query.pageSize),
  };
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: employeeInclude,
  });
  if (!employee) throw new NotFoundError('Employee not found');
  return mapEmployee(employee);
}

async function assertRefsExist(input: {
  departmentId: string;
  countryId: string;
  managerId?: string | null;
}) {
  const [department, country] = await Promise.all([
    prisma.department.findUnique({ where: { id: input.departmentId } }),
    prisma.country.findUnique({ where: { id: input.countryId } }),
  ]);
  if (!department) throw new ValidationError('Invalid departmentId');
  if (!country) throw new ValidationError('Invalid countryId');

  if (input.managerId) {
    const manager = await prisma.employee.findUnique({ where: { id: input.managerId } });
    if (!manager) throw new ValidationError('Invalid managerId');
  }
}

export async function createEmployee(
  input: EmployeeCreateInput,
  actorUserId: string,
  ipAddress?: string | null,
) {
  await assertRefsExist(input);

  const email = input.email.toLowerCase();

  try {
    const created = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          employeeCode: input.employeeCode.trim().toUpperCase(),
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email,
          phone: input.phone ?? null,
          departmentId: input.departmentId,
          designation: input.designation.trim(),
          countryId: input.countryId,
          city: input.city.trim(),
          joiningDate: parseDateOnly(input.joiningDate),
          employmentStatus: input.employmentStatus ?? EmploymentStatus.ACTIVE,
          managerId: input.managerId ?? null,
        },
      });

      if (input.initialSalary) {
        await tx.salaryRecord.create({
          data: {
            employeeId: employee.id,
            baseSalary: input.initialSalary.baseSalary,
            bonus: input.initialSalary.bonus,
            allowances: input.initialSalary.allowances,
            deductions: input.initialSalary.deductions,
            currency: input.initialSalary.currency.toUpperCase(),
            effectiveFrom: parseDateOnly(input.initialSalary.effectiveFrom),
            effectiveTo: null,
          },
        });
      }

      await writeAuditLog(tx, {
        actorUserId,
        action: 'EMPLOYEE_CREATE',
        entityType: 'employee',
        entityId: employee.id,
        afterJson: {
          employeeCode: employee.employeeCode,
          email: employee.email,
          employmentStatus: employee.employmentStatus,
        },
        ipAddress,
      });

      return employee.id;
    });

    return getEmployeeById(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Employee code or email already exists');
    }
    throw error;
  }
}

export async function updateEmployee(
  id: string,
  input: EmployeeUpdateInput,
  actorUserId: string,
  ipAddress?: string | null,
) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Employee not found');

  if (input.departmentId || input.countryId || input.managerId !== undefined) {
    await assertRefsExist({
      departmentId: input.departmentId ?? existing.departmentId,
      countryId: input.countryId ?? existing.countryId,
      managerId: input.managerId === undefined ? existing.managerId : input.managerId,
    });
  }

  if (input.managerId && input.managerId === id) {
    throw new ValidationError('Employee cannot be their own manager');
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id },
        data: {
          firstName: input.firstName?.trim(),
          lastName: input.lastName?.trim(),
          email: input.email?.toLowerCase(),
          phone: input.phone === undefined ? undefined : input.phone,
          departmentId: input.departmentId,
          designation: input.designation?.trim(),
          countryId: input.countryId,
          city: input.city?.trim(),
          joiningDate: input.joiningDate ? parseDateOnly(input.joiningDate) : undefined,
          managerId: input.managerId === undefined ? undefined : input.managerId,
        },
      });

      await writeAuditLog(tx, {
        actorUserId,
        action: 'EMPLOYEE_UPDATE',
        entityType: 'employee',
        entityId: id,
        beforeJson: {
          email: existing.email,
          departmentId: existing.departmentId,
          designation: existing.designation,
          employmentStatus: existing.employmentStatus,
        },
        afterJson: {
          email: updated.email,
          departmentId: updated.departmentId,
          designation: updated.designation,
          employmentStatus: updated.employmentStatus,
        },
        ipAddress,
      });
    });

    return getEmployeeById(id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Employee email already exists');
    }
    throw error;
  }
}

export async function setEmployeeStatus(
  id: string,
  employmentStatus: EmploymentStatus,
  actorUserId: string,
  ipAddress?: string | null,
) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Employee not found');

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id },
      data: { employmentStatus },
    });

    await writeAuditLog(tx, {
      actorUserId,
      action: employmentStatus === EmploymentStatus.ACTIVE ? 'EMPLOYEE_ACTIVATE' : 'EMPLOYEE_DEACTIVATE',
      entityType: 'employee',
      entityId: id,
      beforeJson: { employmentStatus: existing.employmentStatus },
      afterJson: { employmentStatus },
      ipAddress,
    });
  });

  return getEmployeeById(id);
}

export async function listDesignations() {
  const rows = await prisma.employee.findMany({
    distinct: ['designation'],
    select: { designation: true },
    orderBy: { designation: 'asc' },
  });
  return rows.map((row) => row.designation);
}
