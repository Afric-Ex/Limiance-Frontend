type TradeRecord = Record<string, unknown>;

const normalizePair = (value: string) =>
  value.replace(/[/\\\-_:\s]/g, "").toUpperCase();

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
