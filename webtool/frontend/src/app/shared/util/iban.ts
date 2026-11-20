/*
 * IBAN-Prüfung wie im Backend (server/claims.py, iban_valid): Aufbau, Länge
 * je Land (soweit bekannt) und Prüfziffer nach ISO 13616 (mod 97).
 */

const IBAN_LENGTHS: Record<string, number> = {
  AT: 20, BE: 16, CH: 21, CZ: 24, DE: 22, DK: 18, ES: 24, FI: 18, FR: 27,
  GB: 22, HR: 21, HU: 28, IE: 22, IT: 27, LI: 21, LU: 20, NL: 18, NO: 15,
  PL: 28, PT: 25, SE: 24, SI: 19, SK: 24,
};

/** Ohne Leerzeichen, in Großbuchstaben. */
export function normalizeIban(value: string): string {
  return (value ?? '').replace(/\s+/g, '').toUpperCase();
}

/** In Vierergruppen, wie auf Kontoauszügen: "DE02 1203 0000 0000 2020 51". */
export function formatIban(value: string): string {
  return normalizeIban(value).replace(/(.{4})(?=.)/g, '$1 ');
}

export function isValidIban(value: string): boolean {
  const iban = normalizeIban(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) {
    return false;
  }
  const expected = IBAN_LENGTHS[iban.slice(0, 2)];
  if (expected !== undefined && expected !== iban.length) {
    return false;
  }
  // Länderkennung und Prüfziffer ans Ende, Buchstaben als Zahlen (A = 10 …),
  // dann Rest modulo 97 stückweise, ohne BigInt.
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const digit of digits) {
    rest = (rest * 10 + Number(digit)) % 97;
  }
  return rest === 1;
}
