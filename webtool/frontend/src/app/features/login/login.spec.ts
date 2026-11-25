import { normalizeMemberId, safeReturnUrl } from './login';

describe('normalizeMemberId', () => {
  it('accepts the number as printed on the DAV card', () => {
    expect(normalizeMemberId('008/00/123456')).toBe('008-00-123456');
    expect(normalizeMemberId(' 008-00-123456 ')).toBe('008-00-123456');
    expect(normalizeMemberId('008 / 00 / 123456')).toBe('008-00-123456');
  });
});

describe('safeReturnUrl', () => {
  it('only returns to pages of the app', () => {
    expect(safeReturnUrl('/tours/5')).toBe('/tours/5');
    expect(safeReturnUrl(null)).toBe('/dashboard');
    expect(safeReturnUrl('https://example.org')).toBe('/dashboard');
    expect(safeReturnUrl('//example.org')).toBe('/dashboard');
    expect(safeReturnUrl('/login')).toBe('/dashboard');
  });
});
