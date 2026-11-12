"use client";

import { type ReactNode } from "react";
import { Loader } from "@mantine/core";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { MdContentCopy } from "react-icons/md";
import { successNotification } from "@/src/lib/notification-handler";
import { parseDate } from "@/src/lib/parse-date";
import type { HistoryMarket, MarketHistoryPage } from "@/src/hooks/use-order-history";

/* ─────────────────────────────────────────────────────────────────────────────
 * Order History tab.
 *
 * Reads what the existing order-history endpoints return. Fields those
 * endpoints don't send (average fill price, filled quantity, filled value) fall
 * back to the order's own numbers only when the order is FILLED, and otherwise
 * show "—" — never an invented figure.
 * ──────────────────────────────────────────────────────────────────────────── */

export type StatusFilter = "all" | "closed" | "FILLED" | "CANCELLED" | "REJECTED";
export const DATE_RANGES = [
  { days: 7, labelKey: "last7Days" },
  { days: 30, labelKey: "last30Days" },
  { days: 180, labelKey: "last180Days" },
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

  const MARKET_SET = new Set(["spot", "futures", "margin"]);
  const rawTypeCandidate = text(firstDefined(raw?.orderType, raw?.order_type, raw?.type)).toLowerCase();
  const rawType = MARKET_SET.has(rawTypeCandidate) ? "" : rawTypeCandidate;
  const type = rawType.replace(/^(buy|sell|long|short)_/, "") || (num(raw?.price) ? "limit" : "market");

  const rowMarket = (raw?.market_type || raw?.marketType || raw?.market || market) as HistoryMarket;

  const side = text(raw?.side).toLowerCase();
  const direction =
    side === "long" ? "long" : side === "short" ? "short" : side === "buy" ? "buy" : side === "sell" ? "sell" : text(raw?.side) || "—";

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
  const parsed = parseDate(timeRaw)?.getTime() ?? NaN;
  const id = text(firstDefined(raw?.id, raw?.orderId, raw?.order_id));

  const hasValue = (v: unknown) => v !== undefined && v !== null && v !== "" && Number(v) !== 0;

  return {
    key: `${rowMarket}-${id || index}`,
    id,
    market: rowMarket,
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
    if (f.status !== "all") {
      if (f.status === "closed") {
        if (!["FILLED", "CANCELLED", "CANCELED", "REJECTED", "EXPIRED", "CLOSED"].includes(row.status)) return false;
      } else if (row.status !== f.status) {
        return false;
      }
    }
    if (row.timeMs === null || row.timeMs < cutoff) return false;
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

const typeLabelKey = (type: string) => {
  if (!type) return null;
  if (type === "limit") return "limit";
  if (type === "market") return "market";
  if (type === "stop" || type === "stop_limit" || type === "stop_limit_order") return "stopLimit";
  if (type === "stop_market" || type === "stop_market_order") return "stopMarket";
  if (type === "tpsl") return "tpSl";
  return null;
};

const MARKET_LABEL_KEY: Record<HistoryMarket, string> = { spot: "spot", margin: "margin", futures: "futures" };

const STATUS_STYLE: Record<string, string> = {
  FILLED: "bg-[#25AB42]/15 text-[#25AB42]",
  CANCELLED: "bg-white/10 text-white/50",
  REJECTED: "bg-[#F6465D]/15 text-[#F6465D]",
  OPEN: "bg-primary/15 text-primary",
};

const shortId = (id: string) => (id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id || "—");

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-2 text-left text-2xs font-medium uppercase tracking-wide text-white/40">
      {children}
    </th>
  );
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  const t = useTranslations("Trading");
  const btn =
    "rounded bg-white/[0.06] px-2.5 py-1 text-micro font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-3 py-2">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t("previous")}
      </button>
      <span className="text-micro tabular-nums text-white/50">
        {t("pageOf", { page, totalPages })}
      </span>
      <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        {t("next")}
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
  mobile?: boolean;
}

