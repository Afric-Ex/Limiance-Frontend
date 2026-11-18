import type { QueryClient } from "@tanstack/react-query";

/**
 * Keeps the Open Orders cache in sync with the live order WebSocket stream.
 *
 * `order_placed` only carries symbol/side/price/quantity (no order id), while
 * `order_filled` carries `order_id`, the executed price/quantity and fee. We
 * therefore seed an optimistic OPEN row from the placement ack, keyed by the
 * client-generated `clientOrderId`, and reconcile the fill against it. Fills
 * are matched by `order_id` whenever the backend provides one; the
 * symbol+side+price+quantity heuristic is only a fallback until then.
 */

export type OrderEventMarket = "spot" | "margin" | "futures";

export type OrderFrameKind = "filled" | "cancelled" | "updated";

export interface OrderFrameResult {
  kind: OrderFrameKind;
  orderId?: string;
  clientOrderId?: string;
  symbol?: string;
  side?: string;
  price?: number | null;
  status?: string;
  terminal: boolean;
  market?: OrderEventMarket;
}

export interface PlacedOrderMeta {
  market: OrderEventMarket;
  pair: string;
  /** UI order type: limit / market / stop / oco. */
  type: string;
  side?: string;
  /** Submitted quantity. The ack's quantity can echo the filled qty instead. */
  quantity?: number | string;
}

interface PendingOrder {
  clientOrderId: string;
  orderId?: string;
  pair: string;
  symbolKey: string;
  side: string;
  price: number | null;
  quantity: number | null;
  filledQuantity: number;
  filledValue: number;
  avgPrice: number | null;
  lastFillPrice: number | null;
  lastFillQty: number | null;
  feeAmount: number;
  fee?: string;
  feeCurrency?: string;
  market: OrderEventMarket;
  type: string;
  createdAt: string;
  createdAtMs: number;
}

interface BufferedFill {
  data: Record<string, any>;
  at: number;
  terminalOnStatus: boolean;
}

const PENDING_PREFIX = "pending:";
const FILL_BUFFER_MS = 10_000;

const pendingOrders: PendingOrder[] = [];
const bufferedFills: BufferedFill[] = [];
/** The same WS frame reaches both the topic handler and onAnyMessage. */
const processedFrames = new WeakSet<object>();

/**
 * Open-orders snapshots can be stale (the backend sometimes returns an OPEN
 * row with cumExecQty/avgPrice still zero after a fill). Keep the live fill
 * patch keyed by order id and merge it back onto every snapshot refetch.
 */
interface LiveOrderOverride {
  row?: Record<string, any>;
  removed?: boolean;
  updatedAt: number;
}

const OVERRIDE_TTL_MS = 5 * 60_000;
const liveOrderOverrides = new Map<string, LiveOrderOverride>();

const overrideIds = (row: Record<string, any>): string[] =>
  rowIds(row)
    .map((id) => id.toLowerCase())
    .filter(Boolean);

function rememberLiveOrder(row: Record<string, any>, removed = false): void {
  const now = Date.now();
  for (const id of overrideIds(row)) {
    liveOrderOverrides.set(id, { row: removed ? undefined : row, removed, updatedAt: now });
  }
}

function pruneLiveOrderOverrides(): void {
  const now = Date.now();
  for (const [id, entry] of liveOrderOverrides) {
    if (now - entry.updatedAt > OVERRIDE_TTL_MS) liveOrderOverrides.delete(id);
  }
}

function overrideForRow(row: Record<string, any>): LiveOrderOverride | undefined {
  for (const id of overrideIds(row)) {
    const entry = liveOrderOverrides.get(id);
    if (entry) return entry;
  }
  return undefined;
}

const num = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const str = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
};

