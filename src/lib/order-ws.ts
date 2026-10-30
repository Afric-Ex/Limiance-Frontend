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
/** History is read-only and has a REST fallback, so settle (and fall back) sooner. */
const HISTORY_RESPONSE_TIMEOUT_MS = 8_000;

/** Exact ack/reject topics documented in WEBSOCKET_MESSAGES.md §11. */
const ORDER_RESPONSE_TYPES = new Set([
  "order_placed",
  "order_rejected",
  "order_cancelled",
  "cancel_rejected",
  "margin_order_placed",
  "margin_order_rejected",
  "margin_order_cancelled",
  "cancel_margin_rejected",
  "futures_order_placed",
  "futures_order_rejected",
  "position_closed",
  "close_position_rejected",
]);

/**
 * Fallback for unlisted order/position-shaped replies. Anchored so live push
 * topics such as `user_order_update` can never settle a pending request.
 */
const ORDER_RESPONSE_RE =
  /^(?:place|cancel|close)_(?:spot|futures|margin)_(?:order|position|oco)\b|^(?:spot|futures|margin)_(?:order|position|oco)_\w+$|^(?:order|position)_(?:placed|created|cancelled|canceled|closed|updated|rejected|failed|error)$/i;

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

/** Server-push topics that must never settle a pending order request. */
const PUSH_UPDATE_TYPES = new Set([
  "spot_order_updated",
  "order_updated",
  "order_update",
  "user_order_update",
  "position_updated",
  "position_update",
]);

function looksLikeOrderResponse(type: string): boolean {
  if (!type || /book/i.test(type)) return false;
  const normalized = type.toLowerCase();
  if (PUSH_UPDATE_TYPES.has(normalized) || /update/i.test(normalized)) return false;
  return (
    ORDER_RESPONSE_TYPES.has(normalized) ||
    ORDER_RESPONSE_RE.test(type) ||
    GLOBAL_ERROR_TYPES.has(normalized)
  );
}

