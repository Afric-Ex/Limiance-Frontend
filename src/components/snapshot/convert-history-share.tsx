"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFrozenValue } from "@/src/hooks/use-frozen-value";
import { useSnapshot } from "@/src/hooks/use-snapshot";
import { snapshotFilename } from "@/src/lib/snapshot/filename";
import { maskUid } from "@/src/lib/snapshot/redact";
import { useUserStore } from "@/src/stores/user-store";
import { ConvertHistoryCard } from "./templates/convert-history-card";
import { ShareButton } from "./share-button";
import { ShareSheet } from "./share-sheet";

type ConvertHistoryShareProps = {
  rows: readonly any[];
  className?: string;
};

export function ConvertHistoryShare({ rows, className }: ConvertHistoryShareProps) {
  const t = useTranslations("Snapshot");
  const [opened, setOpened] = useState(false);
  const userId = useUserStore((state) => state.user?.id);
  const { nodeRef, isBusy, error, download, copy, share } = useSnapshot();
  const { value: frozenRows, frozenAt } = useFrozenValue(rows, opened);

  const capturedAt = frozenAt ?? new Date();

  const handleSave = () => download(snapshotFilename(["convert-history"], capturedAt)).catch(() => undefined);
  const handleCopy = () => copy().catch(() => undefined);
  const handleShare = () => share(t("titles.convertHistory")).catch(() => undefined);

  return (
    <>
      <ShareButton
        onClick={() => setOpened(true)}
        disabled={rows.length === 0}
        tooltip={t("notReady.convertHistory")}
        className={className}
      />
      <ShareSheet
        opened={opened}
        onClose={() => setOpened(false)}
        title={t("titles.convertHistory")}
        nodeRef={nodeRef}
        isBusy={isBusy}
        error={error}
        onSave={handleSave}
        onCopy={handleCopy}
        onShare={handleShare}
        capturedAt={frozenAt ?? undefined}
      >
        <ConvertHistoryCard rows={[...frozenRows]} timestamp={capturedAt} maskedUid={userId ? maskUid(userId) : undefined} />
      </ShareSheet>
    </>
  );
}
