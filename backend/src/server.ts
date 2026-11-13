import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info('ACME API listening', {
    port: env.PORT,
    env: env.NODE_ENV,
  });
});
