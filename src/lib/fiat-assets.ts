export function uniqueFiatAssetSymbols(assets: string[]): string[] {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    const identity = asset.trim().toUpperCase();
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

export function fiatAssetImageMap(tokens: unknown[]): Record<string, string> {
  const images: Record<string, string> = {};

  for (const token of tokens) {
    if (!token || typeof token !== "object") continue;
    const record = token as Record<string, unknown>;
    const symbol = typeof record.symbol === "string"
      ? record.symbol.trim().toUpperCase()
      : "";
    const image = [record.logo, record.image, record.icon].find(
      (value): value is string => typeof value === "string" && !!value.trim()
    );
    if (symbol && image && !images[symbol]) images[symbol] = image.trim();
  }

  return images;
}

export function normalizeFiatQuoteAmount(amount: string | number): string {
  return String(amount).trim();
}

export function getFiatQuoteReceivedAmount(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const amount = String(value).trim();
  return Number.isFinite(Number(amount)) && Number(amount) > 0 ? amount : null;
}