export const normalizeOrderSymbol = (value: unknown): string =>
  String(value ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

const isOrderEventType = (type: string): boolean =>
  /^(?:user_)?orders?_(?:filled|partially_filled|partial|update|updated|executed|open|closed|cancelled|canceled|rejected)$/i.test(
    type
  ) ||
  /^(?:spot|margin|futures)_orders?_(?:filled|partially_filled|update|updated|cancelled|canceled|rejected)$/i.test(
    type
  );

const isCancelType = (type: string): boolean => /cancel/i.test(type);

const unwrapEnvelope = (value: any): Record<string, any> => {
  if (!value || typeof value !== "object") return {};
  if (value.data && typeof value.data === "object" && !Array.isArray(value.data)) {
    return value.data;
  }
  return value;
};

const extractFillData = (raw: any): Record<string, any> => {
  const data = unwrapEnvelope(raw);
  const order = data?.order && typeof data.order === "object" ? data.order : data;
  // Live `user_order_update` wraps the execution record one level deeper:
  // { order: { status_code, success, trade: { id, base, quote, price, ... } } }.
  const trade = order?.trade && typeof order.trade === "object" ? order.trade : order;
  if (!trade || typeof trade !== "object") return {};

  const pair =
    trade.pair ??
    trade.symbol ??
    (trade.base && trade.quote ? `${trade.base}/${trade.quote}` : undefined);

  return {
    ...trade,
    pair,
    symbol: pair,
    order_id: trade.order_id ?? trade.orderId ?? trade.id,
    fill_price: trade.fill_price ?? trade.fillPrice ?? trade.avgPrice ?? trade.price,
    fill_qty: trade.fill_qty ?? trade.fillQty ?? trade.filledQuantity ?? trade.cumExecQty,
    fee_currency: trade.fee_currency ?? trade.feeCurrency ?? trade.feeAsset,
  };
};

const isTerminalStatus = (status: string): boolean =>
  ["filled", "closed", "cancelled", "canceled", "rejected", "expired"].includes(status);

const extractMarket = (raw: any): OrderEventMarket | undefined => {
  const data = unwrapEnvelope(raw);
  const order = data?.order && typeof data.order === "object" ? data.order : data;
  const trade = order?.trade && typeof order.trade === "object" ? order.trade : order;
  const value =
    raw?.market_type ??
    raw?.marketType ??
    raw?.market ??
    data?.market_type ??
    data?.marketType ??
    data?.market ??
    trade?.market_type ??
    trade?.marketType ??
    trade?.market;

  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase();
  if (normalized.includes("future")) return "futures";
  if (normalized.includes("margin")) return "margin";
  if (normalized.includes("spot")) return "spot";
  return undefined;
};

/* ─── open-orders cache plumbing ─────────────────────────────────────────── */

function extractList(value: any): any[] | null {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value.data)) return value.data;
  if (value.data && typeof value.data === "object" && Array.isArray(value.data.data)) {
    return value.data.data;
  }
  return null;
}

function withList(value: any, list: any[]): any {
  if (Array.isArray(value)) return list;
  if (value && typeof value === "object") {
    if (Array.isArray(value.data)) return { ...value, data: list };
    if (value.data && typeof value.data === "object" && Array.isArray(value.data.data)) {
      return { ...value, data: { ...value.data, data: list } };
    }
  }
  return list;
}

function updateOpenOrderCaches(
  queryClient: QueryClient,
  updater: (list: any[], key: readonly unknown[], marketHint?: OrderEventMarket) => any[]
): void {
  const sources: Array<{ root: string; market?: OrderEventMarket }> = [
    { root: "open-orders" },
    { root: "margin-open-orders", market: "margin" },
    { root: "futures-open-orders", market: "futures" },
  ];
  for (const source of sources) {
    const entries = queryClient.getQueriesData({ queryKey: [source.root] });
    for (const [key, old] of entries) {
      const list = extractList(old);
      if (!list) continue;
      queryClient.setQueryData(key, withList(old, updater(list, key, source.market)));
    }
  }
}

/** Cache keys carry an optional pair (index 1) and market filter (index 2). */
function cacheAllowsOrder(
  key: readonly unknown[],
  order: { pair: string; market: OrderEventMarket },
  marketHint?: OrderEventMarket
): boolean {
  if (marketHint && order.market !== marketHint) return false;
  const pair = key[1];
  if (typeof pair === "string" && pair && normalizeOrderSymbol(pair) !== normalizeOrderSymbol(order.pair)) {
    return false;
  }
  const market = key[2];
  if (typeof market === "string" && market !== "all" && market !== order.market) {
    return false;
  }
  return true;
}

function rowMatchesId(row: any, id: string): boolean {
  const target = id.toLowerCase();
  return [row?.id, row?.orderId, row?.order_id, row?.clientOrderId].some(
    (value) => value !== undefined && value !== null && String(value).toLowerCase() === target
  );
}

function removeOpenOrdersById(queryClient: QueryClient, id: string): void {
  updateOpenOrderCaches(queryClient, (list) => list.filter((row) => !rowMatchesId(row, id)));
}

