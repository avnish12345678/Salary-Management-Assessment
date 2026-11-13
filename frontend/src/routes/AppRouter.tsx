import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
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
                  description="Currency-aware payroll KPIs and charts will appear here."
                />
              }
            />
            <Route
              path="/employees"
              element={
                <PlaceholderPage
                  title="Employees"
                  description="Server-side employee search, filters, and CRUD arrive in Phase 3."
                />
              }
            />
            <Route
              path="/salaries"
              element={
                <PlaceholderPage
                  title="Salary Management"
                  description="Salary revisions with audit trails arrive in Phase 3."
                />
              }
            />
            <Route
              path="/salary-history"
              element={
                <PlaceholderPage
                  title="Salary History"
                  description="Historical salary comparison views arrive in Phase 3."
                />
              }
            />
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
                  description="Immutable change history arrives with salary workflows."
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
