import { z } from 'zod';

/** Mirrors production JWT rules from env.ts for isolated unit testing. */
const productionSecretSchema = z
  .object({
    NODE_ENV: z.literal('production'),
    JWT_SECRET: z.string().min(16),
  })
  .superRefine((value, ctx) => {
    if (value.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be at least 32 characters in production',
      });
    }
    if (/change-me|dev-only|test-jwt/i.test(value.JWT_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET appears to be a placeholder and is not allowed in production',
      });
    }
  });

describe('production JWT secret policy', () => {
  it('rejects short secrets', () => {
    const result = productionSecretSchema.safeParse({
      NODE_ENV: 'production',
      JWT_SECRET: 'short-but-16chars',
    });
    expect(result.success).toBe(false);
  });

  it('rejects placeholder secrets', () => {
    const result = productionSecretSchema.safeParse({
      NODE_ENV: 'production',
      JWT_SECRET: 'dev-only-change-me-long-secret-value!!',
    });
    expect(result.success).toBe(false);
  });

  it('accepts strong secrets', () => {
    const result = productionSecretSchema.safeParse({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-very-long-production-grade-secret-key',
    });
    expect(result.success).toBe(true);
  });
});