/**
 * Last-resort cleanup for an optimistic row whose fill could not be matched by
 * the heuristic (e.g. a large price improvement). Only removes when exactly one
 * pending row on that symbol/side remains, so a distinct resting order is safe.
 */
function removeSingleSyntheticMatch(queryClient: QueryClient, fill: Record<string, any>): void {
  const symbolKey = normalizeOrderSymbol(fill.symbol ?? fill.pair);
  const side = String(fill.side ?? "").toUpperCase();
  if (!symbolKey) return;

  const rawTime = num(fill.timestamp ?? fill.time);
  const fillTimeMs =
    rawTime === null ? null : rawTime < 1e12 ? rawTime * 1000 : rawTime;

  updateOpenOrderCaches(queryClient, (list) => {
    const candidates = list.filter((row) => {
      if (!isPendingOrderId(row?.id)) return false;
      const rowSymbol = normalizeOrderSymbol(row?.pair ?? row?.symbol);
      const rowSide = String(row?.side ?? "").toUpperCase();
      if (rowSymbol !== symbolKey || (side && rowSide && rowSide !== side)) return false;
      if (fillTimeMs !== null) {
        const placedAt = Date.parse(String(row?.createdAt ?? ""));
        if (Number.isFinite(placedAt) && placedAt > fillTimeMs + 60_000) return false;
      }
      return true;
    });
    if (candidates.length !== 1) return list;
    const clientOrderId = String(candidates[0].id).slice(PENDING_PREFIX.length);
    const index = pendingOrders.findIndex((pending) => pending.clientOrderId === clientOrderId);
    if (index !== -1) pendingOrders.splice(index, 1);
    return list.filter((row) => row !== candidates[0]);
  });
}

function rowIds(row: any): string[] {
  return [row?.id, row?.orderId, row?.order_id, row?.clientOrderId]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map((value) => String(value));
}

/** Spread helper: `undefined` fields in a rebuilt row must not blank out the
 *  original snapshot's values (quantity, price, ids, ...). */
const definedOnly = (obj: Record<string, any>): Record<string, any> =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));

/* ─── placement ──────────────────────────────────────────────────────────── */

function buildRow(pending: PendingOrder): Record<string, any> {
  const isPartial =
    pending.filledQuantity > 0 &&
    (pending.quantity === null ||
      pending.filledQuantity < pending.quantity - pending.quantity * 1e-8);
  const status = isPartial ? "PARTIALLY_FILLED" : "OPEN";

  return {
    id: pending.orderId ?? `${PENDING_PREFIX}${pending.clientOrderId}`,
    orderId: pending.orderId,
    order_id: pending.orderId,
    clientOrderId: pending.clientOrderId,
    market_type: pending.market,
    marketType: pending.market,
    symbol: pending.pair,
    pair: pending.pair,
    base: pending.pair.split("/")[0],
    quote: pending.pair.split("/")[1],
    side: pending.side,
    type: pending.type,
    order_type: pending.type,
    price: pending.price ?? undefined,
    quantity: pending.quantity ?? undefined,
    filledQuantity: pending.filledQuantity,
    filledValue: pending.filledValue,
    avgPrice: pending.avgPrice ?? undefined,
    cumExecQty: pending.filledQuantity,
    cumExecValue: pending.filledValue,
    cumExecFee: pending.feeAmount > 0 ? String(pending.feeAmount) : undefined,
    remainingQuantity:
      pending.quantity !== null
        ? Math.max(0, pending.quantity - pending.filledQuantity)
        : undefined,
    lastFillPrice: pending.lastFillPrice ?? undefined,
    lastFillQty: pending.lastFillQty ?? undefined,
    fillPrice: pending.lastFillPrice ?? undefined,
    fillQty: pending.lastFillQty ?? undefined,
    fillFee: pending.fee,
    status,
    orderStatus: status,
    createdAt: pending.createdAt,
    updatedAt: new Date().toISOString(),
    fee: pending.fee,
    feeCurrency: pending.feeCurrency,
  };
}

function insertRow(queryClient: QueryClient, pending: PendingOrder): void {
  const row = buildRow(pending);
  updateOpenOrderCaches(queryClient, (list, key, marketHint) => {
    if (!cacheAllowsOrder(key, pending, marketHint)) return list;
    const ids = new Set(rowIds(row).map((id) => id.toLowerCase()));
    const withoutDuplicates = list.filter(
      (existing) => !rowIds(existing).some((id) => ids.has(id.toLowerCase()))
    );
    return [row, ...withoutDuplicates];
  });
}

