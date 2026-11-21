"use client";

import type { CSSProperties } from "react";
import { SnapshotFrame } from "@/src/components/snapshot/snapshot-frame";
import { useSnapshotOptions } from "@/src/components/snapshot/share-sheet";
import { SNAPSHOT_COLORS } from "@/src/lib/snapshot/brand";
import { maskAmount } from "@/src/lib/snapshot/redact";

export type TransactionShareData = {
  /** Already-localized transaction type label (e.g. "Deposit"). */
  typeLabel: string;
  /** Already-localized status label (e.g. "Completed"). */
  status: string;
  /** Formatted primary amount. */
  amount: string;
  /** Primary asset or fiat symbol. */
  symbol: string;
  direction: "in" | "out" | "neutral";
  createdAt: string;
  network: string;
  /** Masked reference/id — never the raw id. */
  reference: string;
  /** Formatted fee including symbol. */
  fee: string;
};

type TransactionCardProps = {
  data: TransactionShareData;
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
  if (["COMPLETED", "SUCCESS", "SUCCESSFUL", "CREDITED", "PAID", "APPROVED"].includes(value)) {
    return UP;
  }
  if (["FAILED", "REJECTED", "CANCELLED", "CANCELED"].includes(value)) return DOWN;
  return SNAPSHOT_COLORS.text;
}

function directionColor(direction: TransactionShareData["direction"]) {
  if (direction === "in") return UP;
  if (direction === "out") return DOWN;
  return SNAPSHOT_COLORS.text;
}

export function TransactionCard({ data, timestamp }: TransactionCardProps) {
  const { hideValues } = useSnapshotOptions();
  const amount = hideValues ? maskAmount(data.amount) : data.amount;
  const fee = hideValues ? maskAmount(data.fee) : data.fee;
  const amountColor = directionColor(data.direction);
  const color = statusColor(data.status);

  return (
    <SnapshotFrame title="Transaction" subtitle={data.typeLabel} timestamp={timestamp}>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={LABEL}>{data.typeLabel || "Transaction"}</span>
          <span
            style={{
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1,
              color: amountColor,
              ...NUMERIC,
            }}
          >
            {amount || "—"}{" "}
            {data.symbol ? <span style={{ fontSize: 32, color: MUTED }}>{data.symbol}</span> : null}
          </span>
        </div>

        <div style={{ borderTop: `1px solid ${SNAPSHOT_COLORS.border}`, paddingTop: 24 }}>
          <div style={GRID}>
            <div>
              <div style={LABEL}>Type</div>
              <div style={VALUE}>{data.typeLabel || "—"}</div>
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
              <div style={LABEL}>Amount</div>
              <div style={{ ...VALUE, ...NUMERIC }}>{amount || "—"}</div>
            </div>
            <div>
              <div style={LABEL}>Asset</div>
              <div style={VALUE}>{data.symbol || "—"}</div>
            </div>
            {data.fee ? (
              <div>
                <div style={LABEL}>Fee</div>
                <div style={{ ...VALUE, ...NUMERIC }}>{fee}</div>
              </div>
            ) : null}
            {data.network ? (
              <div>
                <div style={LABEL}>Network</div>
                <div style={{ ...VALUE, textTransform: "uppercase" }}>{data.network}</div>
              </div>
            ) : null}
            {data.reference ? (
              <div>
                <div style={LABEL}>Reference</div>
                <div style={{ ...VALUE, fontFamily: "monospace" }}>{data.reference}</div>
              </div>
            ) : null}
            {data.createdAt ? (
              <div>
                <div style={LABEL}>Time</div>
                <div style={{ ...VALUE, fontSize: 22 }}>{data.createdAt}</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </SnapshotFrame>
  );
}
