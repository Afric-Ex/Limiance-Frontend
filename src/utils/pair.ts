export function normalizePair(input: string | null | undefined): string {
  if (!input) return "BTC/USDT";
  let raw = String(input).trim().replace(/_/g, "-");
  raw = raw.toUpperCase();
  if (raw.includes("/")) {
    const parts = raw.split("/").filter(Boolean);
    if (parts.length === 2) return parts[0] + "/" + parts[1];
  }
  if (raw.includes("-")) {
    const parts = raw.split("-").filter(Boolean);
    if (parts.length === 2) return parts[0] + "/" + parts[1];
  }
  const quotes = ["USDT", "USDC", "BTC", "ETH", "BNB", "BUSD", "FDUSD", "DAI", "USD", "TRY", "EUR", "GBP", "NGN", "BRL"];
  for (let i = 0; i < quotes.length; i++) {
    const q = quotes[i];
    if (raw.endsWith(q) && raw.length > q.length) {
      return raw.slice(0, raw.length - q.length) + "/" + q;
    }
  }
  return raw.includes("/") ? raw : "BTC/USDT";
}

export function splitPair(pair: string | null | undefined): [string, string] {
  const normalized = normalizePair(pair);
  const parts = normalized.split("/");
  return [parts[0] || "", parts[1] || ""];
}
