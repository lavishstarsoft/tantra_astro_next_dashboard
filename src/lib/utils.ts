/**
 * Normalizes a phone number to E.164 format (e.g., +919876543210).
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`;
  if (phone.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return `+${digits}`;
}
