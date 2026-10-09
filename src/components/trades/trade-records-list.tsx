type TradeRecord = Record<string, unknown>;

type TradeRecordsListProps = {
  trades: TradeRecord[];
  isLoading: boolean;
  emptyMessage: string;
  limit?: number;
};

const firstValue = (record: TradeRecord, keys: string[]) =>
  keys.map((key) => record[key]).find((value) => value !== undefined && value !== null && value !== "");

const formatTimestamp = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const formatNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("en-US", { maximumFractionDigits: 8 })
    : String(value);
};

export function TradeRecordsList({
  trades,
  isLoading,
  emptyMessage,
  limit = 50,
}: TradeRecordsListProps) {
  if (isLoading) {
    return <div className="p-4 text-center text-xs text-white/40">Loading trades...</div>;
  }

  if (!trades.length) {
    return <div className="p-4 text-center text-xs text-white/40">{emptyMessage}</div>;
  }

  const sortedTrades = [...trades].sort((left, right) => {
    const leftTime = new Date(String(firstValue(left, ["createdAt", "created_at", "executedAt", "executed_at", "time", "ts"]) ?? 0)).getTime();
    const rightTime = new Date(String(firstValue(right, ["createdAt", "created_at", "executedAt", "executed_at", "time", "ts"]) ?? 0)).getTime();
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  });

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-4 px-3 py-1.5 text-[10px] text-white/40">
        <span>Time</span><span className="text-center">Side</span><span className="text-right">Price</span><span className="text-right">Qty</span>
      </div>
      <div className="flex flex-col divide-y divide-white/[0.04]">
        {sortedTrades.slice(0, limit).map((trade, index) => {
          const side = String(firstValue(trade, ["side", "orderSide", "order_side", "direction"]) ?? "").toUpperCase();
          const isBuy = side === "BUY";
          const sideColor = isBuy ? "text-success-6" : side === "SELL" ? "text-error-1" : "text-white/60";
          const id = firstValue(trade, ["id", "tradeId", "trade_id", "fillId", "fill_id"]);

          return (
            <div key={String(id ?? index)} className="grid grid-cols-4 px-3 py-1.5 text-[11px] font-mono tabular-nums items-center">
              <span className="text-white/40">
                {formatTimestamp(firstValue(trade, ["createdAt", "created_at", "executedAt", "executed_at", "time", "ts"]))}
              </span>
              <span className={`text-center ${sideColor}`}>{side || "—"}</span>
              <span className="text-right text-white/80">
                {formatNumber(firstValue(trade, ["price", "avgPrice", "avg_price", "executionPrice", "execution_price", "fillPrice", "fill_price"]))}
              </span>
              <span className="text-right text-white/80">
                {formatNumber(firstValue(trade, ["quantity", "qty", "filled", "filledQuantity", "filled_quantity", "executedQuantity", "executed_quantity", "amount", "size"]))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
