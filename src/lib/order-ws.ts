"use client";

import { wsClient } from "./websocket-client";

/**
 * Trading order requests over the trading WebSocket (spot + futures).
 *
 * Frames omit `request_id` (backend defaults). The reply type is not fixed by
 * the contract, so an in-flight request listens to every order/position-shaped
 * frame and settles on the first one that arrives.
 */

const RESPONSE_TIMEOUT_MS = 15_000;
const CONNECT_TIMEOUT_MS = 4_000;

/** Order/position-shaped ack/push frames; order-book streams are excluded. */
const ORDER_RESPONSE_RE =
  /(place|cancel|close)_(spot|futures|margin)_(order|position|oco)|(spot|futures|margin)_(order|position|oco)_\w+|order_(placed|created|cancelled|canceled|update|rejected|failed|error)|position_(closed|updated|rejected|failed|error)/i;

/** Bare error topics a rejected request may come back on. */
const GLOBAL_ERROR_TYPES = new Set(["error", "order_error", "request_error"]);

const FAILED_STATUSES = new Set(["failed", "rejected", "error", "not_found", "notfound"]);

function readMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  return null;
}

/** Non-null means the frame reports a failure and carries the reason. */
function describeFailure(raw: any): string | null {
  const type = String(raw?.type ?? "");
  const data = raw?.data && typeof raw.data === "object" ? raw.data : raw;
  const message =
    readMessage(data?.message) ??
    readMessage(data?.error) ??
    readMessage(data?.reason) ??
    readMessage(data?.detail);

  if (/(error|failed|rejected)/i.test(type)) {
    return message ?? `Server rejected the request (${type})`;
  }
  if (data?.success === false) return message ?? "Order rejected by server";
  const statusCode = Number(data?.statusCode);
  if (Number.isFinite(statusCode) && statusCode >= 400) {
    return message ?? `Server rejected the request (status ${statusCode})`;
  }
  const status = String(data?.status ?? data?.state ?? "").toLowerCase();
  if (FAILED_STATUSES.has(status)) return message ?? `Order ${status}`;
  return null;
}

function looksLikeOrderResponse(type: string): boolean {
  if (!type || /book/i.test(type)) return false;
  return ORDER_RESPONSE_RE.test(type) || GLOBAL_ERROR_TYPES.has(type);
}

function waitForConnection(timeoutMs = CONNECT_TIMEOUT_MS): Promise<void> {
  if (wsClient.getIsConnected()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let done = false;
    const onStatus = (connected: boolean) => {
      if (!connected || done) return;
      done = true;
      clearTimeout(timer);
      unsubscribe();
      resolve();
    };
    const unsubscribe = wsClient.onStatusChange(onStatus);
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      unsubscribe();
      reject(new Error("WebSocket is not connected — order was not sent"));
    }, timeoutMs);
    wsClient.connect();
  });
}

function sendOrderFrame(frame: { type: string; data: Record<string, unknown> }): Promise<any> {
  return waitForConnection().then(
    () =>
      new Promise<any>((resolve, reject) => {
        let settled = false;

        const settle = (action: () => void) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          unsubscribe();
          action();
        };

        const unsubscribe = wsClient.onAnyMessage((data, raw) => {
          const type = String(raw?.type ?? "");
          if (!looksLikeOrderResponse(type)) return;
          const failure = describeFailure(raw);
          settle(() => (failure ? reject(new Error(failure)) : resolve(data ?? raw)));
        });

        const timer = setTimeout(() => {
          settle(() =>
            reject(new Error(`No response to ${frame.type} within ${RESPONSE_TIMEOUT_MS / 1000}s`))
          );
        }, RESPONSE_TIMEOUT_MS);

        if (!wsClient.send(frame)) {
          settle(() => reject(new Error("WebSocket send failed — order was not sent")));
        }
      })
  );
}

export type SpotOrderWsType = "limit" | "market" | "stop";

/**
 * place_spot_order frame, e.g. limit:
 * { type: "place_spot_order", data: { symbol: "BTC/USDT", side: "BUY", type: "limit", price: 67000, quantity: 0.01 } }
 */
export function placeSpotOrderWs(input: {
  symbol: string;
  side: "buy" | "sell";
  type: SpotOrderWsType;
  quantity: number;
  price?: number;
  stopPrice?: number;
}): Promise<any> {
  const payload: Record<string, unknown> = {
    symbol: input.symbol.toUpperCase(),
    side: input.side.toUpperCase(),
    type: input.type,
    quantity: Number(input.quantity),
  };
  if (input.type === "limit") payload.price = Number(input.price);
  if (input.type === "market" && Number(input.price) > 0) payload.price = Number(input.price);
  if (input.type === "stop") {
    const trigger = Number(input.stopPrice ?? input.price);
    payload.price = trigger;
    payload.stopPrice = trigger;
  }
  return sendOrderFrame({ type: "place_spot_order", data: payload });
}