function updateRow(queryClient: QueryClient, pending: PendingOrder): void {
  const row = buildRow(pending);
  updateOpenOrderCaches(queryClient, (list, key, marketHint) => {
    if (!cacheAllowsOrder(key, pending, marketHint)) return list;
    let replaced = false;
    const next = list.map((existing) => {
      if (replaced || !rowIds(existing).some((id) => rowIds(row).some((x) => x.toLowerCase() === id.toLowerCase()))) {
        return existing;
      }
      replaced = true;
      return { ...existing, ...definedOnly(row) };
    });
    return replaced ? next : [row, ...next];
  });
}

export function isPendingOrderId(id: unknown): boolean {
  return typeof id === "string" && id.startsWith(PENDING_PREFIX);
}

export interface LiveOpenOrdersFilter {
  pair?: string;
  market?: OrderEventMarket | "all";
}

function pendingAllowed(pending: PendingOrder, filter: LiveOpenOrdersFilter): boolean {
  if (filter.market && filter.market !== "all" && pending.market !== filter.market) {
    return false;
  }
  if (filter.pair && normalizeOrderSymbol(filter.pair) !== pending.symbolKey) {
    return false;
  }
  return true;
}

function pendingMatchesRow(pending: PendingOrder, row: Record<string, any>): boolean {
  const rowSymbol = normalizeOrderSymbol(
    row.pair ?? row.symbol ?? (row.base && row.quote ? `${row.base}/${row.quote}` : undefined)
  );
  if (rowSymbol && rowSymbol !== pending.symbolKey) return false;

  const rowSide = String(row.side ?? "").toUpperCase();
  if (rowSide && pending.side && rowSide !== pending.side) return false;

  const rowPrice = num(row.price);
  if (pending.price !== null && rowPrice !== null) {
    const tolerance = Math.max(1e-8, Math.abs(pending.price) * 0.05);
    if (Math.abs(pending.price - rowPrice) > tolerance) return false;
  }

  const rowQty = num(row.quantity);
  if (pending.quantity !== null && rowQty !== null && rowQty > 0) {
    if (Math.abs(pending.quantity - rowQty) > Math.max(1e-8, rowQty * 1e-6)) {
      return false;
    }
  }

  return true;
}

/**
 * Overlay in-session fill state on an open-orders snapshot. Snapshots are the
 * source of pre-existing orders, but they can lag a fill; the live override
 * keeps the filled quantity, average fill, value and fee visible.
 */
export function mergeLiveOpenOrders(
  rows: readonly Record<string, any>[],
  filter: LiveOpenOrdersFilter = {}
): Record<string, any>[] {
  pruneLiveOrderOverrides();
  const used = new Set<PendingOrder>();
  const merged: Record<string, any>[] = [];

  for (const row of rows) {
    const rowIdsLower = overrideIds(row);
    const exact = pendingOrders.find(
      (pending) =>
        !used.has(pending) &&
        overrideIds(buildRow(pending)).some((id) => rowIdsLower.includes(id))
    );
    const pending =
      exact ?? pendingOrders.find((p) => !used.has(p) && pendingMatchesRow(p, row));

    if (pending) {
      used.add(pending);
      merged.push({ ...row, ...definedOnly(buildRow(pending)) });
      continue;
    }

    const override = overrideForRow(row);
    if (override?.removed) continue;
    merged.push(override?.row ? { ...row, ...override.row } : row);
  }

  for (const pending of pendingOrders) {
    if (used.has(pending) || !pendingAllowed(pending, filter)) continue;
    merged.unshift(buildRow(pending));
  }

  return merged;
}

