import { auditListQuerySchema } from '../audit.validation';

describe('auditListQuerySchema', () => {
  it('applies pagination defaults', () => {
    const parsed = auditListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it('rejects invalid entity ids', () => {
    expect(() => auditListQuerySchema.parse({ entityId: 'not-a-uuid' })).toThrow();
  });
});
