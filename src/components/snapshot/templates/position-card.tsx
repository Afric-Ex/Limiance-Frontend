"use client";

import type { ReactNode } from "react";
import type { PositionRow } from "@/src/components/trades/positions-table";
import { fmt, fmtMoney, fmtPrice } from "@/src/components/trades/positions-table";
import { SnapshotFrame } from "@/src/components/snapshot/snapshot-frame";
import { SnapshotTokenIcon, symbolFromPair } from "@/src/components/snapshot/token-icon";
import { useSnapshotOptions } from "@/src/components/snapshot/share-sheet";
import { maskAmount } from "@/src/lib/snapshot/redact";
import { SNAPSHOT_COLORS } from "@/src/lib/snapshot/brand";

type PositionCardProps = {
  row: PositionRow;
  timestamp: Date;
  maskedUid?: string;
  hideFooterMeta?: boolean;
};

const MUTED = SNAPSHOT_COLORS.muted;
const UP = SNAPSHOT_COLORS.up;
const DOWN = SNAPSHOT_COLORS.down;

const NUMERIC = { fontVariantNumeric: "tabular-nums" } as const;

function signOf(value: number) {
  return value >= 0 ? "+" : "-";
}

function signedPercent(value: number) {
  return `${signOf(value)}${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function toneOf(value: number | null) {
  if (value === null) return SNAPSHOT_COLORS.text;
  return value >= 0 ? UP : DOWN;
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 24, color: MUTED, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 600, overflowWrap: "anywhere", ...NUMERIC }}>{value}</div>
    </div>
  );
}

export function PositionCard({
  row,
  timestamp,
  maskedUid,
  hideFooterMeta,
}: PositionCardProps) {
  const { hideValues } = useSnapshotOptions();

  const isRoeHero = row.roe !== null;
  const heroText = isRoeHero
    ? signedPercent(row.roe as number)
    : row.pnl !== null
      ? `${signOf(row.pnl)}${hideValues ? maskAmount(row.pnl) : fmtMoney(Math.abs(row.pnl))} ${row.quote}`
      : "-";
  const heroColor = isRoeHero ? toneOf(row.roe) : toneOf(row.pnl);

  const pnlText =
    row.pnl === null
      ? "—"
      : `${signOf(row.pnl)}${hideValues ? maskAmount(row.pnl) : fmtMoney(Math.abs(row.pnl))} ${row.quote}`;

  const sizeText = hideValues ? `${maskAmount(row.size)} ${row.base}` : `${fmt(row.size)} ${row.base}`;
  const hasTriggers = row.takeProfit !== null || row.stopLoss !== null;
  const subtitle = `${row.market === "futures" ? "Futures" : "Margin"} · ${
    row.modeLabel ? `${row.modeLabel} · ` : ""
  }${row.leverage}x`;

  return (
    <SnapshotFrame
      title={row.pair}
      subtitle={subtitle}
      timestamp={timestamp}
      maskedUid={maskedUid}
      hideFooterMeta={hideFooterMeta}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <SnapshotTokenIcon symbol={symbolFromPair(row.pair)} size={40} />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 40,
              padding: "0 20px",
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 700,
              color: row.isLong ? UP : DOWN,
              border: `1px solid ${row.isLong ? UP : DOWN}`,
            }}
          >
            {row.isLong ? "Long" : "Short"}
          </span>
          <span style={{ fontSize: 24, fontWeight: 600, ...NUMERIC }}>{row.leverage}x</span>
          {row.modeLabel ? <span style={{ fontSize: 24, color: MUTED }}>{row.modeLabel}</span> : null}
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: 120,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-2px",
            color: heroColor,
            overflowWrap: "anywhere",
            ...NUMERIC,
          }}
        >
          {heroText}
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 40,
            fontWeight: 600,
            color: toneOf(row.pnl),
            overflowWrap: "anywhere",
            ...NUMERIC,
          }}
        >
          {pnlText}
        </div>

        <div
          style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 40,
            rowGap: 32,
          }}
        >
          <Stat label="Entry Price" value={fmtPrice(row.entryPrice)} />
          <Stat label="Mark Price" value={fmtPrice(row.markPrice)} />
          <Stat label="Size" value={sizeText} />
          {row.liqPrice !== null ? <Stat label="Liq. Price" value={fmtPrice(row.liqPrice)} /> : null}
        </div>

        {hasTriggers ? (
          <div
            style={{
              marginTop: 32,
              paddingTop: 32,
              borderTop: `1px solid ${SNAPSHOT_COLORS.border}`,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: 40,
            }}
          >
            <Stat label="Take Profit" value={fmtPrice(row.takeProfit)} />
            <Stat label="Stop Loss" value={fmtPrice(row.stopLoss)} />
          </div>
        ) : null}
      </div>
    </SnapshotFrame>
  );
}
