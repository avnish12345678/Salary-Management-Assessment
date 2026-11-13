import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api';

export type ReportFilters = {
  countryId?: string;
  departmentId?: string;
  employmentStatus?: string;
  currency?: string;
  minSalary?: number;
  maxSalary?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
  format?: 'json' | 'csv' | 'xlsx';
};

export type SalaryReport = {
  generatedAt: string;
  filters: ReportFilters;
  answers: {
    payrollByCountry: Array<{
      country: string;
      currency: string;
      totalPayroll: string;
      averageSalary: string;
      employeeCount: number;
    }>;
    highestPayrollDepartmentByCurrency: Array<{
      department: string;
      currency: string;
      totalPayroll: string;
      employeeCount: number;
    }>;
    averageSalaryByDepartment: Array<{
      department: string;
      currency: string;
      totalPayroll: string;
      averageSalary: string;
      employeeCount: number;
    }>;
    topPaidEmployees: Array<{
      employeeId: string;
      employeeCode: string;
      fullName: string;
      department: string;
      country: string;
      currency: string;
      grossSalary: string;
      netSalary: string;
    }>;
    employeesInSalaryRangeByCurrency: Array<{
      currency: string;
      count: number;
      minSalary: number | null;
      maxSalary: number | null;
    }>;
    highestAverageSalaryCountryByCurrency: Array<{
      country: string;
      currency: string;
      averageSalary: string;
      employeeCount: number;
    }>;
    salaryRevisionsThisMonth: number;
    previousVsCurrentSalary: Array<{
      revisionId: string;
      createdAt: string;
      employeeCode: string;
      fullName: string;
      changedBy: string;
      changeReason: string | null;
      previous: { currency: string; grossSalary: string; netSalary: string } | null;
      current: { currency: string; grossSalary: string; netSalary: string };
      difference: {
        currency: string | null;
        grossDelta: string | null;
        note?: string;
      };
    }>;
  };
  notes: {
    currencyPolicy: string;
    topPaidNote: string;
  };
};

export async function fetchSalaryReport(params: ReportFilters) {
  const { data } = await apiClient.get<ApiResponse<SalaryReport>>('/reports/summary', {
    params: { ...params, format: 'json' },
  });
  return data.data;
}

export async function downloadSalaryReport(params: ReportFilters, format: 'csv' | 'xlsx') {
  const response = await apiClient.get('/reports/summary', {
    params: { ...params, format },
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type:
      format === 'csv'
        ? 'text/csv;charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `acme-salary-report.${format === 'csv' ? 'csv' : 'xlsx'}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