/** Seed an OPEN row from the `order_placed` ack (skips immediate/market orders). */
export function applyOrderPlaced(
  queryClient: QueryClient,
  ack: any,
  meta: PlacedOrderMeta
): void {
  const data = unwrapEnvelope(ack);
  if (data.success === false) return;

  const type = String(meta.type ?? data.type ?? "").toLowerCase();
  // Immediate/conditional orders either never rest or need trigger metadata the
  // ack does not carry, so only plain resting orders are seeded optimistically.
  if (type.includes("market") || type === "stop" || type === "oco") return;

  const pair = str(data.symbol ?? data.pair) ?? meta.pair;
  if (!pair) return;

  const clientOrderId = str(data.clientOrderId ?? ack?.clientOrderId);
  if (!clientOrderId) return;

  const orderId = str(data.order_id ?? data.orderId ?? data.id);
  const side = String(data.side ?? meta.side ?? "").toUpperCase();
  const now = Date.now();

  const pending: PendingOrder = {
    clientOrderId,
    orderId,
    pair,
    symbolKey: normalizeOrderSymbol(pair),
    side,
    price: num(data.price),
    // The ack can echo the filled quantity (e.g. quantity === fill_qty) instead
    // of the submitted order size, so prefer what the user actually submitted.
    quantity: num(meta.quantity) ?? num(data.quantity ?? data.qty),
    filledQuantity: 0,
    filledValue: 0,
    avgPrice: null,
    lastFillPrice: null,
    lastFillQty: null,
    feeAmount: 0,
    market: meta.market,
    type,
    createdAt: new Date(now).toISOString(),
    createdAtMs: now,
  };

  // A later ack can arrive after the fill that matched it: settle immediately.
  const bufferedIndex = bufferedFills.findIndex((fill) =>
    fillMatchesPending(fill.data, pending)
  );
  if (bufferedIndex !== -1) {
    const [fill] = bufferedFills.splice(bufferedIndex, 1);
    pendingOrders.push(pending);
    consumeFill(queryClient, pending, fill.data, {
      terminalOnStatus: fill.terminalOnStatus,
    });
    return;
  }

  pendingOrders.push(pending);
  insertRow(queryClient, pending);
}

/* ─── fills ──────────────────────────────────────────────────────────────── */

function fillMatchesPending(fill: Record<string, any>, pending: PendingOrder): boolean {
  const fillId = str(fill.order_id ?? fill.orderId ?? fill.id);
  if (fillId && pending.orderId) return fillId === pending.orderId;

  const symbolKey = normalizeOrderSymbol(fill.symbol ?? fill.pair);
  if (symbolKey && symbolKey !== pending.symbolKey) return false;

  const side = String(fill.side ?? "").toUpperCase();
  if (side && pending.side && side !== pending.side) return false;

  const fillQty = num(fill.fill_qty ?? fill.fillQty ?? fill.filledQuantity);
  if (pending.quantity !== null && fillQty !== null && fillQty > pending.quantity * 1.0000001) {
    return false;
  }

  const fillPrice = num(fill.fill_price ?? fill.fillPrice ?? fill.price ?? fill.avgPrice);
  if (pending.price !== null && fillPrice !== null) {
    const tolerance = Math.max(1e-8, Math.abs(pending.price) * 0.05);
    if (Math.abs(pending.price - fillPrice) > tolerance) return false;
  }

  return true;
}

function findPendingFill(fill: Record<string, any>): PendingOrder | undefined {
  const fillId = str(fill.order_id ?? fill.orderId ?? fill.id);

  // A real order id always wins over the heuristic.
  if (fillId) {
    const exact = pendingOrders.find((pending) => pending.orderId === fillId);
    if (exact) return exact;
  }

  const candidates = pendingOrders.filter((pending) => fillMatchesPending(fill, pending));
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  // Many identical resting orders: prefer one already carrying an id, then the oldest.
  const withId = candidates.filter((pending) => pending.orderId);
  const pool = withId.length > 0 ? withId : candidates;
  return pool.reduce(
    (oldest, pending) => (pending.createdAtMs < oldest.createdAtMs ? pending : oldest),
    pool[0]
  );
}

interface ConsumeFillOptions {
  /** `order_filled` is a per-execution frame; only status updates can close an order. */
  terminalOnStatus: boolean;
}

