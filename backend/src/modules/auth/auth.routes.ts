import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { loginRateLimiter } from '../../middleware/login-rate-limit';
import { validate } from '../../middleware/validate';
import * as authController from './auth.controller';
import { loginSchema } from './auth.validation';

const router = Router();

router.post(
  '/login',
  loginRateLimiter,
  validate({ body: loginSchema }),
  authController.login,
);

router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
