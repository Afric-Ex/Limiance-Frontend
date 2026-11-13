"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { OrderHistoryRow } from "@/src/components/trades/order-history-table";
import { useFrozenValue } from "@/src/hooks/use-frozen-value";
import { useSnapshot } from "@/src/hooks/use-snapshot";
import { snapshotFilename } from "@/src/lib/snapshot/filename";
import { maskUid } from "@/src/lib/snapshot/redact";
import { useUserStore } from "@/src/stores/user-store";
import { OrderHistoryCard } from "./templates/order-history-card";
import { ShareButton } from "./share-button";
import { ShareSheet } from "./share-sheet";

type OrderHistoryShareProps = {
  rows: readonly OrderHistoryRow[];
  className?: string;
};

export function OrderHistoryShare({ rows, className }: OrderHistoryShareProps) {
  const t = useTranslations("Snapshot");
  const [opened, setOpened] = useState(false);
  const userId = useUserStore((state) => state.user?.id);
  const { nodeRef, isBusy, error, download, copy, share } = useSnapshot();
  const { value: frozenRows, frozenAt } = useFrozenValue(rows, opened);

  const capturedAt = frozenAt ?? new Date();

  const handleSave = () => download(snapshotFilename(["order-history"], capturedAt)).catch(() => undefined);
  const handleCopy = () => copy().catch(() => undefined);
  const handleShare = () => share(t("titles.orderHistory")).catch(() => undefined);

  return (
    <>
      <ShareButton
        onClick={() => setOpened(true)}
        disabled={rows.length === 0}
        tooltip={t("notReady.orderHistory")}
        className={className}
      />
      <ShareSheet
        opened={opened}
        onClose={() => setOpened(false)}
        title={t("titles.orderHistory")}
        nodeRef={nodeRef}
        isBusy={isBusy}
        error={error}
        onSave={handleSave}
        onCopy={handleCopy}
        onShare={handleShare}
        capturedAt={frozenAt ?? undefined}
      >
        <OrderHistoryCard rows={[...frozenRows]} timestamp={capturedAt} maskedUid={userId ? maskUid(userId) : undefined} />
      </ShareSheet>
    </>
  );
}