function consumeFill(
  queryClient: QueryClient,
  pending: PendingOrder,
  fill: Record<string, any>,
  options: ConsumeFillOptions
): { terminal: boolean } {
  const status = String(fill.status ?? fill.state ?? "").toLowerCase();
  const fillId = str(fill.order_id ?? fill.orderId ?? fill.id);
  if (fillId && !pending.orderId) pending.orderId = fillId;

  const fillQty = num(fill.fill_qty ?? fill.fillQty ?? fill.filledQuantity);
  const cumulativeQty = num(fill.cumExecQty);
  const fillPrice = num(
    fill.fill_price ?? fill.fillPrice ?? fill.avgPrice ?? fill.executionPrice ?? fill.price
  );
  const cumulativeValue = num(fill.cumExecValue);
  const feeValue = num(fill.fee ?? fill.fillFee);
  const cumulativeFee = num(fill.cumExecFee);

  const previousQty = pending.filledQuantity;
  let deltaQty = 0;
  if (cumulativeQty !== null) {
    pending.filledQuantity = Math.max(previousQty, cumulativeQty);
    deltaQty = Math.max(0, pending.filledQuantity - previousQty);
  } else if (fillQty !== null) {
    pending.filledQuantity = previousQty + fillQty;
    deltaQty = fillQty;
  }

  if (cumulativeValue !== null) {
    pending.filledValue = Math.max(pending.filledValue, cumulativeValue);
  } else if (deltaQty > 0 && fillPrice !== null) {
    pending.filledValue += deltaQty * fillPrice;
  }
  if (fillPrice !== null) pending.lastFillPrice = fillPrice;
  if (deltaQty > 0) pending.lastFillQty = deltaQty;

  if (pending.filledQuantity > 0 && pending.filledValue > 0) {
    pending.avgPrice = pending.filledValue / pending.filledQuantity;
  } else if (fillPrice !== null) {
    pending.avgPrice = fillPrice;
  }

  if (cumulativeFee !== null) {
    pending.feeAmount = Math.max(pending.feeAmount, cumulativeFee);
  } else if (feeValue !== null) {
    pending.feeAmount += feeValue;
  }
  if (pending.feeAmount > 0) pending.fee = String(pending.feeAmount);
  pending.feeCurrency =
    str(fill.fee_currency ?? fill.feeCurrency ?? fill.feeAsset) ?? pending.feeCurrency;

  // `user_order_update` carries the order quantity as "0.00000000"; treating
  // that as a real order size would mark an untouched order as fully filled.
  const reportedOrderQty = num(fill.quantity ?? fill.origQty);
  const orderQty =
    pending.quantity ??
    (reportedOrderQty !== null && reportedOrderQty > 0 ? reportedOrderQty : null);
  const fullyFilled =
    orderQty !== null &&
    orderQty > 0 &&
    pending.filledQuantity >= orderQty - orderQty * 1e-8;
  const terminal = fullyFilled || (options.terminalOnStatus && isTerminalStatus(status));

  if (terminal) {
    rememberLiveOrder(buildRow(pending), true);
    rememberLiveOrder(
      { id: `${PENDING_PREFIX}${pending.clientOrderId}`, clientOrderId: pending.clientOrderId },
      true
    );
    removeOpenOrdersById(queryClient, `${PENDING_PREFIX}${pending.clientOrderId}`);
    if (pending.orderId) removeOpenOrdersById(queryClient, pending.orderId);
    const index = pendingOrders.indexOf(pending);
    if (index !== -1) pendingOrders.splice(index, 1);
    return { terminal: true };
  }

  // Two rows can describe one order: the synthetic `pending:` row and the
  // snapshot row carrying the server id. Drop the synthetic one and patch the
  // snapshot row in place (it also carries TP/SL and other REST-only fields).
  if (pending.orderId) {
    removeOpenOrdersById(queryClient, `${PENDING_PREFIX}${pending.clientOrderId}`);
  }
  updateRow(queryClient, pending);
  rememberLiveOrder(buildRow(pending));
  return { terminal: false };
}

interface FillApplyOutcome {
  fill: Record<string, any>;
  pending?: PendingOrder;
  terminal: boolean;
  statusTerminal: boolean;
  market?: OrderEventMarket;
}

const isPerFillTopic = (type: string): boolean => /filled|executed|partial/i.test(type);

/**
 * An order can be filled by a resting order that is only present in the
 * snapshot (placed before this session). Patch that row with the execution
 * instead of dropping it, so partial fills keep their qty/avg/value/fee.
 */
