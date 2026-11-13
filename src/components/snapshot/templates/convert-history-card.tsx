"use client";

import type { CSSProperties } from "react";
import { SnapshotFrame } from "@/src/components/snapshot/snapshot-frame";
import { SnapshotTokenIcon } from "@/src/components/snapshot/token-icon";
import { useSnapshotOptions } from "@/src/components/snapshot/share-sheet";
import { SNAPSHOT_COLORS } from "@/src/lib/snapshot/brand";
import { maskAmount } from "@/src/lib/snapshot/redact";
import { formatStatus } from "@/src/lib/trades/order-rows";

type ConvertHistoryCardProps = {
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
  gridTemplateColumns: "1.05fr 1fr 1.1fr 1.1fr 1fr 1fr",
  columnGap: 14,
  alignItems: "center",
};

function statusTone(status: string) {
  const value = status.toUpperCase();
  if (["FILLED", "COMPLETED", "SUCCESS", "SUCCESSFUL"].includes(value)) return UP;
  if (["FAILED", "REJECTED", "CANCELLED", "CANCELED"].includes(value)) return DOWN;
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

function formatTime(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ConvertHistoryCard({ rows, timestamp, maskedUid }: ConvertHistoryCardProps) {
  const { hideValues } = useSnapshotOptions();
  const visible = rows.slice(0, 10);

  return (
    <SnapshotFrame
      title="Convert History"
      subtitle={`Last ${visible.length} conversion${visible.length === 1 ? "" : "s"}`}
      timestamp={timestamp}
      maskedUid={maskedUid}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ ...GRID, paddingBottom: 16, fontSize: 20, color: MUTED }}>
          <span>Time</span>
          <span>Pair</span>
          <span>From</span>
          <span>To</span>
          <span>Price</span>
          <span>Status</span>
        </div>

        {visible.map((item, index) => {
          const status = formatStatus(item?.status);
          const rate = Number(item?.rate);
          const fromAmount = hideValues ? maskAmount(item?.fromAmount) : String(item?.fromAmount ?? "—");
          const toAmount = hideValues ? maskAmount(item?.toAmount) : String(item?.toAmount ?? "—");

          return (
            <div
              key={String(item?.id ?? index)}
              style={{
                ...GRID,
                padding: "18px 0",
                borderTop: `1px solid ${SNAPSHOT_COLORS.border}`,
                fontSize: 24,
              }}
            >
              <span style={{ fontSize: 20, color: MUTED }}>{formatTime(item?.createdAt)}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <SnapshotTokenIcon symbol={String(item?.from ?? "").toUpperCase()} size={24} />
                <span style={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                  {item?.from ?? "—"}/{item?.to ?? "—"}
                </span>
              </div>
              <span style={{ ...NUMERIC, color: DOWN }}>
                − {fromAmount} {item?.from ?? ""}
              </span>
              <span style={{ ...NUMERIC, color: UP }}>
                + {toAmount} {item?.to ?? ""}
              </span>
              <span style={NUMERIC}>{Number.isFinite(rate) ? rate.toLocaleString() : "—"}</span>
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
