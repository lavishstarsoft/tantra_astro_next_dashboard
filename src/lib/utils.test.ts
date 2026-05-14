import { normalizePhone } from './utils';

describe('normalizePhone', () => {
  test('should format 10-digit Indian numbers with +91', () => {
    expect(normalizePhone('9876543210')).toBe('+919876543210');
  });

  test('should handle numbers already starting with 91', () => {
    expect(normalizePhone('919876543210')).toBe('+919876543210');
  });

  test('should handle numbers with spaces or dashes', () => {
    expect(normalizePhone('987 654-3210')).toBe('+919876543210');
  });

  test('should handle leading zeros', () => {
    expect(normalizePhone('09876543210')).toBe('+919876543210');
  });

  test('should keep existing + prefix', () => {
    expect(normalizePhone('+919876543210')).toBe('+919876543210');
  });
});
