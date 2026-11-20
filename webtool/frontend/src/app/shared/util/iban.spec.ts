import { describe, expect, it } from 'vitest';
import { formatIban, isValidIban } from './iban';

describe('isValidIban', () => {
  it.each([
    ['DE02 1203 0000 0000 2020 51', true],
    ['de02120300000000202051', true],
    ['AT61 1904 3002 3457 3201', true],
    ['DE02 1203 0000 0000 2020 52', false], // Prüfziffer
    ['DE02 1203 0000 0000 2020 5', false], // Länge
    ['Kein Konto', false],
    ['', false],
  ])('%j → %s', (iban, valid) => {
    expect(isValidIban(iban)).toBe(valid);
  });
});

describe('formatIban', () => {
  it('groups in fours', () => {
    expect(formatIban('de02120300000000202051')).toBe('DE02 1203 0000 0000 2020 51');
  });
});
