import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuditLogsPage } from '../features/audit/AuditLogsPage';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { EmployeeDetailPage } from '../features/employees/EmployeeDetailPage';
import { EmployeesPage } from '../features/employees/EmployeesPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SalariesPage } from '../features/salaries/SalariesPage';
import { SalaryHistoryPage } from '../features/salaries/SalaryHistoryPage';
import { AppLayout } from '../layouts/AppLayout';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/salaries" element={<SalariesPage />} />
            <Route path="/salary-history" element={<SalaryHistoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit" element={<AuditLogsPage />} />
            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Settings"
                  description="Profile and preference settings will be available later."
                />
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
