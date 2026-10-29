"use client";

import { useState, type ReactNode } from "react";
import { Loader, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import clsx from "clsx";
import { MdEdit } from "react-icons/md";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";

/* ─────────────────────────────────────────────────────────────────────────────
 * Positions tab for the trading panel.
 *
 * Data comes from the two places the app already reads positions from:
 *   • futures — the `futures_positions` portfolio WebSocket topic (live)
 *   • margin  — GET trading/margin/positions
 * Columns that the backend does not return (e.g. Bybit's "Breakeven Price",
 * which needs fee data) are left out rather than filled with made-up values.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PositionRow {
  key: string;
  id: string;
  market: "futures" | "margin";
  pair: string;
  base: string;
  quote: string;
  isLong: boolean;
  size: number;
  entryPrice: number;
  markPrice: number | null;
  leverage: number;
  modeLabel: string;
  value: number;
  liqPrice: number | null;
  initialMargin: number | null;
  maintenanceMargin: number | null;
  pnl: number | null;
  roe: number | null;
  takeProfit: number | null;
  stopLoss: number | null;
}

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const positive = (value: unknown): number | null => {
  const n = num(value);
  return n !== null && n > 0 ? n : null;
};
const firstDefined = (...values: unknown[]) => values.find((v) => v !== undefined && v !== null && v !== "");

function splitPair(raw: any): { pair: string; base: string; quote: string } {
  const text = String(raw?.pair || raw?.symbol || "");
  if (text.includes("/")) {
    const [base, quote] = text.split("/");
    return { pair: text, base, quote };
  }
  const base = String(raw?.base ?? "");
  const quote = String(raw?.quote ?? "USDT");
  return { pair: base ? `${base}/${quote}` : text || "—", base: base || text, quote };
}

function toRow(raw: any, market: "futures" | "margin", index: number): PositionRow {
  const { pair, base, quote } = splitPair(raw);
  const isLong = /^(long|buy)$/i.test(String(raw?.side ?? ""));
  const size = num(firstDefined(raw?.quantity, raw?.size)) ?? 0;
  const entryPrice = num(firstDefined(raw?.entryPrice, raw?.entry_price, raw?.price, raw?.entry)) ?? 0;
  const markPrice = positive(firstDefined(raw?.markPrice, raw?.mark_price));
  const leverage = num(raw?.leverage) ?? 1;
  const priceForValue = markPrice ?? entryPrice;

  const initialMargin =
    num(firstDefined(raw?.initialMargin, raw?.initial_margin, raw?.margin, raw?.marginUsed, raw?.margin_used)) ??
    (leverage > 0 && size && entryPrice ? (size * entryPrice) / leverage : null);

  const reportedPnl = num(raw?.unrealizedPnl);
  const pnl =
    reportedPnl ??
    (markPrice !== null && size
      ? isLong
        ? size * (markPrice - entryPrice)
        : size * (entryPrice - markPrice)
      : null);
  const roe =
    pnl !== null && initialMargin && initialMargin > 0 ? (pnl / initialMargin) * 100 : num(raw?.unrealizedPnlPct);

  const mode = String(raw?.marginMode ?? "").toLowerCase();
  const id = String(firstDefined(raw?.id, raw?._id, raw?.position_id) ?? "");

  return {
    key: id ? `${market}-${id}` : `${market}-${pair}-${raw?.side}-${size}-${entryPrice}-${index}`,
    id,
    market,
    pair,
    base,
    quote,
    isLong,
    size,
    entryPrice,
    markPrice,
    leverage,
    modeLabel: mode === "isolated" ? "Isolated" : mode === "cross" ? "Cross" : "",
    value: size * priceForValue,
    liqPrice: positive(firstDefined(raw?.liquidationPrice, raw?.liquidation_price)),
    initialMargin,
    maintenanceMargin: num(firstDefined(raw?.maintenanceMargin, raw?.maintenance_margin)),
    pnl,
    roe,
    takeProfit: positive(firstDefined(raw?.takeProfitPrice, raw?.take_profit_price, raw?.takeProfit, raw?.take_profit)),
    stopLoss: positive(firstDefined(raw?.stopLossPrice, raw?.stop_loss_price, raw?.stopLoss, raw?.stop_loss)),
  };
}

/** Futures + margin positions as one list, in a stable order (so rows don't jump on live updates). */
export function buildPositionRows(futures: unknown, margin: unknown): PositionRow[] {
  const rows = [
    ...(Array.isArray(futures) ? futures : []).map((p, i) => toRow(p, "futures", i)),
    ...(Array.isArray(margin) ? margin : []).map((p, i) => toRow(p, "margin", i)),
  ];
  return rows.sort(
    (a, b) =>
      a.pair.localeCompare(b.pair) ||
      Number(b.isLong) - Number(a.isLong) ||
      a.key.localeCompare(b.key)
  );
}

const fmt = (value: number | null, maxDigits = 8, minDigits = 0) =>
  value === null
    ? "—"
    : value.toLocaleString(undefined, { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits });
const fmtPrice = (value: number | null) => fmt(value, 8, 2);
const fmtMoney = (value: number | null) => fmt(value, 2, 2);

// Same look the futures page uses for its position modals.
const MODAL_STYLES = {
  content: { backgroundColor: "#13151c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" },
  header: { backgroundColor: "transparent", padding: "16px 20px" },
  body: { padding: "0 20px 20px" },
};

function PartialCloseForm({ row, onSubmit }: { row: PositionRow; onSubmit: (quantity: string) => void }) {
  const [quantity, setQuantity] = useState("");
  const amount = Number(quantity);
  const valid = quantity !== "" && Number.isFinite(amount) && amount > 0 && amount <= row.size;
  return (
    <div className="flex min-w-[300px] flex-col gap-3">
      <p className="text-xs text-white/60">
        Position size: <span className="font-semibold text-white">{fmt(row.size)} {row.base}</span>
      </p>
      <TextInput
        label="Close quantity"
        placeholder={`Max ${fmt(row.size)}`}
        value={quantity}
        onChange={(e) => setQuantity(e.currentTarget.value)}
        error={quantity !== "" && !valid ? `Enter a quantity up to ${fmt(row.size)}` : undefined}
      />
      <button
        type="button"
        disabled={!valid}
        onClick={() => onSubmit(quantity)}
        className="mt-1 h-10 w-full rounded bg-primary text-sm font-semibold text-white transition-opacity disabled:opacity-40"
      >
        Confirm partial close
      </button>
    </div>
  );
}

function TpslForm({
  row,
  onSubmit,
}: {
  row: PositionRow;
  onSubmit: (takeProfit: string, stopLoss: string) => void;
}) {
  const [takeProfit, setTakeProfit] = useState(row.takeProfit !== null ? String(row.takeProfit) : "");
  const [stopLoss, setStopLoss] = useState(row.stopLoss !== null ? String(row.stopLoss) : "");
  const isPrice = (v: string) => v === "" || (Number.isFinite(Number(v)) && Number(v) > 0);
  const valid = isPrice(takeProfit) && isPrice(stopLoss);
  return (
    <div className="flex min-w-[300px] flex-col gap-3">
      <TextInput
        label="Take profit price"
        placeholder="Enter target price"
        value={takeProfit}
        onChange={(e) => setTakeProfit(e.currentTarget.value)}
        error={!isPrice(takeProfit) ? "Enter a valid price" : undefined}
      />
      <TextInput
        label="Stop loss price"
        placeholder="Enter trigger price"
        value={stopLoss}
        onChange={(e) => setStopLoss(e.currentTarget.value)}
        error={!isPrice(stopLoss) ? "Enter a valid price" : undefined}
      />
      <button
        type="button"
        disabled={!valid}
        onClick={() => onSubmit(takeProfit.trim(), stopLoss.trim())}
        className="mt-1 h-10 w-full rounded bg-primary text-sm font-semibold text-white transition-opacity disabled:opacity-40"
      >
        Confirm update
      </button>
    </div>
  );
}

function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={clsx(
        "whitespace-nowrap px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-white/40",
        align === "right" ? "text-right" : "text-left"
      )}
    >
      {children}
    </th>
  );
}

