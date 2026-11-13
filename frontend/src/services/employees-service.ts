import { apiClient } from './api-client';
import type { ApiResponse, Employee } from '../types/api';

export type EmployeeListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
  countryId?: string;
  employmentStatus?: string;
  designation?: string;
  sortBy?: 'joiningDate' | 'name' | 'employeeCode';
  sortOrder?: 'asc' | 'desc';
};

export type EmployeeWritePayload = {
  employeeCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  departmentId: string;
  designation: string;
  countryId: string;
  city: string;
  joiningDate: string;
  employmentStatus?: 'ACTIVE' | 'INACTIVE';
  managerId?: string | null;
  initialSalary?: {
    baseSalary: number;
    bonus: number;
    allowances: number;
    deductions: number;
    currency: string;
    effectiveFrom: string;
  };
};

export async function fetchEmployees(params: EmployeeListParams) {
  const { data } = await apiClient.get<ApiResponse<Employee[]>>('/employees', { params });
  return { items: data.data, meta: data.meta! };
}

export async function fetchEmployee(id: string) {
  const { data } = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
  return data.data;
}

export async function createEmployee(payload: EmployeeWritePayload) {
  const { data } = await apiClient.post<ApiResponse<Employee>>('/employees', payload);
  return data.data;
}

export async function updateEmployee(id: string, payload: Partial<EmployeeWritePayload>) {
  const { data } = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}`, payload);
  return data.data;
}

export async function setEmployeeStatus(id: string, employmentStatus: 'ACTIVE' | 'INACTIVE') {
  const { data } = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}/status`, {
    employmentStatus,
  });
  return data.data;
}
