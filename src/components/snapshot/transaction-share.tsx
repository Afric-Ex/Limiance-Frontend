"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFrozenValue } from "@/src/hooks/use-frozen-value";
import { useSnapshot } from "@/src/hooks/use-snapshot";
import { snapshotFilename } from "@/src/lib/snapshot/filename";
import { TransactionCard, type TransactionShareData } from "./templates/transaction-card";
import { ShareButton } from "./share-button";
import { ShareSheet } from "./share-sheet";

type TransactionShareProps = {
  data: TransactionShareData;
  className?: string;
};

export function TransactionShare({ data, className }: TransactionShareProps) {
  const t = useTranslations("Snapshot");
  const [opened, setOpened] = useState(false);
  const { nodeRef, isBusy, error, download, copy, share } = useSnapshot();
  const { value: frozenData, frozenAt } = useFrozenValue(data, opened);

  const capturedAt = frozenAt ?? new Date();
  const ready = Boolean(data.amount);

  const handleSave = () => download(snapshotFilename(["transaction"], capturedAt)).catch(() => undefined);
  const handleCopy = () => copy().catch(() => undefined);
  const handleShare = () => share(t("titles.transaction")).catch(() => undefined);

  return (
    <>
      <ShareButton
        onClick={() => setOpened(true)}
        disabled={!ready}
        tooltip={t("notReady.transaction")}
        className={className}
      />
      <ShareSheet
        opened={opened}
        onClose={() => setOpened(false)}
        title={t("titles.transaction")}
        nodeRef={nodeRef}
        isBusy={isBusy}
        error={error}
        onSave={handleSave}
        onCopy={handleCopy}
        onShare={handleShare}
        capturedAt={frozenAt ?? undefined}
      >
        <TransactionCard data={frozenData} timestamp={capturedAt} />
      </ShareSheet>
    </>
  );
}
