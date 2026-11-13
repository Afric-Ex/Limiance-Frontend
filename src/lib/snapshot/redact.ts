const MASK = "****";
const AMOUNT_MASK = "••••";

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_PATTERN = /\+?\d[\d\s().-]{5,}\d/g;

function tailOf(value: string, minLength = 4): string {
  const characters = Array.from(value);
  return characters.length >= minLength
    ? characters.slice(-minLength).join("")
    : "";
}

function digitTail(value: string): string {
  const digits = value.replace(/\D/g, "");
  return tailOf(digits);
}

export function maskUid(id?: string | null): string {
  const value = typeof id === "string" ? id.trim() : "";
  return `UID ${MASK}${tailOf(value)}`;
}

export function maskEmail(email?: string | null): string {
  const value = typeof email === "string" ? email.trim() : "";
  const at = value.lastIndexOf("@");
  if (at <= 0) return MASK;

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (!domain) return MASK;

  return `${MASK}${tailOf(local)}@${domain}`;
}

export function maskPhone(phone?: string | null): string {
  const value = typeof phone === "string" ? phone.trim() : "";
  return `${MASK}${digitTail(value)}`;
}

export function maskAccount(account?: string | null): string {
  const value = typeof account === "string" ? account.trim() : "";
  return `${MASK}${tailOf(value)}`;
}

export function maskAmount(_value: number | string | null | undefined): string {
  return AMOUNT_MASK;
}

export function sanitizeText(text: string): string {
  if (typeof text !== "string" || text.length === 0) return "";

  return text
    .replace(EMAIL_PATTERN, (match) => maskEmail(match))
    .replace(PHONE_PATTERN, (match) => {
      const digits = match.replace(/\D/g, "");
      if (digits.length < 7) return match;
      return `${MASK}${digits.slice(-4)}`;
    });
}
