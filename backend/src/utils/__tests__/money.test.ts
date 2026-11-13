import { Decimal } from '@prisma/client/runtime/library';
import {
  calculateGross,
  calculateNet,
  dayBefore,
  parseDateOnly,
  rangesOverlap,
  serializeMoney,
} from '../money';

describe('money helpers', () => {
  it('calculates gross and net salary correctly', () => {
    const parts = {
      baseSalary: new Decimal('100000.00'),
      bonus: new Decimal('10000.00'),
      allowances: new Decimal('5000.00'),
      deductions: new Decimal('7500.00'),
    };

    expect(serializeMoney(calculateGross(parts))).toBe('115000.00');
    expect(serializeMoney(calculateNet(parts))).toBe('107500.00');
  });

  it('detects overlapping salary periods', () => {
    const aFrom = parseDateOnly('2024-01-01');
    const aTo = parseDateOnly('2024-06-30');
    const bFrom = parseDateOnly('2024-06-01');
    const bTo = null;

    expect(rangesOverlap(aFrom, aTo, bFrom, bTo)).toBe(true);
    expect(
      rangesOverlap(parseDateOnly('2024-01-01'), parseDateOnly('2024-03-31'), parseDateOnly('2024-04-01'), null),
    ).toBe(false);
  });

  it('computes day before for closing periods', () => {
    expect(dayBefore(parseDateOnly('2024-07-01')).toISOString().slice(0, 10)).toBe('2024-06-30');
  });
});
