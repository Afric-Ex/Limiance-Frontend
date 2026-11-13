"use client";

import type { CSSProperties } from "react";
import { SnapshotFrame } from "@/src/components/snapshot/snapshot-frame";
import { SnapshotTokenIcon, symbolFromPair } from "@/src/components/snapshot/token-icon";
import { useSnapshotOptions } from "@/src/components/snapshot/share-sheet";
import { fmtDate, fmtNum, getPair } from "@/src/components/orders/orders-shared";
import { SNAPSHOT_COLORS } from "@/src/lib/snapshot/brand";
import { maskAmount } from "@/src/lib/snapshot/redact";
import { formatStatus, isBuySide } from "@/src/lib/trades/order-rows";

type MarginOrdersCardProps = {
  rows: readonly any[];
  timestamp: Date;
  maskedUid?: string;
};

const UP = SNAPSHOT_COLORS.up;
const DOWN = SNAPSHOT_COLORS.down;
const MUTED = SNAPSHOT_COLORS.muted;

const NUMERIC = { fontVariantNumeric: "tabular-nums" } as const;

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.1fr 1.2fr 0.7fr 1fr 0.9fr 0.9fr 1fr",
  columnGap: 14,
  alignItems: "center",
};

function statusTone(status: string) {
  const value = status.toUpperCase();
  if (["FILLED", "COMPLETED", "FULFILLED", "SUCCESS"].includes(value)) return UP;
  if (["CANCELLED", "CANCELED", "REJECTED", "FAILED", "EXPIRED"].includes(value)) return DOWN;
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

export function MarginOrdersCard({ rows, timestamp, maskedUid }: MarginOrdersCardProps) {
  const { hideValues } = useSnapshotOptions();
  const visible = rows.slice(0, 10);

  return (
    <SnapshotFrame
      title="Margin Orders"
      subtitle={`Last ${visible.length} order${visible.length === 1 ? "" : "s"}`}
      timestamp={timestamp}
      maskedUid={maskedUid}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ ...GRID, paddingBottom: 16, fontSize: 20, color: MUTED }}>
          <span>Time</span>
          <span>Pair</span>
          <span>Side</span>
          <span>Price</span>
          <span>Filled</span>
          <span>Amount</span>
          <span>Status</span>
        </div>

        {visible.map((order, index) => {
          const side = String(order?.side ?? "").toUpperCase();
          const status = formatStatus(order?.orderStatus ?? order?.status);
          const amount = order?.amount ?? order?.quantity;

          return (
            <div
              key={String(order?.id ?? index)}
              style={{
                ...GRID,
                padding: "18px 0",
                borderTop: `1px solid ${SNAPSHOT_COLORS.border}`,
                fontSize: 24,
              }}
            >
              <span style={{ fontSize: 20, color: MUTED }}>{fmtDate(order?.createdAt)}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <SnapshotTokenIcon symbol={symbolFromPair(getPair(order))} size={24} />
                <span style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{getPair(order)}</span>
              </div>
              <span style={{ fontWeight: 700, color: isBuySide(side) ? UP : DOWN }}>{side || "—"}</span>
              <span style={NUMERIC}>{fmtNum(order?.price)}</span>
              <span style={NUMERIC}>
                {hideValues ? maskAmount(order?.filled) : fmtNum(order?.filled ?? 0)}
              </span>
              <span style={NUMERIC}>{hideValues ? maskAmount(amount) : fmtNum(amount)}</span>
              <span>
                <Pill label={status} color={statusTone(status)} />
              </span>
            </div>
          );
        })}
      </div>
    </SnapshotFrame>
  );
}
