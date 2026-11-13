import { parseDate } from "@/src/lib/parse-date";

const ORDER_MARKET_TYPES = new Set(["spot", "futures", "margin", "cross", "isolated"]);

// The API overloads `type` with the market ("spot"/"futures"), not the order
// type, so ignore those values and keep only a real order type when present.
export const getOrderType = (order: any) => {
  const raw = String(order?.orderType ?? order?.order_type ?? "").toLowerCase();
  if (raw && !ORDER_MARKET_TYPES.has(raw)) return raw;
  const type = String(order?.type ?? "").toLowerCase();
  return ORDER_MARKET_TYPES.has(type) ? "" : type;
};

export const hasConditional = (order: any) =>
  Number(order?.takeProfit) > 0 ||
  Number(order?.stopLoss) > 0 ||
  Number(order?.tp_trigger_price) > 0 ||
  Number(order?.sl_trigger_price) > 0;

export const formatOrderNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—";
};

export const formatOrderDate = (value: unknown) => {
  const date = parseDate(value);
  return date ? date.toLocaleString() : "—";
};

export const getOrderPair = (order: any) =>
  order?.pair ||
  (order?.base && order?.quote ? `${order.base}/${order.quote}` : order?.symbol || "—");

export const getOrderTypeLabel = (order: any) => {
  const type = getOrderType(order);
  if (type) return type.replace(/^(buy|sell|long|short)_/, "");
  if (hasConditional(order)) return "TP/SL";
  return Number(order?.price) > 0 ? "Limit" : "Market";
};

export const getOrderMarket = (order: any) => {
  const market = String(order?.market_type ?? order?.marketType ?? order?.market ?? order?.type ?? "").toLowerCase();
  return ORDER_MARKET_TYPES.has(market) ? market : "spot";
};

export const getOrderPrice = (order: any) =>
  order?.price ?? order?.orderPrice ?? order?.order_price ?? order?.avgPrice ?? order?.fillPrice;

export const isOrderFilled = (order: any) => {
  const status = String(order?.orderStatus ?? order?.status ?? order?.state ?? "").toUpperCase();
  return status === "FILLED" || status === "CLOSED";
};

export const getAvgPrice = (order: any) => {
  const val = order?.avgPrice ?? order?.avg_price ?? order?.averagePrice ?? order?.fillPrice;
  if (val === "0" || val === 0 || !val) {
    if (isOrderFilled(order)) return getOrderPrice(order);
    return null;
  }
  return val;
};

export const getFilledValue = (order: any) => {
  const val = order?.cumExecValue ?? order?.filledValue ?? order?.executedValue;
  if (val === "0" || val === 0 || !val) {
    if (isOrderFilled(order)) {
      const price = Number(getAvgPrice(order));
      const quantity = Number(getFilledQuantity(order));
      if (price > 0 && quantity > 0) return price * quantity;
    }
    return null;
  }
  return val;
};

export const getFee = (order: any) => {
  const val = order?.cumExecFee ?? order?.fee;
  if (val === "0" || val === 0 || !val) return null;
  return val;
};

export const getOrderStatus = (order: any) => order?.orderStatus ?? order?.status ?? order?.state;

export const formatStatus = (value: unknown) => {
  const status = String(value ?? "").replace(/[_-]+/g, " ").trim().toLowerCase();
  return status ? status.replace(/\b\w/g, (char) => char.toUpperCase()) : "—";
};

export const getOrderQuantity = (order: any) => {
  const direct = order?.quantity ?? order?.amount ?? order?.size ?? order?.origQty;
  if (direct !== undefined && direct !== null && direct !== "") return direct;
  const executed = Number(order?.cumExecQty);
  const leaves = Number(order?.leavesQty);
  return Number.isFinite(executed) && Number.isFinite(leaves) ? executed + leaves : undefined;
};

export const getFilledQuantity = (order: any) => {
  const val = order?.filledQuantity ?? order?.filled ?? order?.cumExecQty ?? order?.executedQty;
  if (val === "0" || val === 0 || !val) {
    if (isOrderFilled(order)) return getOrderQuantity(order) ?? 0;
    return 0;
  }
  return val;
};

export const getOrderTotal = (order: any) => {
  const total = Number(order?.total);
  if (Number.isFinite(total) && total >= 0) return total;
  const price = Number(getOrderPrice(order));
  const quantity = Number(getOrderQuantity(order));
  return Number.isFinite(price) && Number.isFinite(quantity) ? price * quantity : null;
};

export const isBuySide = (side: unknown) => ["BUY", "LONG"].includes(String(side ?? "").toUpperCase());

const num = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export interface OpenOrderRow {
  key: string;
  id: string;
  pair: string;
  base: string;
  quote: string;
  market: string;
  side: string;
  isBuy: boolean;
  price: number | null;
  quantity: number | null;
  filledQuantity: number | null;
  filledPercent: number | null;
  status: string;
  timeMs: number | null;
}

/** Display rows for the Open Orders snapshot: newest first, same field rules as the table. */
export function buildOpenOrderRows(orders: readonly any[]): OpenOrderRow[] {
  return orders.map((order, index) => {
    const price = num(getOrderPrice(order));
    const quantity = num(getOrderQuantity(order));
    const filledQuantity = num(getFilledQuantity(order));
    const filledPercent =
      quantity && quantity > 0 && filledQuantity !== null
        ? Math.min(100, (filledQuantity / quantity) * 100)
        : isOrderFilled(order)
          ? 100
          : null;
    const id = String(order?.id ?? order?.orderId ?? order?.order_id ?? "");
    const pair = getOrderPair(order);
    const [base = "", quote = ""] = pair.split("/");

    return {
      key: id || `open-${index}`,
      id,
      pair,
      base,
      quote,
      market: getOrderMarket(order),
      side: String(order?.side ?? "").toUpperCase(),
      isBuy: isBuySide(order?.side),
      price,
      quantity,
      filledQuantity,
      filledPercent,
      status: formatStatus(getOrderStatus(order)),
      timeMs: parseDate(order?.createdAt ?? order?.created_at ?? order?.timestamp ?? order?.time)?.getTime() ?? null,
    };
  });
}