export function OrderHistoryTable({ rows, loading, emptyState, page, totalPages, onPage, mobile = false }: OrderHistoryTableProps) {
  const t = useTranslations("Trading");
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
      successNotification(t("orderIdCopied"));
    } catch {
      /* clipboard unavailable — nothing to do */
    }
  };

  const typeText = (type: string) => {
    const key = typeLabelKey(type);
    return key ? t(key) : type.charAt(0).toUpperCase() + type.slice(1);
  };

  const directionText = (direction: string) => {
    if (direction === "buy") return t("buy");
    if (direction === "sell") return t("sell");
    if (direction === "long") return t("long");
    if (direction === "short") return t("short");
    return direction;
  };

  if (mobile) {
    return (
      <div className="flex flex-col min-h-0 flex-1">
        {rows.length === 0 ? emptyState : (
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {rows.map((row) => (
              <div key={row.key} className="px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{row.pair}</span>
                    <span className={clsx("text-xs font-bold", row.isBuy ? "text-[#25AB42]" : "text-[#F6465D]")}>{directionText(row.direction)}</span>
                    <span className="text-2xs bg-white/[0.06] px-1.5 py-0.5 rounded text-white/50">{typeText(row.type)}</span>
                  </div>
                  <span className={clsx("text-micro font-semibold px-2 py-0.5 rounded", STATUS_STYLE[row.status] ?? "bg-white/10 text-white/60")}>
                    {row.status ? row.status.charAt(0) + row.status.slice(1).toLowerCase().replace(/_/g, " ") : "—"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-white/40">{t("avgPrice")}</span><span className="text-white/90 font-mono">{fmtPrice(row.avgPrice)}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">{t("orderPrice")}</span><span className="text-white/90 font-mono">{row.price ? fmtPrice(row.price) : row.type.includes("market") ? t("market") : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">{t("filled")}</span><span className="text-white/90 font-mono">{fmt(row.filledQuantity)} {row.base}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">{t("total")}</span><span className="text-white/90 font-mono">{fmt(row.quantity)} {row.base}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">{t("value")}</span><span className="text-white/90 font-mono">{fmtMoney(row.filledValue)} {row.quote}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">{t("time")}</span><span className="text-white/70 font-mono">{row.timeMs !== null ? new Date(row.timeMs).toLocaleString() : "—"}</span></div>
                </div>
                {row.id && (
                  <button type="button" onClick={() => void copyId(row.id)} className="flex items-center gap-1 text-2xs text-white/30 self-start">
                    ID: {shortId(row.id)} <MdContentCopy size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {(totalPages > 1 || page > 1) && <Pagination page={page} totalPages={totalPages} onPage={onPage} />}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {rows.length === 0 ? (
        emptyState
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-xs">
            <thead className="sticky top-0 z-10 bg-[#181a20]">
              <tr className="border-b border-white/[0.06]">
                <Th>{t("market")}</Th>
                <Th>{t("instrument")}</Th>
                <Th>{t("orderType")}</Th>
                <Th>{t("direction")}</Th>
                <Th>{t("avgFilledPriceOrderPrice")}</Th>
                <Th>{t("filledOrderQuantity")}</Th>
                <Th>{t("orderTime")}</Th>
                <Th>{t("orderId")}</Th>
                <Th>{t("filledOrderValue")}</Th>
                <Th>{t("status")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 text-white/70">{t(MARKET_LABEL_KEY[row.market])}</td>
                  <td className="px-3 py-2.5 font-semibold text-white/90">{row.pair}</td>
                  <td className="px-3 py-2.5 text-white/70">{typeText(row.type)}</td>
                  <td className="px-3 py-2.5">
                    <span className={clsx("font-bold", row.isBuy ? "text-[#25AB42]" : "text-[#F6465D]")}>{directionText(row.direction)}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-white/90">
                    {fmtPrice(row.avgPrice)} <span className="text-white/30">/</span>{" "}
                    {row.price ? fmtPrice(row.price) : row.type.includes("market") ? t("market") : "—"}
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
                        title={t("idClickToCopy", { id: row.id })}
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
                    <span className={clsx("rounded px-2 py-0.5 text-micro font-semibold", STATUS_STYLE[row.status] ?? "bg-white/10 text-white/60")}>
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