function applyFillToSnapshot(
  queryClient: QueryClient,
  fill: Record<string, any>,
  options: ConsumeFillOptions
): { found: boolean; terminal: boolean } {
  const orderId = str(fill.order_id ?? fill.orderId ?? fill.id);
  if (!orderId) return { found: false, terminal: false };

  const status = String(fill.status ?? fill.state ?? "").toLowerCase();
  const fillQty = num(fill.fill_qty ?? fill.fillQty ?? fill.filledQuantity);
  const cumulativeQty = num(fill.cumExecQty);
  const fillPrice = num(
    fill.fill_price ?? fill.fillPrice ?? fill.avgPrice ?? fill.executionPrice ?? fill.price
  );
  const cumulativeValue = num(fill.cumExecValue);
  const feeValue = num(fill.fee ?? fill.fillFee) ?? 0;
  const cumulativeFee = num(fill.cumExecFee);

  let found = false;
  let terminal = false;

  updateOpenOrderCaches(queryClient, (list) =>
    list.flatMap((row) => {
      if (!rowMatchesId(row, orderId)) return [row];
      found = true;

      const currentQty = num(row.cumExecQty ?? row.filledQuantity) ?? 0;
      const currentValue = num(row.cumExecValue ?? row.filledValue) ?? 0;
      const currentFee = num(row.cumExecFee ?? row.fee) ?? 0;

      const nextQty =
        cumulativeQty !== null
          ? Math.max(currentQty, cumulativeQty)
          : currentQty + (fillQty ?? 0);
      const nextValue =
        cumulativeValue !== null
          ? Math.max(currentValue, cumulativeValue)
          : currentValue + (fillQty ?? 0) * (fillPrice ?? 0);
      const nextFee =
        cumulativeFee !== null ? Math.max(currentFee, cumulativeFee) : currentFee + feeValue;
      const avgPrice =
        nextQty > 0 && nextValue > 0 ? nextValue / nextQty : fillPrice ?? num(row.avgPrice);

      const orderQty = num(row.quantity);
      terminal =
        (orderQty !== null &&
          orderQty > 0 &&
          nextQty >= orderQty - orderQty * 1e-8) ||
        (options.terminalOnStatus && isTerminalStatus(status));
      if (terminal) return [];

      const patched = {
        ...row,
        filledQuantity: nextQty,
        cumExecQty: nextQty,
        filledValue: nextValue,
        cumExecValue: nextValue,
        avgPrice: avgPrice ?? undefined,
        cumExecFee: nextFee > 0 ? String(nextFee) : row.cumExecFee,
        fee: nextFee > 0 ? String(nextFee) : row.fee,
        fillPrice: fillPrice ?? row.fillPrice,
        fillQty: fillQty ?? row.fillQty,
        fillFee: feeValue > 0 ? String(feeValue) : row.fillFee,
        remainingQuantity:
          orderQty !== null ? Math.max(0, orderQty - nextQty) : row.remainingQuantity,
        status: nextQty > 0 ? "PARTIALLY_FILLED" : row.status,
        orderStatus: nextQty > 0 ? "PARTIALLY_FILLED" : row.orderStatus,
        updatedAt: new Date().toISOString(),
      };
      rememberLiveOrder(patched);
      return [patched];
    })
  );

  if (found && terminal) {
    rememberLiveOrder({ id: orderId, orderId }, true);
  }

  return { found, terminal };
}

export function applyOrderFilled(
  queryClient: QueryClient,
  frame: any
): FillApplyOutcome | null {
  const fill = extractFillData(frame);
  if (!fill || Object.keys(fill).length === 0) return null;

  const type = String(frame?.type ?? "");
  const terminalOnStatus = !isPerFillTopic(type);
  const status = String(fill.status ?? fill.state ?? "").toLowerCase();
  const pending = findPendingFill(fill);
  if (pending) {
    const { terminal } = consumeFill(queryClient, pending, fill, { terminalOnStatus });
    return {
      fill,
      pending,
      terminal,
      statusTerminal: isTerminalStatus(status),
      market: pending.market,
    };
  }

  const snapshot = applyFillToSnapshot(queryClient, fill, { terminalOnStatus });
  if (snapshot.found) {
    return {
      fill,
      terminal: snapshot.terminal,
      statusTerminal: isTerminalStatus(status),
      market: extractMarket(frame),
    };
  }

  // The fill may have preceded the placement ack. Keep it around briefly so the
  // ack can reconcile it instead of leaving a phantom OPEN row. Only recent
  // executions are buffered so an old resting fill cannot claim a new order.
  const orderId = str(fill.order_id ?? fill.orderId ?? fill.id);
  const now = Date.now();
  while (bufferedFills.length > 0 && now - bufferedFills[0].at > FILL_BUFFER_MS) {
    bufferedFills.shift();
  }
  const rawTime = num(fill.timestamp ?? fill.time);
  const fillTimeMs =
    rawTime === null ? null : rawTime < 1e12 ? rawTime * 1000 : rawTime;
  const isRecent = fillTimeMs === null || now - fillTimeMs <= FILL_BUFFER_MS;
  if (isRecent && bufferedFills.length < 50) {
    bufferedFills.push({ data: fill, at: now, terminalOnStatus });
  }

  // Unknown order that was not seeded this session: if it filled, it simply is
  // no longer open — drop any snapshot row carrying that id.
  if (orderId) removeOpenOrdersById(queryClient, orderId);
  removeSingleSyntheticMatch(queryClient, fill);

  return {
    fill,
    terminal: isTerminalStatus(status),
    statusTerminal: isTerminalStatus(status),
    market: extractMarket(frame),
  };
}

