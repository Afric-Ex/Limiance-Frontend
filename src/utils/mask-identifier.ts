export function maskIdentifier(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const atIndex = trimmed.indexOf("@");
  if (atIndex > 0) {
    const local = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex);
    const maskedLocal =
      local.length <= 1
        ? `${local}*`
        : `${local[0]}${"*".repeat(Math.max(local.length - 2, 1))}${local[local.length - 1]}`;
    return `${maskedLocal}${domain}`;
  }

  if (trimmed.length <= 2) return trimmed[0] + "*";
  return `${trimmed.slice(0, 3)}${"*".repeat(Math.max(trimmed.length - 5, 1))}${trimmed.slice(-2)}`;
}