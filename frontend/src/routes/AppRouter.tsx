import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { EmployeeDetailPage } from '../features/employees/EmployeeDetailPage';
import { EmployeesPage } from '../features/employees/EmployeesPage';
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
            <Route
              path="/dashboard"
              element={
                <PlaceholderPage
                  title="Dashboard"
                  description="Currency-aware payroll KPIs and charts will appear here in Phase 4."
                />
              }
            />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/salaries" element={<SalariesPage />} />
            <Route path="/salary-history" element={<SalaryHistoryPage />} />
            <Route
              path="/reports"
              element={
                <PlaceholderPage
                  title="Reports"
                  description="Advanced payroll reporting and exports arrive in Phase 4."
                />
              }
            />
            <Route
              path="/audit"
              element={
                <PlaceholderPage
                  title="Audit Logs"
                  description="Dedicated audit browser arrives in a later phase; salary and employee mutations are already recorded."
                />
              }
            />
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
