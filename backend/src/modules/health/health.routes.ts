import { Router } from 'express';
import { prisma } from '../../config/db';
import { sendSuccess } from '../../utils/api-response';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, {
      status: 'ok',
      service: 'acme-api',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