/** cancel_spot_order frame: { type: "cancel_spot_order", data: { orderId } } */
export function cancelSpotOrderWs(orderId: string): Promise<any> {
  return sendOrderFrame({ type: "cancel_spot_order", data: { orderId } });
}

/**
 * place_futures_order frame, e.g. limit:
 * { type: "place_futures_order", data: { pair: "BTC/USDT", side: "LONG", type: "limit",
 *   price: 67000, quantity: 0.1, leverage: 10, marginMode: "ISOLATED" } }
 *
 * Mirrors tradingService.placeFuturesOrder: side buy/sell → LONG/SHORT,
 * stop_buy/stop_sell normalize to "stop" with the trigger forwarded as `price`.
 */
export function placeFuturesOrderWs(data: {
  pair: string;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop_buy" | "stop_sell";
  quantity: number;
  leverage?: number;
  price?: number;
  stopPrice?: number;
  marginMode?: "cross" | "isolated";
  takeProfit?: number;
  stopLoss?: number;
}): Promise<any> {
  const normalizedType =
    data.type === "market" ? "market" : data.type === "limit" ? "limit" : "stop";
  const payload: Record<string, unknown> = {
    pair: data.pair.toUpperCase(),
    side: data.side === "buy" ? "LONG" : "SHORT",
    type: normalizedType,
    quantity: Number(data.quantity),
    leverage: data.leverage,
    marginMode: (data.marginMode ?? "cross").toUpperCase(),
  };
  if (normalizedType === "limit" && typeof data.price === "number") payload.price = data.price;
  if (normalizedType === "stop" && typeof data.stopPrice === "number") payload.price = data.stopPrice;
  if (typeof data.takeProfit === "number") payload.takeProfit = data.takeProfit;
  if (typeof data.stopLoss === "number") payload.stopLoss = data.stopLoss;
  return sendOrderFrame({ type: "place_futures_order", data: payload });
}

/** close_futures_position frame: { type: "close_futures_position", data: { positionId } } */
export function closeFuturesPositionWs(positionId: string): Promise<any> {
  return sendOrderFrame({ type: "close_futures_position", data: { positionId } });
}

/**
 * place_margin_order frame, mirroring the margin REST payloads (limit / market / stop):
 * { type: "place_margin_order", data: { symbol: "BTC/USDT", side: "BUY", type: "limit",
 *   price: 67000, quantity: 0.01, leverage: 10 } }
 */
export function placeMarginOrderWs(data: {
  side: "buy" | "sell";
  base: string;
  quote: string;
  type: "buy_limit" | "sell_limit" | "market" | "buy_stop" | "sell_stop";
  quantity: number;
  leverage: number;
  price?: number;
  stopPrice?: number;
}): Promise<any> {
  const kind =
    data.type === "market" ? "market" : data.type.endsWith("_limit") ? "limit" : "stop";
  const payload: Record<string, unknown> = {
    symbol: `${data.base}/${data.quote}`.toUpperCase(),
    side: data.side.toUpperCase(),
    type: kind,
    quantity: Number(data.quantity),
    leverage: data.leverage,
  };
  if (kind === "limit") payload.price = Number(data.price);
  if (kind === "market" && Number(data.price) > 0) payload.price = Number(data.price);
  if (kind === "stop") payload.stopPrice = Number(data.stopPrice);
  return sendOrderFrame({ type: "place_margin_order", data: payload });
}

/** place_margin_oco frame, mirroring tradingService.placeMarginOCOOrder's body. */
export function placeMarginOcoOrderWs(data: {
  symbol: string;
  order_side: string;
  tp_trigger_price: string;
  sl_trigger_price: string;
  quantity: string;
  tp_limit_price: string;
  sl_limit_price: string;
}): Promise<any> {
  return sendOrderFrame({
    type: "place_margin_oco",
    data: { ...data, symbol: data.symbol.toUpperCase() },
  });
}

/** cancel_margin_order frame: { type: "cancel_margin_order", data: { orderId, symbol? } } */
export function cancelMarginOrderWs(orderId: string, symbol?: string): Promise<any> {
  return sendOrderFrame({
    type: "cancel_margin_order",
    data: {
      orderId,
      ...(symbol ? { symbol: symbol.toUpperCase() } : {}),
    },
  });
}
