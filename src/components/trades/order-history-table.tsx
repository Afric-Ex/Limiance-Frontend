"use client";

import { type ReactNode } from "react";
import { Loader } from "@mantine/core";
import clsx from "clsx";
import { MdContentCopy } from "react-icons/md";
import { successNotification } from "@/src/lib/notification-handler";
import type { HistoryMarket, MarketHistoryPage } from "@/src/hooks/use-order-history";

/* ─────────────────────────────────────────────────────────────────────────────
 * Order History tab.
 *
 * Reads what the existing order-history endpoints return. Fields those
 * endpoints don't send (average fill price, filled quantity, filled value) fall
 * back to the order's own numbers only when the order is FILLED, and otherwise
 * show "—" — never an invented figure.
 * ──────────────────────────────────────────────────────────────────────────── */

export type StatusFilter = "all" | "FILLED" | "CANCELLED" | "REJECTED";
export const DATE_RANGES = [
  { days: 7, label: "Last 7D" },
  { days: 30, label: "Last 30D" },
  { days: 180, label: "Last 180D" },
] as const;

export interface OrderHistoryRow {
  key: string;
  id: string;
  market: HistoryMarket;
  pair: string;
  base: string;
  quote: string;
  type: string;
  direction: string;
  isBuy: boolean;
  status: string;
  price: number | null;
  avgPrice: number | null;
  quantity: number | null;
  filledQuantity: number | null;
  orderValue: number | null;
  filledValue: number | null;
  hasTpsl: boolean;
  timeMs: number | null;
  timeRaw: string;
}

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const firstDefined = (...values: unknown[]) => values.find((v) => v !== undefined && v !== null && v !== "");
const text = (value: unknown) => (value === undefined || value === null ? "" : String(value));

const normalizeStatus = (value: unknown) => {
  const s = text(value).toUpperCase().replace(/[\s-]+/g, "_");
  return s === "CANCELED" ? "CANCELLED" : s;
};

function toRow(raw: any, market: HistoryMarket, index: number): OrderHistoryRow {
  const pairText = text(raw?.pair || raw?.symbol);
  const [slashBase, slashQuote] = pairText.includes("/") ? pairText.split("/") : ["", ""];
  const base = slashBase || text(raw?.base);
  const quote = slashQuote || text(raw?.quote) || "USDT";
  const pair = base ? `${base}/${quote}` : pairText || "—";

  const status = normalizeStatus(raw?.status);
  const filled = status === "FILLED";

  const rawType = text(firstDefined(raw?.type, raw?.orderType, raw?.order_type)).toLowerCase();
  const type = rawType.replace(/^(buy|sell|long|short)_/, "");

  const side = text(raw?.side).toLowerCase();
  const direction =
    side === "long" ? "Long" : side === "short" ? "Short" : side === "buy" ? "Buy" : side === "sell" ? "Sell" : text(raw?.side) || "—";

  const price = num(firstDefined(raw?.price, raw?.orderPrice, raw?.order_price));
  const quantity = num(firstDefined(raw?.quantity, raw?.amount, raw?.size, raw?.origQty));
  const avgPrice =
    num(firstDefined(raw?.avgPrice, raw?.avg_price, raw?.averagePrice, raw?.average_price, raw?.avgFillPrice, raw?.filledPrice)) ??
    (filled ? price : null);
  const filledQuantity =
    num(firstDefined(raw?.filledQuantity, raw?.filled_quantity, raw?.executedQty, raw?.executedQuantity, raw?.filled)) ??
    (filled ? quantity : null);
  const orderValue =
    num(firstDefined(raw?.total, raw?.orderValue, raw?.order_value, raw?.value)) ??
    (price && quantity ? price * quantity : null);
  const filledValue =
    num(firstDefined(raw?.filledValue, raw?.filled_value, raw?.executedValue, raw?.cummulativeQuoteQty)) ??
    (avgPrice && filledQuantity ? avgPrice * filledQuantity : null);

  const timeRaw = text(firstDefined(raw?.createdAt, raw?.created_at, raw?.timestamp, raw?.time));
  const parsed = timeRaw ? new Date(/^\d+$/.test(timeRaw) ? Number(timeRaw) : timeRaw).getTime() : NaN;
  const id = text(firstDefined(raw?.id, raw?.orderId, raw?.order_id));

  const hasValue = (v: unknown) => v !== undefined && v !== null && v !== "" && Number(v) !== 0;

  return {
    key: `${market}-${id || index}`,
    id,
    market,
    pair,
    base,
    quote,
    type,
    direction,
    isBuy: side === "buy" || side === "long",
    status,
    price,
    avgPrice,
    quantity,
    filledQuantity,
    orderValue,
    filledValue,
    hasTpsl: [raw?.takeProfit, raw?.stopLoss, raw?.tp_trigger_price, raw?.sl_trigger_price, raw?.takeProfitPrice, raw?.stopLossPrice].some(hasValue),
    timeMs: Number.isFinite(parsed) ? parsed : null,
    timeRaw,
  };
}

/** Pages from one or more markets as one list, newest first. */
export function buildOrderHistoryRows(pages: readonly MarketHistoryPage[]): OrderHistoryRow[] {
  const rows = pages.flatMap((page) => page.rows.map((raw, i) => toRow(raw, page.market, i)));
  return rows.sort((a, b) => (b.timeMs ?? -Infinity) - (a.timeMs ?? -Infinity));
}

