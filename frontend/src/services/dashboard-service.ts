import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api';

export type DashboardFilters = {
  countryId?: string;
  departmentId?: string;
  employmentStatus?: string;
  currency?: string;
};

export type DashboardAnalytics = {
  kpis: {
    totalEmployees: number;
    activeEmployees: number;
    totalDepartments: number;
    countriesCovered: number;
    payrollByCurrency: Array<{
      currency: string;
      totalAnnualPayroll: string;
      averageAnnualSalary: string;
      employeeCount: number;
    }>;
  };
  charts: {
    countryPayroll: Array<{
      country: string;
      countryCode: string;
      currency: string;
      totalPayroll: string;
      employeeCount: number;
    }>;
    departmentPayroll: Array<{
      department: string;
      departmentCode: string;
      currency: string;
      totalPayroll: string;
      employeeCount: number;
    }>;
    departmentAverageSalary: Array<{
      department: string;
      departmentCode: string;
      currency: string;
      averageSalary: string;
      employeeCount: number;
    }>;
    salaryHistogram: Array<{ currency: string; bucket: string; count: number }>;
    employeesByCountry: Array<{ country: string; countryCode: string; count: number }>;
    monthlyRevisionTrends: Array<{ month: string; count: number }>;
  };
  notes: {
    annualBasis: string;
    currencyPolicy: string;
  };
};

export async function fetchDashboardAnalytics(params: DashboardFilters) {
  const { data } = await apiClient.get<ApiResponse<DashboardAnalytics>>('/dashboard/analytics', {
    params,
  });
  return data.data;
}