export function applyOrderCancelled(queryClient: QueryClient, frame: any): void {
  const data = extractFillData(frame);
  const orderId = str(data.order_id ?? data.orderId ?? data.id);
  const clientOrderId = str(data.clientOrderId);
  let matchedPending = false;

  // Remember the removal so a stale REST snapshot refetch cannot resurrect the
  // cancelled order for the override TTL.
  if (orderId) rememberLiveOrder({ id: orderId, orderId, order_id: orderId }, true);
  if (clientOrderId) {
    rememberLiveOrder(
      { id: `${PENDING_PREFIX}${clientOrderId}`, clientOrderId },
      true
    );
  }

  if (clientOrderId) {
    removeOpenOrdersById(queryClient, `${PENDING_PREFIX}${clientOrderId}`);
    matchedPending = true;
  }
  if (orderId) {
    removeOpenOrdersById(queryClient, orderId);
    const index = pendingOrders.findIndex((pending) => pending.orderId === orderId);
    if (index !== -1) {
      pendingOrders.splice(index, 1);
      matchedPending = true;
    }
  }
  // Cancellations from another session carry only the server order id, which the
  // id-less `order_placed` ack could not store: fall back to the single
  // matching optimistic row so it does not linger.
  if (!matchedPending) removeSingleSyntheticMatch(queryClient, data);
}

/** Remove a cancelled order locally instead of refetching the whole list. */
export function removeOpenOrder(queryClient: QueryClient, orderId: string): void {
  // Keys both the server id and the synthetic/client id so a stale snapshot
  // refetch stays hidden for the override TTL.
  rememberLiveOrder(
    {
      id: `${PENDING_PREFIX}${orderId}`,
      orderId,
      order_id: orderId,
      clientOrderId: orderId,
    },
    true
  );
  removeOpenOrdersById(queryClient, orderId);
  const index = pendingOrders.findIndex(
    (pending) => pending.orderId === orderId || pending.clientOrderId === orderId
  );
  if (index !== -1) pendingOrders.splice(index, 1);
}

/** Single entry point for the global WS listener. Deduplicates frame fan-out. */
export function applyOrderFrame(
  queryClient: QueryClient,
  raw: any
): OrderFrameResult | null {
  if (!raw || typeof raw !== "object") return null;
  const type = String(raw.type ?? "");
  if (!isOrderEventType(type)) return null;

  if (processedFrames.has(raw)) return null;
  processedFrames.add(raw);

  if (isCancelType(type)) {
    const data = extractFillData(raw);
    applyOrderCancelled(queryClient, raw);
    return {
      kind: "cancelled",
      orderId: str(data.order_id ?? data.orderId ?? data.id),
      clientOrderId: str(data.client_order_id ?? data.clientOrderId),
      symbol: str(data.symbol ?? data.pair),
      side: str(data.side),
      price: num(data.fill_price ?? data.price),
      status: str(data.status ?? data.state)?.toLowerCase(),
      terminal: true,
      market: extractMarket(raw),
    };
  }

  const outcome = applyOrderFilled(queryClient, raw);
  if (!outcome) return null;

  const { fill } = outcome;
  const status = str(fill.status ?? fill.state)?.toLowerCase();
  const terminal = outcome.terminal;
  const cancelledStatus =
    status !== undefined &&
    ["cancelled", "canceled", "rejected", "expired"].includes(status);

  return {
    kind: cancelledStatus ? "cancelled" : terminal ? "filled" : "updated",
    orderId: str(fill.order_id ?? fill.orderId ?? fill.id),
    clientOrderId: str(fill.client_order_id ?? fill.clientOrderId),
    symbol: str(fill.symbol ?? fill.pair),
    side: str(fill.side),
    price: num(fill.fill_price ?? fill.fillPrice ?? fill.price),
    status,
    terminal,
    market: outcome.market,
  };
}
