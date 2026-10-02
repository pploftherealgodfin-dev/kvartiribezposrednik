export function normalizePhone(phone: string): string {
  return phone.replace(/[\s()-]/g, '');
}
export function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}
export function isValidOtp(code: string): boolean {
  return /^\d{6,10}$/.test(code.trim());
}
export function safeReturnPath(requested: string): string {
  let decoded = requested;
  try {
    for (let i = 0; i < 2; i++) decoded = decodeURIComponent(decoded);
  } catch { return ''; }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\') || Array.from(decoded).some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127) || /^\/vhod(?:[/?#]|$)/i.test(decoded)) return '';
  return requested;
}
