"use client";

import type { CSSProperties } from "react";
import { SnapshotFrame } from "@/src/components/snapshot/snapshot-frame";
import { SnapshotTokenIcon, symbolFromPair } from "@/src/components/snapshot/token-icon";
import { useSnapshotOptions } from "@/src/components/snapshot/share-sheet";
import { SNAPSHOT_COLORS } from "@/src/lib/snapshot/brand";
import { maskAmount } from "@/src/lib/snapshot/redact";
import { formatOrderNumber, type OpenOrderRow } from "@/src/lib/trades/order-rows";

type OpenOrdersCardProps = {
  rows: OpenOrderRow[];
  timestamp: Date;
  maskedUid?: string;
};

const UP = SNAPSHOT_COLORS.up;
const DOWN = SNAPSHOT_COLORS.down;
const MUTED = SNAPSHOT_COLORS.muted;

const NUMERIC = { fontVariantNumeric: "tabular-nums" } as const;

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.7fr 0.8fr 1.15fr 1fr 0.8fr 1fr",
  columnGap: 16,
  alignItems: "center",
};

function statusTone(status: string) {
  const value = status.toUpperCase();
  if (value === "FILLED") return UP;
  if (value === "REJECTED" || value === "CANCELLED") return DOWN;
  return SNAPSHOT_COLORS.text;
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

export function OpenOrdersCard({ rows, timestamp, maskedUid }: OpenOrdersCardProps) {
  const { hideValues } = useSnapshotOptions();
  const visible = rows.slice(0, 10);
  const hidden = Math.max(0, rows.length - visible.length);

  return (
    <SnapshotFrame
      title="Open Orders"
      subtitle={`Top 10 · ${rows.length} open`}
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
        </div>

        {visible.map((row) => (
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
            <span style={{ fontWeight: 700, color: row.isBuy ? UP : DOWN }}>{row.side || "—"}</span>
            <span style={NUMERIC}>{formatOrderNumber(row.price)}</span>
            <span style={{ ...NUMERIC, overflowWrap: "anywhere" }}>
              {hideValues ? maskAmount(row.quantity) : formatOrderNumber(row.quantity)}
              {row.base ? ` ${row.base}` : ""}
            </span>
            <span style={{ ...NUMERIC, color: MUTED }}>
              {row.filledPercent === null ? "—" : `${row.filledPercent.toFixed(0)}%`}
            </span>
            <span>
              <Pill label={row.status} color={statusTone(row.status)} />
            </span>
          </div>
        ))}

        {hidden > 0 ? (
          <div
            style={{
              borderTop: `1px solid ${SNAPSHOT_COLORS.border}`,
              paddingTop: 16,
              fontSize: 20,
              color: MUTED,
            }}
          >
            +{hidden} more
          </div>
        ) : null}
      </div>
    </SnapshotFrame>
  );
}
