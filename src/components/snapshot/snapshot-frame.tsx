"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { userKeys, userService } from "@/src/services/user";
import { useUserStore } from "@/src/stores/user-store";
import {
  getWordmarkDataUri,
  SNAPSHOT_COLORS,
  SNAPSHOT_DISCLAIMER,
  SNAPSHOT_TAGLINE,
  SNAPSHOT_WIDTH,
} from "@/src/lib/snapshot/brand";

type SnapshotFrameProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  timestamp: Date;
  maskedUid?: string;
  hideFooterMeta?: boolean;
};

const FONT_FAMILY = "var(--font-inter), sans-serif";

function parseUtcOffsetMinutes(value: string): number | null {
  const match = value.match(/(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?:\s*[:.,]\s*(\d{2}))?/i);
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

function formatTimestamp(date: Date, timezone: string | undefined, locale: string) {
  const base: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

  if (timezone) {
    try {
      return new Intl.DateTimeFormat(locale, { ...base, timeZone: timezone }).format(date);
    } catch {
      const offset = parseUtcOffsetMinutes(timezone);
      if (offset !== null) {
        const shifted = new Date(date.getTime() + offset * 60_000);
        return new Intl.DateTimeFormat(locale, { ...base, timeZone: "UTC" }).format(shifted);
      }
    }
  }

  return new Intl.DateTimeFormat(locale, base).format(date);
}

export function SnapshotFrame({
  title,
  subtitle,
  children,
  timestamp,
  maskedUid,
  hideFooterMeta,
}: SnapshotFrameProps) {
  const locale = useLocale();
  const user = useUserStore((state) => state.user);
  const [wordmark, setWordmark] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: userKeys.settings,
    queryFn: () => userService.getSettings(),
    select: (response: { data?: unknown } | unknown) => {
      const typed = response as { data?: unknown };
      return (typed.data ?? response) as { timezone?: string } | undefined;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    let active = true;
    getWordmarkDataUri()
      .then((uri) => {
        if (active) setWordmark(uri);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const dividerStyle = {
    borderTop: `1px solid ${SNAPSHOT_COLORS.border}`,
    margin: "32px 0",
  } as const;

  return (
    <div
      style={{
        width: SNAPSHOT_WIDTH,
        boxSizing: "border-box",
        padding: 56,
        background: SNAPSHOT_COLORS.card,
        borderRadius: 32,
        overflow: "hidden",
        position: "relative",
        color: SNAPSHOT_COLORS.text,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 40,
        }}
      >
        <div style={{ height: 48, display: "flex", alignItems: "center" }}>
          {wordmark ? (
            <img
              src={wordmark}
              alt=""
              style={{ height: 48, width: "auto", display: "block" }}
            />
          ) : null}
        </div>
        <div style={{ textAlign: "right", minWidth: 0 }}>
          <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.15, overflowWrap: "anywhere" }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 24, color: SNAPSHOT_COLORS.muted, marginTop: 8 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      <div style={dividerStyle} />

      <div style={{ position: "relative" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -96,
            display: "grid",
            gridTemplateColumns: "repeat(4, auto)",
            alignContent: "space-around",
            justifyContent: "space-around",
            transform: "rotate(-18deg)",
            opacity: 0.04,
            pointerEvents: "none",
          }}
        >
          {wordmark
            ? Array.from({ length: 12 }, (_, index) => (
                <img
                  key={index}
                  src={wordmark}
                  alt=""
                  style={{ height: 72, width: "auto", display: "block" }}
                />
              ))
            : null}
        </div>
        <div style={{ position: "relative" }}>{children}</div>
      </div>

      <div style={dividerStyle} />

      {!hideFooterMeta ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20 }}>
              {formatTimestamp(timestamp, settings?.timezone, locale)}
            </div>
            {maskedUid ? (
              <div style={{ fontSize: 20, color: SNAPSHOT_COLORS.muted, marginTop: 6 }}>
                {maskedUid}
              </div>
            ) : null}
          </div>
          <div style={{ fontSize: 20, color: SNAPSHOT_COLORS.muted, textAlign: "center" }}>
            {SNAPSHOT_TAGLINE}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 24, fontSize: 16, color: SNAPSHOT_COLORS.muted, lineHeight: 1.5 }}>
        {SNAPSHOT_DISCLAIMER}
      </div>
    </div>
  );
}
