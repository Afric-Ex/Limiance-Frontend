"use client";

import type { CSSProperties } from "react";
import { SnapshotFrame } from "@/src/components/snapshot/snapshot-frame";
import { SnapshotTokenIcon, symbolFromPair } from "@/src/components/snapshot/token-icon";
import { useSnapshotOptions } from "@/src/components/snapshot/share-sheet";
import { SNAPSHOT_COLORS } from "@/src/lib/snapshot/brand";
import { maskAmount } from "@/src/lib/snapshot/redact";
import { formatStatus } from "@/src/lib/trades/order-rows";
import {
  fmt,
  fmtPrice,
  type OrderHistoryRow,
} from "@/src/components/trades/order-history-table";

type OrderHistoryCardProps = {
  rows: OrderHistoryRow[];
  timestamp: Date;
  maskedUid?: string;
};

const UP = SNAPSHOT_COLORS.up;
const DOWN = SNAPSHOT_COLORS.down;
const MUTED = SNAPSHOT_COLORS.muted;

const NUMERIC = { fontVariantNumeric: "tabular-nums" } as const;

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.35fr 0.7fr 1fr 1fr 0.7fr 1fr 1.05fr",
  columnGap: 14,
  alignItems: "center",
};

function statusTone(status: string) {
  const value = status.toUpperCase();
  if (value === "FILLED") return UP;
  if (value === "REJECTED" || value === "CANCELLED") return DOWN;
  return SNAPSHOT_COLORS.text;
}

function filledPercent(row: OrderHistoryRow) {
  if (!row.quantity || row.quantity <= 0) return null;
  if (row.filledQuantity === null) return null;
  return Math.min(100, (row.filledQuantity / row.quantity) * 100);
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 14px",
        borderRadius: 999,
        border: `1px solid ${color}`,
        color,
        fontSize: 20,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function OrderHistoryCard({ rows, timestamp, maskedUid }: OrderHistoryCardProps) {
  const { hideValues } = useSnapshotOptions();
  const visible = rows.slice(0, 10);

  return (
    <SnapshotFrame
      title="Order History"
      subtitle={`Last ${visible.length} order${visible.length === 1 ? "" : "s"}`}
      timestamp={timestamp}
      maskedUid={maskedUid}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ ...GRID, paddingBottom: 16, fontSize: 20, color: MUTED }}>
          <span>Pair</span>
          <span>Side</span>
          <span>Price</span>
          <span>Quantity</span>
          <span>Filled</span>
          <span>Status</span>
          <span>Time</span>
        </div>

        {visible.map((row) => {
          const percent = filledPercent(row);
          const side = row.isBuy ? (row.direction === "buy" ? "Buy" : "Long") : row.direction === "sell" ? "Sell" : "Short";

          return (
            <div
              key={row.key}
              style={{
                ...GRID,
                padding: "18px 0",
                borderTop: `1px solid ${SNAPSHOT_COLORS.border}`,
                fontSize: 24,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <SnapshotTokenIcon symbol={symbolFromPair(row.pair)} size={24} />
                <span style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{row.pair}</span>
              </div>
              <span style={{ fontWeight: 700, color: row.isBuy ? UP : DOWN }}>{side}</span>
              <span style={NUMERIC}>{fmtPrice(row.price)}</span>
              <span style={{ ...NUMERIC, overflowWrap: "anywhere" }}>
                {hideValues ? maskAmount(row.quantity) : fmt(row.quantity)}
                {row.base ? ` ${row.base}` : ""}
              </span>
              <span style={{ ...NUMERIC, color: MUTED }}>
                {percent === null ? "—" : `${percent.toFixed(0)}%`}
              </span>
              <span>
                <Pill label={formatStatus(row.status)} color={statusTone(row.status)} />
              </span>
              <span style={{ fontSize: 20, color: MUTED }}>
                {row.timeMs !== null ? new Date(row.timeMs).toLocaleString() : row.timeRaw || "—"}
              </span>
            </div>
          );
        })}
      </div>
    </SnapshotFrame>
  );
}
