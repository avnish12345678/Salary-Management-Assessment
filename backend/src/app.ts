import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { apiRateLimiter } from './middleware/api-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requestIdMiddleware } from './middleware/request-id';
import auditRoutes from './modules/audit/audit.routes';
import authRoutes from './modules/auth/auth.routes';
import countriesRoutes from './modules/countries/countries.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import departmentsRoutes from './modules/departments/departments.routes';
import employeesRoutes from './modules/employees/employees.routes';
import healthRoutes from './modules/health/health.routes';
import reportsRoutes from './modules/reports/reports.routes';
import salariesRoutes from './modules/salaries/salaries.routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);
  app.use('/api', apiRateLimiter);

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: { name: 'ACME Salary Intelligence API', version: '1.0.0' },
      error: null,
      meta: null,
    });
  });

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/countries', countriesRoutes);
  app.use('/api/departments', departmentsRoutes);
  app.use('/api/employees', employeesRoutes);
  app.use('/api/salaries', salariesRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/audit', auditRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
