process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '4001';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/acme_salary_test?schema=public';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-32chars!!';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || '8';
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '60000';
process.env.LOGIN_RATE_LIMIT_MAX = process.env.LOGIN_RATE_LIMIT_MAX || '100';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
