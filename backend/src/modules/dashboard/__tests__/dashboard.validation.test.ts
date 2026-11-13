import { dashboardFiltersSchema } from '../dashboard.validation';

describe('dashboardFiltersSchema', () => {
  it('uppercases currency filter', () => {
    const parsed = dashboardFiltersSchema.parse({ currency: 'usd' });
    expect(parsed.currency).toBe('USD');
  });

  it('accepts empty filters', () => {
    expect(dashboardFiltersSchema.parse({})).toEqual({});
  });
});