export interface OrderHistoryFilters {
  orderType: string;
  days: number;
  instrument: string;
  hideOtherPairs: boolean;
  selectedPair: string;
  status: StatusFilter;
}

const normalizePair = (value: string) => value.replace(/[/\\\-_\s]/g, "").toUpperCase();

export function filterOrderHistoryRows(rows: readonly OrderHistoryRow[], f: OrderHistoryFilters): OrderHistoryRow[] {
  const cutoff = Date.now() - f.days * 86_400_000;
  const current = normalizePair(f.selectedPair || "");
  return rows.filter((row) => {
    if (f.orderType === "limit_market" && !(row.type.includes("limit") || row.type.includes("market"))) return false;
    if (f.orderType === "tpsl" && !row.hasTpsl) return false;
    if (f.orderType === "oco" && !row.type.includes("oco")) return false;
    if (f.status !== "all" && row.status !== f.status) return false;
    if (row.timeMs !== null && row.timeMs < cutoff) return false;
    if (f.instrument !== "all" && !row.pair.includes(f.instrument)) return false;
    if (f.hideOtherPairs && current && normalizePair(row.pair) !== current) return false;
    return true;
  });
}

const fmt = (value: number | null, maxDigits = 8, minDigits = 0) =>
  value === null
    ? "—"
    : value.toLocaleString(undefined, { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits });
const fmtPrice = (value: number | null) => fmt(value, 8, 2);
const fmtMoney = (value: number | null) => fmt(value, 2, 2);

const typeLabel = (type: string) => {
  if (!type) return "—";
  if (type === "oco") return "OCO";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const MARKET_LABEL: Record<HistoryMarket, string> = { spot: "Spot", margin: "Margin", futures: "Futures" };

const STATUS_STYLE: Record<string, string> = {
  FILLED: "bg-[#25AB42]/15 text-[#25AB42]",
  CANCELLED: "bg-white/10 text-white/50",
  REJECTED: "bg-[#F6465D]/15 text-[#F6465D]",
  OPEN: "bg-primary/15 text-primary",
};

const shortId = (id: string) => (id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id || "—");

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-white/40">
      {children}
    </th>
  );
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  const btn =
    "rounded bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-3 py-2">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="text-[11px] tabular-nums text-white/50">
        Page {page} of {totalPages}
      </span>
      <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  );
}

interface OrderHistoryTableProps {
  rows: OrderHistoryRow[];
  loading: boolean;
  emptyState: ReactNode;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export function OrderHistoryTable({ rows, loading, emptyState, page, totalPages, onPage }: OrderHistoryTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="sm" color="gray" />
      </div>
    );
  }

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      successNotification("Order ID copied");
    } catch {
      /* clipboard unavailable — nothing to do */
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {rows.length === 0 ? (
        emptyState
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-xs">
            <thead className="sticky top-0 z-10 bg-[#181a20]">
              <tr className="border-b border-white/[0.06]">
                <Th>Market</Th>
                <Th>Instrument</Th>
                <Th>Order Type</Th>
                <Th>Direction</Th>
                <Th>Avg. Filled Price/Order Price</Th>
                <Th>Filled/Order Quantity</Th>
                <Th>Order Time</Th>
                <Th>Order ID</Th>
                <Th>Filled/Order Value</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 text-white/70">{MARKET_LABEL[row.market]}</td>
                  <td className="px-3 py-2.5 font-semibold text-white/90">{row.pair}</td>
                  <td className="px-3 py-2.5 text-white/70">{typeLabel(row.type)}</td>
                  <td className="px-3 py-2.5">
                    <span className={clsx("font-bold", row.isBuy ? "text-[#25AB42]" : "text-[#F6465D]")}>{row.direction}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-white/90">
                    {fmtPrice(row.avgPrice)} <span className="text-white/30">/</span>{" "}
                    {row.price ? fmtPrice(row.price) : row.type.includes("market") ? "Market" : "—"}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-white/90">
                    {fmt(row.filledQuantity)} <span className="text-white/30">/</span> {fmt(row.quantity)}{" "}
                    <span className="text-white/40">{row.base}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-white/70">
                    {row.timeMs !== null ? new Date(row.timeMs).toLocaleString() : row.timeRaw || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {row.id ? (
                      <button
                        type="button"
                        onClick={() => void copyId(row.id)}
                        title={`${row.id} (click to copy)`}
                        className="inline-flex items-center gap-1 font-mono text-white/70 transition-colors hover:text-white"
                      >
                        {shortId(row.id)}
                        <MdContentCopy size={12} className="text-white/30" />
                      </button>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-white/90">
                    {fmtMoney(row.filledValue)} <span className="text-white/30">/</span> {fmtMoney(row.orderValue)}{" "}
                    <span className="text-white/40">{row.quote}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={clsx("rounded px-2 py-0.5 text-[11px] font-semibold", STATUS_STYLE[row.status] ?? "bg-white/10 text-white/60")}>
                      {row.status ? row.status.charAt(0) + row.status.slice(1).toLowerCase().replace(/_/g, " ") : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(totalPages > 1 || page > 1) && <Pagination page={page} totalPages={totalPages} onPage={onPage} />}
    </div>
  );
}