interface PositionsTableProps {
  rows: PositionRow[];
  loading: boolean;
  emptyState: ReactNode;
  closingIds: ReadonlySet<string>;
  onClose: (positionId: string) => void;
  onPartialClose: (positionId: string, quantity: string) => void;
  onUpdateTpsl: (positionId: string, takeProfit: string, stopLoss: string) => void;
  mobile?: boolean;
}

export function PositionsTable({
  rows,
  loading,
  emptyState,
  closingIds,
  onClose,
  onPartialClose,
  onUpdateTpsl,
  mobile = false,
}: PositionsTableProps) {
  if (loading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="sm" color="gray" />
      </div>
    );
  }
  if (rows.length === 0) return <>{emptyState}</>;

  const confirmClose = (row: PositionRow) =>
    modals.openConfirmModal({
      ...DEFAULT_MODAL_SETTINGS,
      size: "sm",
      styles: MODAL_STYLES,
      title: <span className="text-base font-bold text-white">Close position</span>,
      children: (
        <p className="text-sm text-white/70">
          Close your {row.isLong ? "long" : "short"} {fmt(row.size)} {row.base} position on {row.pair} at the market
          price?
        </p>
      ),
      labels: { confirm: "Close at market", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => onClose(row.id),
    });

  const openPartialClose = (row: PositionRow) =>
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      size: "sm",
      styles: MODAL_STYLES,
      title: <span className="text-base font-bold text-white">Partial close · {row.pair}</span>,
      children: <PartialCloseForm row={row} onSubmit={(quantity) => onPartialClose(row.id, quantity)} />,
    });

  const openTpsl = (row: PositionRow) =>
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      size: "sm",
      styles: MODAL_STYLES,
      title: <span className="text-base font-bold text-white">TP/SL · {row.pair}</span>,
      children: <TpslForm row={row} onSubmit={(tp, sl) => onUpdateTpsl(row.id, tp, sl)} />,
    });

  if (mobile) {
    return (
      <div className="flex flex-col divide-y divide-white/[0.04]">
        {rows.map((row) => {
          const pnlTone = (row.pnl ?? 0) >= 0 ? "text-[#25AB42]" : "text-[#F6465D]";
          const sign = (row.pnl ?? 0) >= 0 ? "+" : "";
          const closing = closingIds.has(row.id);
          const canManage = row.market === "futures" && row.id !== "";
          return (
            <div key={row.key} className="px-4 py-3 flex flex-col gap-2.5">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={clsx("h-full w-0.5 rounded-full self-stretch min-h-[20px]", row.isLong ? "bg-[#25AB42]" : "bg-[#F6465D]")} />
                  <div>
                    <span className="font-bold text-sm text-white">{row.pair}</span>
                    <span className={clsx("ml-2 text-xs font-semibold", row.isLong ? "text-[#25AB42]" : "text-[#F6465D]")}>{row.isLong ? "Long" : "Short"}</span>
                    <span className="ml-1 text-[10px] text-white/40">{row.leverage}x</span>
                  </div>
                </div>
                {row.pnl !== null && (
                  <div className={clsx("text-right font-semibold text-sm", pnlTone)}>
                    <div>{sign}{fmtMoney(row.pnl)} {row.quote}</div>
                    <div className="text-[10px]">{row.roe === null ? "" : `${sign}${row.roe.toFixed(2)}%`}</div>
                  </div>
                )}
              </div>
              {/* Data grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-white/40">Size</span><span className="text-white/90 font-mono">{fmt(row.size)} {row.base}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Value</span><span className="text-white/90 font-mono">{fmtMoney(row.value)} {row.quote}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Entry</span><span className="text-white/90 font-mono">{fmtPrice(row.entryPrice)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Mark</span><span className="text-white/90 font-mono">{fmtPrice(row.markPrice)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Liq.</span><span className="text-white/90 font-mono">{fmtPrice(row.liqPrice)}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40">TP/SL</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#25AB42] text-xs">{row.takeProfit !== null ? fmtPrice(row.takeProfit) : "—"}</span>
                    <span className="text-white/30">/</span>
                    <span className="text-[#F6465D] text-xs">{row.stopLoss !== null ? fmtPrice(row.stopLoss) : "—"}</span>
                    {canManage && <button onClick={() => openTpsl(row)} className="text-white/30 ml-1"><MdEdit size={12} /></button>}
                  </div>
                </div>
              </div>
              {/* Actions */}
              {canManage && (
                <div className="flex gap-2 pt-1">
                  <button disabled={closing} onClick={() => confirmClose(row)} className="flex-1 py-1.5 rounded-lg bg-[#F6465D]/10 text-[#F6465D] text-xs font-semibold active:opacity-70 disabled:opacity-50">
                    {closing ? "Closing…" : "Market Close"}
                  </button>
                  <button disabled={closing} onClick={() => openPartialClose(row)} className="flex-1 py-1.5 rounded-lg bg-white/[0.06] text-white/80 text-xs font-semibold active:opacity-70 disabled:opacity-50">
                    Partial Close
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-xs">
        <thead className="sticky top-0 z-10 bg-[#181a20]">
          <tr className="border-b border-white/[0.06]">
            <Th>Contracts</Th>
            <Th>Qty</Th>
            <Th>Value</Th>
            <Th>Entry Price</Th>
            <Th>Mark Price</Th>
            <Th>Liq. Price</Th>
            <Th>IM</Th>
            <Th>MM</Th>
            <Th>Unrealized P&amp;L (ROE%)</Th>
            <Th>TP/SL</Th>
            <Th align="right">Close By</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const tone = row.isLong ? "text-[#25AB42]" : "text-[#F6465D]";
            const pnlTone = (row.pnl ?? 0) >= 0 ? "text-[#25AB42]" : "text-[#F6465D]";
            const sign = (row.pnl ?? 0) >= 0 ? "+" : "";
            const closing = closingIds.has(row.id);
            const canManage = row.market === "futures" && row.id !== "";
            const subtitle = [row.market === "futures" ? "Futures" : "Margin", row.modeLabel, `${row.leverage}x`]
              .filter(Boolean)
              .join(" · ");
            return (
              <tr key={row.key} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={clsx("h-7 w-1 shrink-0 rounded-full", row.isLong ? "bg-[#25AB42]" : "bg-[#F6465D]")} />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white/90">{row.pair}</span>
                      <span className="text-[10px] text-white/40">{subtitle}</span>
                    </div>
                  </div>
                </td>
                <td className={clsx("px-3 py-2.5 font-mono font-semibold", tone)}>
                  {row.isLong ? "" : "-"}
                  {fmt(row.size)} <span className="text-white/40">{row.base}</span>
                </td>
                <td className="px-3 py-2.5 font-mono text-white/90">
                  {fmtMoney(row.value)} <span className="text-white/40">{row.quote}</span>
                </td>
                <td className="px-3 py-2.5 font-mono text-white/90">{fmtPrice(row.entryPrice)}</td>
                <td className="px-3 py-2.5 font-mono text-white/90">{fmtPrice(row.markPrice)}</td>
                <td className="px-3 py-2.5 font-mono text-white/90">{fmtPrice(row.liqPrice)}</td>
                <td className="px-3 py-2.5 font-mono text-white/90">{fmtMoney(row.initialMargin)}</td>
                <td className="px-3 py-2.5 font-mono text-white/90">{fmtMoney(row.maintenanceMargin)}</td>
                <td className="px-3 py-2.5 font-mono">
                  {row.pnl === null ? (
                    <span className="text-white/40">—</span>
                  ) : (
                    <div className={clsx("flex flex-col gap-0.5 font-semibold", pnlTone)}>
                      <span>
                        {sign}
                        {fmtMoney(row.pnl)} {row.quote}
                      </span>
                      <span className="text-[10px]">
                        {row.roe === null ? "—" : `${sign}${row.roe.toFixed(2)}%`}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <span className="text-[#25AB42]">{row.takeProfit !== null ? fmtPrice(row.takeProfit) : "—"}</span>
                      <span className="text-[#F6465D]">{row.stopLoss !== null ? fmtPrice(row.stopLoss) : "—"}</span>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openTpsl(row)}
                        aria-label={`Edit TP/SL for ${row.pair}`}
                        title="Edit TP/SL"
                        className="text-white/40 transition-colors hover:text-white"
                      >
                        <MdEdit size={14} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  {canManage ? (
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={closing}
                        onClick={() => confirmClose(row)}
                        className="rounded bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                      >
                        {closing ? "Closing…" : "Market"}
                      </button>
                      <button
                        type="button"
                        disabled={closing}
                        onClick={() => openPartialClose(row)}
                        className="rounded bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                      >
                        Partial
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-white/30" title="Margin positions can't be closed from here yet">
                      —
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
