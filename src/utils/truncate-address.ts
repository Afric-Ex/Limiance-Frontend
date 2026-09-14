export function truncateCryptoAddress(
  address: string,
  visibleChars: number = 4,
  separator: string = "..."
): string {
  if (address.length <= visibleChars * 2) {
    return address; // Return full address if it's too short to truncate
  }

  const start = address.substring(0, visibleChars);
  const end = address.substring(address.length - visibleChars);

  return `${start}${separator}${end}`;
}
