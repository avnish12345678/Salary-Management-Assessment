import { apiClient } from './api-client';
import type { ApiResponse, SalaryRecord, SalaryRevisionItem } from '../types/api';

export type SalaryRevisionPayload = {
  baseSalary: number;
  bonus: number;
  allowances: number;
  deductions: number;
  currency: string;
  effectiveFrom: string;
  changeReason?: string;
};

export async function fetchCurrentSalary(employeeId: string) {
  const { data } = await apiClient.get<ApiResponse<SalaryRecord | null>>(
    `/salaries/employees/${employeeId}/current`,
  );
  return data.data;
}

export async function fetchSalaryHistory(employeeId: string, page = 1, pageSize = 20) {
  const { data } = await apiClient.get<ApiResponse<SalaryRecord[]>>(
    `/salaries/employees/${employeeId}/history`,
    { params: { page, pageSize } },
  );
  return { items: data.data, meta: data.meta! };
}

export async function fetchSalaryRevisions(employeeId: string, page = 1, pageSize = 20) {
  const { data } = await apiClient.get<ApiResponse<SalaryRevisionItem[]>>(
    `/salaries/employees/${employeeId}/revisions`,
    { params: { page, pageSize } },
  );
  return { items: data.data, meta: data.meta! };
}

export async function fetchSalaryCompare(employeeId: string) {
  const { data } = await apiClient.get<
    ApiResponse<{
      current: SalaryRecord | null;
      previous: SalaryRecord | null;
      sameCurrency: boolean;
    }>
  >(`/salaries/employees/${employeeId}/compare`);
  return data.data;
}

export async function reviseSalary(employeeId: string, payload: SalaryRevisionPayload) {
  const { data } = await apiClient.post<
    ApiResponse<{ current: SalaryRecord; revisionId: string; previousRecordId: string | null }>
  >(`/salaries/employees/${employeeId}/revisions`, payload);
  return data.data;
}

export async function fetchGlobalRevisions(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  employeeId?: string;
}) {
  const { data } = await apiClient.get<ApiResponse<SalaryRevisionItem[]>>('/salaries/revisions', {
    params,
  });
  return { items: data.data, meta: data.meta! };
}
