"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFrozenValue } from "@/src/hooks/use-frozen-value";
import { useSnapshot } from "@/src/hooks/use-snapshot";
import { snapshotFilename } from "@/src/lib/snapshot/filename";
import type { P2PShareData } from "@/src/lib/p2p/share-data";
import { P2POrderCard } from "./templates/p2p-order-card";
import { ShareButton } from "./share-button";
import { ShareSheet } from "./share-sheet";

type P2POrderShareProps = {
  data: P2PShareData;
  className?: string;
};

export function P2POrderShare({ data, className }: P2POrderShareProps) {
  const t = useTranslations("Snapshot");
  const [opened, setOpened] = useState(false);
  const { nodeRef, isBusy, error, download, copy, share } = useSnapshot();
  const { value: frozenData, frozenAt } = useFrozenValue(data, opened);

  const capturedAt = frozenAt ?? new Date();
  const ready = Boolean(data.asset && data.maskedOrderNumber.replace(/^#/, ""));

  const handleSave = () => download(snapshotFilename(["p2p-order"], capturedAt)).catch(() => undefined);
  const handleCopy = () => copy().catch(() => undefined);
  const handleShare = () => share(t("titles.p2pOrder")).catch(() => undefined);

  return (
    <>
      <ShareButton
        onClick={() => setOpened(true)}
        disabled={!ready}
        tooltip={t("notReady.p2pOrder")}
        className={className}
      />
      <ShareSheet
        opened={opened}
        onClose={() => setOpened(false)}
        title={t("titles.p2pOrder")}
        nodeRef={nodeRef}
        isBusy={isBusy}
        error={error}
        onSave={handleSave}
        onCopy={handleCopy}
        onShare={handleShare}
        capturedAt={frozenAt ?? undefined}
      >
        <P2POrderCard data={frozenData} timestamp={capturedAt} />
      </ShareSheet>
    </>
  );
}
