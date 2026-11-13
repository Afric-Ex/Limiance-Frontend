"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFrozenValue } from "@/src/hooks/use-frozen-value";
import { useSnapshot } from "@/src/hooks/use-snapshot";
import { snapshotFilename } from "@/src/lib/snapshot/filename";
import { maskUid } from "@/src/lib/snapshot/redact";
import { buildOpenOrderRows } from "@/src/lib/trades/order-rows";
import { useUserStore } from "@/src/stores/user-store";
import { OpenOrdersCard } from "./templates/open-orders-card";
import { ShareButton } from "./share-button";
import { ShareSheet } from "./share-sheet";

type OpenOrdersShareProps = {
  orders: readonly any[];
  className?: string;
};

export function OpenOrdersShare({ orders, className }: OpenOrdersShareProps) {
  const t = useTranslations("Snapshot");
  const [opened, setOpened] = useState(false);
  const userId = useUserStore((state) => state.user?.id);
  const { nodeRef, isBusy, error, download, copy, share } = useSnapshot();
  const { value: frozenOrders, frozenAt } = useFrozenValue(orders, opened);

  const rows = buildOpenOrderRows(frozenOrders);
  const capturedAt = frozenAt ?? new Date();

  const handleSave = () => download(snapshotFilename(["open-orders"], capturedAt)).catch(() => undefined);
  const handleCopy = () => copy().catch(() => undefined);
  const handleShare = () => share(t("titles.openOrders")).catch(() => undefined);

  return (
    <>
      <ShareButton
        onClick={() => setOpened(true)}
        disabled={orders.length === 0}
        tooltip={t("notReady.openOrders")}
        className={className}
      />
      <ShareSheet
        opened={opened}
        onClose={() => setOpened(false)}
        title={t("titles.openOrders")}
        nodeRef={nodeRef}
        isBusy={isBusy}
        error={error}
        onSave={handleSave}
        onCopy={handleCopy}
        onShare={handleShare}
        capturedAt={frozenAt ?? undefined}
      >
        <OpenOrdersCard rows={rows} timestamp={capturedAt} maskedUid={userId ? maskUid(userId) : undefined} />
      </ShareSheet>
    </>
  );
}
