"use client";

import type { CSSProperties } from "react";
import { SnapshotFrame } from "@/src/components/snapshot/snapshot-frame";
import { SnapshotTokenIcon } from "@/src/components/snapshot/token-icon";
import { useSnapshotOptions } from "@/src/components/snapshot/share-sheet";
import { SNAPSHOT_COLORS } from "@/src/lib/snapshot/brand";
import { maskAmount } from "@/src/lib/snapshot/redact";
import type { P2PShareData } from "@/src/lib/p2p/share-data";

type P2POrderCardProps = {
  data: P2PShareData;
  timestamp: Date;
};

const UP = SNAPSHOT_COLORS.up;
const DOWN = SNAPSHOT_COLORS.down;
const MUTED = SNAPSHOT_COLORS.muted;

const NUMERIC = { fontVariantNumeric: "tabular-nums" } as const;

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: 32,
  rowGap: 24,
};

const LABEL = { fontSize: 20, color: MUTED } as const;
const VALUE = { fontSize: 26, fontWeight: 600, overflowWrap: "anywhere" } as const;

function statusColor(status: string) {
  const value = status.toUpperCase();
  if (["RELEASED", "COMPLETED", "FULFILLED", "PAID", "PARTIALLY_COMPLETED"].includes(value)) return UP;
  if (["CANCELLED", "CANCELED", "DISPUTED", "FAILED", "REJECTED"].includes(value)) return DOWN;
  return SNAPSHOT_COLORS.text;
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—";
}

function formatPrice(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
    : "—";
}

export function P2POrderCard({ data, timestamp }: P2POrderCardProps) {
  const { hideValues } = useSnapshotOptions();
  const total = hideValues ? maskAmount(data.total) : formatPrice(data.total);
  const amount = hideValues ? maskAmount(data.amount) : formatNumber(data.amount);
  const unitPrice = hideValues ? maskAmount(data.unitPrice) : formatPrice(data.unitPrice);
  const color = statusColor(data.status);

  return (
    <SnapshotFrame
      title="P2P Order"
      subtitle={`#${data.maskedOrderNumber.replace(/^#/, "")}`}
      timestamp={timestamp}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={LABEL}>Total</span>
          <span
            style={{
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1,
              ...NUMERIC,
            }}
          >
            {total} <span style={{ fontSize: 32, color: MUTED }}>{data.fiat}</span>
          </span>
          <span style={{ fontSize: 26, color: MUTED, ...NUMERIC }}>
            {amount} {data.asset}
          </span>
        </div>

        <div style={{ borderTop: `1px solid ${SNAPSHOT_COLORS.border}`, paddingTop: 24 }}>
          <div style={GRID}>
            <div>
              <div style={LABEL}>Asset</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <SnapshotTokenIcon symbol={data.asset} size={26} />
                <div style={VALUE}>{data.asset || "—"}</div>
              </div>
            </div>
            <div>
              <div style={LABEL}>Fiat Currency</div>
              <div style={VALUE}>{data.fiat || "—"}</div>
            </div>
            <div>
              <div style={LABEL}>Amount</div>
              <div style={{ ...VALUE, ...NUMERIC }}>{amount}</div>
            </div>
            <div>
              <div style={LABEL}>Unit Price</div>
              <div style={{ ...VALUE, ...NUMERIC }}>
                {unitPrice} <span style={{ color: MUTED }}>{data.fiat}</span>
              </div>
            </div>
            <div>
              <div style={LABEL}>Status</div>
              <div style={{ marginTop: 8 }}>
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
                  {data.status || "—"}
                </span>
              </div>
            </div>
            <div>
              <div style={LABEL}>Order No.</div>
              <div style={{ ...VALUE, fontFamily: "monospace" }}>{data.maskedOrderNumber}</div>
            </div>
            <div>
              <div style={LABEL}>Counterparty</div>
              <div style={VALUE}>{data.counterparty || "—"}</div>
            </div>
            <div>
              <div style={LABEL}>Time</div>
              <div style={{ ...VALUE, fontSize: 22 }}>
                {data.time.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SnapshotFrame>
  );
}