function createRequestId(type: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${type}-${random}`;
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

/** Reads a request id from either the frame root or its payload. */
function readRequestId(raw: any): string | undefined {
  const rootId = raw?.requestId ?? raw?.request_id;
  if (typeof rootId === "string" && rootId) return rootId;
  const data = raw?.data && typeof raw.data === "object" ? raw.data : null;
  const dataId = data?.requestId ?? data?.request_id;
  if (typeof dataId === "string" && dataId) return dataId;
  return undefined;
}

/**
 * Serializes order submissions per market. While the backend does not echo
 * `requestId`, this guarantees only one request per market is awaiting a reply,
 * so a reply can never settle the wrong request.
 */
const orderQueues = new Map<string, Promise<unknown>>();

function orderQueueKey(frame: { type: string; data: Record<string, unknown> }): string {
  const market = frame.data?.symbol ?? frame.data?.pair ?? frame.data?.base;
  return market ? String(market).toUpperCase() : frame.type;
}

/** Best-effort check that a reply without a requestId belongs to this market. */
function replyMatchesMarket(
  frame: { type: string; data: Record<string, unknown> },
  raw: any
): boolean {
  const frameMarket = frame.data?.symbol ?? frame.data?.pair;
  if (!frameMarket) return true;
  const data = raw?.data && typeof raw.data === "object" ? raw.data : raw;
  const replyMarket = data?.symbol ?? data?.pair ?? raw?.symbol ?? raw?.pair;
  if (!replyMarket) return true;
  return String(replyMarket).toUpperCase() === String(frameMarket).toUpperCase();
}

function enqueueOrderFrame<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = orderQueues.get(key) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(task);
  const tracked = run.catch(() => undefined);
  orderQueues.set(key, tracked);
  tracked.finally(() => {
    if (orderQueues.get(key) === tracked) orderQueues.delete(key);
  });
  return run;
}

function sendOrderFrame(frame: { type: string; data: Record<string, unknown> }): Promise<any> {
  const requestId = createRequestId(frame.type);
  return enqueueOrderFrame(orderQueueKey(frame), () => sendOrderFrameOnce(frame, requestId));
}

function sendOrderFrameOnce(
  frame: { type: string; data: Record<string, unknown> },
  requestId: string
): Promise<any> {
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

          const incomingRequestId = readRequestId(raw);
          if (incomingRequestId && incomingRequestId !== requestId) return;
          if (!incomingRequestId && !replyMatchesMarket(frame, raw)) return;

          const failure = describeFailure(raw);
          settle(() => (failure ? reject(new Error(failure)) : resolve(data ?? raw)));
        });

        const timer = setTimeout(() => {
          settle(() =>
            reject(new Error(`No response to ${frame.type} within ${RESPONSE_TIMEOUT_MS / 1000}s`))
          );
        }, RESPONSE_TIMEOUT_MS);

        if (!wsClient.send({ ...frame, requestId })) {
          settle(() => reject(new Error("WebSocket send failed — order was not sent")));
        }
      })
  );
}

export type SpotOrderWsType = "limit" | "market" | "stop";

/**
 * place_spot_order frame, e.g. limit:
 * { type: "place_spot_order", data: { symbol: "BTC/USDT", side: "BUY", type: "limit",
 *   price: 67000, quantity: 0.01, takeProfit: 69000, stopLoss: 65000 } }
 *
 * TP/SL are attached to the entry order as conditional triggers (doc §3.5).
 */
export function placeSpotOrderWs(input: {
  symbol: string;
  side: "buy" | "sell";
  type: SpotOrderWsType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
}): Promise<any> {
  const quantity = Number(input.quantity);
  const price = Number(input.price);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }
  if (input.type === "limit" && (!Number.isFinite(price) || price <= 0)) {
    throw new Error("Price must be greater than zero");
  }

  const payload: Record<string, unknown> = {
    symbol: input.symbol.toUpperCase(),
    side: input.side.toUpperCase(),
    type: input.type,
    quantity,
  };
  if (input.type === "limit") payload.price = price;
  if (input.type === "market" && Number(input.price) > 0) payload.price = Number(input.price);
  if (input.type === "stop") {
    const trigger = Number(input.stopPrice ?? input.price);
    payload.price = trigger;
    payload.stopPrice = trigger;
  }
  if (Number(input.takeProfit) > 0) payload.takeProfit = Number(input.takeProfit);
  if (Number(input.stopLoss) > 0) payload.stopLoss = Number(input.stopLoss);
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
 *
 * TP/SL are attached to the entry order as conditional triggers (doc §5.5).
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
  if (Number(data.takeProfit) > 0) payload.takeProfit = Number(data.takeProfit);
  if (Number(data.stopLoss) > 0) payload.stopLoss = Number(data.stopLoss);
  return sendOrderFrame({ type: "place_futures_order", data: payload });
}

/** close_futures_position frame: { type: "close_futures_position", data: { positionId } } */
export function closeFuturesPositionWs(positionId: string): Promise<any> {
  return sendOrderFrame({ type: "close_futures_position", data: { positionId } });
}

/**
 * place_margin_order frame, mirroring the margin REST payloads (limit / market / stop):
 * { type: "place_margin_order", data: { symbol: "BTC/USDT", side: "BUY", type: "limit",
 *   price: 67000, quantity: 0.01, leverage: 10, takeProfit: 69000, stopLoss: 65000 } }
 *
 * TP/SL are attached to the entry order as conditional triggers (doc §4.5).
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
  takeProfit?: number;
  stopLoss?: number;
}): Promise<any> {
  const kind =
    data.type === "market" ? "market" : data.type.endsWith("_limit") ? "limit" : "stop";
  const quantity = Number(data.quantity);
  const price = Number(data.price);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }
  if (kind !== "market" && (!Number.isFinite(price) || price <= 0)) {
    throw new Error("Price must be greater than zero");
  }
  if (kind === "stop" && !(Number(data.stopPrice) > 0)) {
    throw new Error("Stop price must be greater than zero");
  }

  const payload: Record<string, unknown> = {
    symbol: `${data.base}/${data.quote}`.toUpperCase(),
    side: data.side.toUpperCase(),
    type: kind,
    quantity,
    leverage: data.leverage,
  };
  if (kind === "limit") payload.price = price;
  if (kind === "market" && Number(data.price) > 0) payload.price = Number(data.price);
  if (kind === "stop") payload.stopPrice = Number(data.stopPrice);
  if (Number(data.takeProfit) > 0) payload.takeProfit = Number(data.takeProfit);
  if (Number(data.stopLoss) > 0) payload.stopLoss = Number(data.stopLoss);
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
  if (!(Number(data.quantity) > 0)) {
    throw new Error("Quantity must be greater than zero");
  }
  if (!(Number(data.tp_trigger_price) > 0) || !(Number(data.sl_trigger_price) > 0)) {
    throw new Error("Trigger prices must be greater than zero");
  }
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

// ─── Order history (read-only queries) ──────────────────────────────────────

/** Reply topics documented in WEBSOCKET_MESSAGES.md §3.13–3.15, §4.10–4.11, §5.10 / §11. */
const SPOT_ORDER_HISTORY_RESPONSE = "spot_order_history";
const SPOT_ORDER_HISTORY_ERROR = "spot_order_history_error";
const MARGIN_ORDER_HISTORY_RESPONSE = "margin_order_history";
const MARGIN_ORDER_HISTORY_ERROR = "margin_order_history_error";
const FUTURES_ORDER_HISTORY_RESPONSE = "futures_order_history";
const FUTURES_ORDER_HISTORY_ERROR = "futures_order_history_error";

/** Status filter accepted by spot (§3.14) and margin (§4.11) history queries. */
export type OrderHistoryStatus = "OPEN" | "FILLED" | "CANCELLED" | "REJECTED";

export interface OrderHistoryWsParams {
  status?: OrderHistoryStatus;
  page?: number | string;
  limit?: number | string;
}

/**
 * One-shot history query over the trading WebSocket. An empty `data` object is
 * the documented default (page 1, limit 50); the docs show page/limit as
 * strings, so numeric inputs are stringified. Resolves with the reply payload
 * (`{ success, statusCode, message, data: [...], totalPages, ... }`), which
 * matches the REST response shape consumers already read.
 */
function queryOrderHistory(
  frameType: string,
  responseType: string,
  errorType: string,
  params?: OrderHistoryWsParams
): Promise<any> {
  const data: Record<string, unknown> = {};
  if (params?.status) data.status = params.status.toUpperCase();
  if (params?.page !== undefined) data.page = String(params.page);
  if (params?.limit !== undefined) data.limit = String(params.limit);

  const requestId = createRequestId(frameType);
  const payloadData = { ...data, requestId };

  // Serialize same-type history queries so a reply without a requestId can
  // never be claimed by more than one pending query.
  return enqueueOrderFrame(`history:${frameType}`, () =>
    waitForConnection().then(
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

          const unsubscribe = wsClient.onAnyMessage((payload, raw) => {
            const type = String(raw?.type ?? "");
            if (type !== responseType && type !== errorType) return;

            const incomingRequestId = readRequestId(raw);
            if (incomingRequestId && incomingRequestId !== requestId) return;

            const failure = describeFailure(raw);
            settle(() => (failure ? reject(new Error(failure)) : resolve(payload ?? raw)));
          });

          const timer = setTimeout(() => {
            settle(() =>
              reject(
                new Error(
                  `No response to ${frameType} within ${HISTORY_RESPONSE_TIMEOUT_MS / 1000}s`
                )
              )
            );
          }, HISTORY_RESPONSE_TIMEOUT_MS);

          if (!wsClient.send({ type: frameType, data: payloadData })) {
            settle(() => reject(new Error(`WebSocket send failed — ${frameType} not requested`)));
          }
        })
    )
  );
}

/** get_spot_orders frame (doc §3.13–3.15). */
export function getSpotOrderHistoryWs(params?: OrderHistoryWsParams): Promise<any> {
  return queryOrderHistory(
    "get_spot_orders",
    SPOT_ORDER_HISTORY_RESPONSE,
    SPOT_ORDER_HISTORY_ERROR,
    params
  );
}

/** get_margin_order_history frame (doc §4.10–4.11). */
export function getMarginOrderHistoryWs(params?: OrderHistoryWsParams): Promise<any> {
  return queryOrderHistory(
    "get_margin_order_history",
    MARGIN_ORDER_HISTORY_RESPONSE,
    MARGIN_ORDER_HISTORY_ERROR,
    params
  );
}

/** get_futures_order_history frame (doc §5.10); page/limit only, no status filter. */
export function getFuturesOrderHistoryWs(params?: {
  page?: number | string;
  limit?: number | string;
}): Promise<any> {
  return queryOrderHistory(
    "get_futures_order_history",
    FUTURES_ORDER_HISTORY_RESPONSE,
    FUTURES_ORDER_HISTORY_ERROR,
    params
  );
}
