type TradeRecord = Record<string, unknown>;

const normalizePair = (value: string) =>
  value.replace(/[/\\\-_:\s]/g, "").toUpperCase();

export function getLatestTradePrice(
  trades: readonly Record<string, unknown>[]
): number | null {
  let latestPrice: number | null = null;
  let latestTime = -Infinity;
  let fallbackPrice: number | null = null;

  for (const trade of trades) {
    const price = Number(trade.price ?? trade.rate);
    if (!Number.isFinite(price) || price <= 0) continue;

    if (fallbackPrice === null) fallbackPrice = price;

    const rawTime =
      trade.createdAt ?? trade.timestamp ?? trade.time ?? trade.ts ?? trade.executedAt;
    const time = rawTime == null ? NaN : new Date(rawTime as string | number).getTime();

    if (Number.isFinite(time) && time > latestTime) {
      latestTime = time;
      latestPrice = price;
    }
  }

  return latestPrice ?? fallbackPrice;
}

export function filterRecentTradesByPair<T>(
  trades: T[],
  selectedPair: string
): T[] {
  const selected = normalizePair(selectedPair);
  if (!selected) return [];

  return trades.filter((trade) => {
    if (!trade || typeof trade !== "object") return false;
    const record = trade as TradeRecord;
    const base = typeof record.base === "string" ? record.base : "";
    const quote = typeof record.quote === "string" ? record.quote : "";
    const baseIsPair = /[/\\\-_:\s]/.test(base);
    const candidates = [
      record.pair,
      record.symbol,
      record.tradingPair,
      baseIsPair ? base : null,
      base && quote && !baseIsPair ? `${base}/${quote}` : null,
    ];

    return candidates.some((candidate) => {
      if (typeof candidate !== "string") return false;
      const normalized = normalizePair(candidate);
      if (normalized === selected) return true;
      return (
        normalized.startsWith(selected) &&
        /^(?:MARGIN|SPOT|FUTURES|PERP|PERPETUAL|SWAP)$/.test(
          normalized.slice(selected.length)
        )
      );
    });
  });
}
