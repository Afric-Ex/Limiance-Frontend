"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PositionRow } from "@/src/components/trades/positions-table";
import { useFrozenValue } from "@/src/hooks/use-frozen-value";
import { useSnapshot } from "@/src/hooks/use-snapshot";
import { snapshotFilename } from "@/src/lib/snapshot/filename";
import { maskUid } from "@/src/lib/snapshot/redact";
import { useUserStore } from "@/src/stores/user-store";
import { PositionCard } from "./templates/position-card";
import { ShareButton } from "./share-button";
import { ShareSheet } from "./share-sheet";

type PositionShareProps = {
  row: PositionRow;
  className?: string;
};

export function PositionShare({ row, className }: PositionShareProps) {
  const t = useTranslations("Snapshot");
  const [opened, setOpened] = useState(false);
  const userId = useUserStore((state) => state.user?.id);
  const { nodeRef, isBusy, error, download, copy, share } = useSnapshot();
  const { value: frozenRow, frozenAt } = useFrozenValue(row, opened);

  const notReady =
    (row.market === "margin" && row.id === "") || (row.pnl === null && row.roe === null);

  const capturedAt = frozenAt ?? new Date();

  const handleSave = () => download(snapshotFilename([frozenRow.pair, "pnl"], capturedAt)).catch(() => undefined);
  const handleCopy = () => copy().catch(() => undefined);
  const handleShare = () => share(frozenRow.pair).catch(() => undefined);

  return (
    <>
      <ShareButton
        onClick={() => setOpened(true)}
        disabled={notReady}
        tooltip={t("notReady.position")}
        className={className}
      />
      <ShareSheet
        opened={opened}
        onClose={() => setOpened(false)}
        title={t("titles.position")}
        nodeRef={nodeRef}
        isBusy={isBusy}
        error={error}
        onSave={handleSave}
        onCopy={handleCopy}
        onShare={handleShare}
        capturedAt={frozenAt ?? undefined}
      >
        <PositionCard
          row={frozenRow}
          timestamp={capturedAt}
          maskedUid={userId ? maskUid(userId) : undefined}
        />
      </ShareSheet>
    </>
  );
}
