import { toCsv } from '../export';

describe('toCsv', () => {
  it('escapes commas and quotes', () => {
    const csv = toCsv(['name', 'note'], [['Ada, Lovelace', 'said "hello"'], ['Bob', null]]);
    expect(csv).toContain('"Ada, Lovelace"');
    expect(csv).toContain('"said ""hello"""');
    expect(csv.split('\n')).toHaveLength(3);
  });
});
