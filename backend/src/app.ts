import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requestIdMiddleware } from './middleware/request-id';
import authRoutes from './modules/auth/auth.routes';
import healthRoutes from './modules/health/health.routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);

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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
