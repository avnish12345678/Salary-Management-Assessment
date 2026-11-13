import { apiClient } from './api-client';
import type { ApiResponse, AuthUser, LoginResponse } from '../types/auth';

export async function loginRequest(email: string, password: string) {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
    email,
    password,
  });
  return data.data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
  return data.data;
}

export async function logoutRequest() {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
  return data.data;
}
