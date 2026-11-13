export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error: { message: string; details: unknown } | null;
  meta: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  } | null;
};

export type Country = {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
};

export type Department = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

export type SalaryRecord = {
  id: string;
  employeeId: string;
  baseSalary: string;
  bonus: string;
  allowances: string;
  deductions: string;
  grossSalary: string;
  netSalary: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Employee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  departmentId: string;
  department: { id: string; code: string; name: string };
  designation: string;
  countryId: string;
  country: { id: string; code: string; name: string; currencyCode: string };
  city: string;
  joiningDate: string;
  employmentStatus: 'ACTIVE' | 'INACTIVE';
  managerId: string | null;
  manager: { id: string; employeeCode: string; fullName: string } | null;
  currentSalary: SalaryRecord | null;
  createdAt: string;
  updatedAt: string;
};

export type SalaryRevisionItem = {
  id: string;
  employeeId?: string;
  createdAt: string;
  changeReason: string | null;
  changedBy: { id: string; email: string; role: string };
  previous: SalaryRecord | null;
  current: SalaryRecord;
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    email: string;
  };
  delta?: {
    baseSalary: string;
    bonus: string;
    allowances: string;
    deductions: string;
    currencyChanged: boolean;
  } | null;
};
