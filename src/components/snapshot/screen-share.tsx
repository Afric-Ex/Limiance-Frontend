"use client";

import { useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useSnapshot } from "@/src/hooks/use-snapshot";
import { snapshotFilename } from "@/src/lib/snapshot/filename";
import { GenericScreenCard } from "./templates/generic-screen-card";
import { ShareButton } from "./share-button";
import { ShareSheet } from "./share-sheet";

type ScreenShareProps = {
  titleKey: string;
  filenameParts: readonly string[];
  children: ReactNode;
  defaultHideValues?: boolean;
  className?: string;
  contentClassName?: string;
};

export function ScreenShare({
  titleKey,
  filenameParts,
  children,
  defaultHideValues = true,
  className,
  contentClassName,
}: ScreenShareProps) {
  const t = useTranslations("Snapshot");
  const [opened, setOpened] = useState(false);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const { nodeRef, isBusy, error, download, copy } = useSnapshot();
  const title = t(`titles.${titleKey}`);

  const open = () => {
    setCapturedAt(new Date());
    setOpened(true);
  };

  const timestamp = capturedAt ?? new Date();

  const handleSave = () => download(snapshotFilename(filenameParts, timestamp)).catch(() => undefined);
  const handleCopy = () => copy().catch(() => undefined);

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-end">
        <ShareButton onClick={open} tooltip={t("notReady.generic")} />
      </div>
      <div ref={sourceRef} className={contentClassName}>
        {children}
      </div>
      <ShareSheet
        opened={opened}
        onClose={() => setOpened(false)}
        title={title}
        nodeRef={nodeRef}
        isBusy={isBusy}
        error={error}
        onSave={handleSave}
        onCopy={handleCopy}
        defaultHideValues={defaultHideValues}
        capturedAt={capturedAt ?? undefined}
      >
        <GenericScreenCard
          sourceRef={sourceRef}
          title={title}
          timestamp={timestamp}
        />
      </ShareSheet>
    </div>
  );
}
