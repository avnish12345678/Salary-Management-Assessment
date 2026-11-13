import { apiClient } from './api-client';
import type { ApiResponse, Country, Department } from '../types/api';

export async function fetchCountries() {
  const { data } = await apiClient.get<ApiResponse<Country[]>>('/countries');
  return data.data;
}

export async function fetchDepartments() {
  const { data } = await apiClient.get<ApiResponse<Department[]>>('/departments');
  return data.data;
}

export async function fetchDesignations() {
  const { data } = await apiClient.get<ApiResponse<string[]>>('/employees/meta/designations');
  return data.data;
}
