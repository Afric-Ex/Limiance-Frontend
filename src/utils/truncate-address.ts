export function truncateCryptoAddress(
  address: string | null | undefined,
  visibleChars: number = 4,
  separator: string = "..."
): string {
  if (!address) {
    return "";
  }
  if (address.length <= visibleChars * 2) {
    return address; // Return full address if it's too short to truncate
  }

  const start = address.substring(0, visibleChars);
  const end = address.substring(address.length - visibleChars);

  return `${start}${separator}${end}`;
}

/** All-zero EVM address — the backend's placeholder for "no address yet". */
export function isZeroAddress(address: string | null | undefined): boolean {
  return !!address && /^0x0{40}$/i.test(address.trim());
}
