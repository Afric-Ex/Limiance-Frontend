"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Drawer, Loader, Modal, Switch } from "@mantine/core";
import { useElementSize, useMediaQuery, useMergedRef } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";
import { SNAPSHOT_COLORS, SNAPSHOT_WIDTH } from "@/src/lib/snapshot/brand";

type SnapshotOptionsValue = {
  hideValues: boolean;
};

const SnapshotOptionsContext = createContext<SnapshotOptionsValue>({
  hideValues: false,
});

export function useSnapshotOptions() {
  return useContext(SnapshotOptionsContext);
}

type ShareSheetProps = {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  nodeRef: RefObject<HTMLDivElement | null>;
  isBusy: boolean;
  error: Error | null;
  onSave: () => Promise<void>;
  onCopy: () => Promise<void>;
  onShare?: () => Promise<void>;
  onRetry?: () => void;
  defaultHideValues?: boolean;
  capturedAt?: Date;
  onHideValuesChange?: (hideValues: boolean) => void;
};

const sheetStyles = {
  content: {
    background: SNAPSHOT_COLORS.surface,
    border: `1px solid ${SNAPSHOT_COLORS.border}`,
    color: SNAPSHOT_COLORS.text,
  },
  header: {
    background: SNAPSHOT_COLORS.surface,
    color: SNAPSHOT_COLORS.text,
  },
  body: {
    background: SNAPSHOT_COLORS.surface,
    paddingBottom: 24,
  },
} as const;

export function ShareSheet({
  opened,
  onClose,
  title,
  children,
  nodeRef,
  isBusy,
  error,
  onSave,
  onCopy,
  onShare,
  onRetry,
  defaultHideValues = false,
  capturedAt,
  onHideValuesChange,
}: ShareSheetProps) {
  const t = useTranslations("Snapshot");
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { ref: previewRef, width: previewWidth } = useElementSize();
  const { ref: cardMeasureRef, height: cardHeight } = useElementSize();
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const lastActionRef = useRef<(() => Promise<void>) | null>(null);
  const [hideValues, setHideValues] = useState(defaultHideValues);
  const [openedAt, setOpenedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!opened) return;
    setHideValues(defaultHideValues);
    setOpenedAt(new Date());
  }, [opened, defaultHideValues]);

  const handleHideValuesChange = (next: boolean) => {
    setHideValues(next);
    onHideValuesChange?.(next);
  };

  const captureTime = capturedAt ?? openedAt;
  const captureLabel = captureTime
    ? t("snapshotTakenAt", {
        time: new Intl.DateTimeFormat(undefined, { timeStyle: "medium" }).format(captureTime),
      })
    : null;

  const errorKey = (error as { reason?: string } | null)?.reason;
  const errorMessage =
    error && errorKey && t.has(`errors.${errorKey}`) ? t(`errors.${errorKey}`) : error?.message ?? null;

  const invoke = (action?: () => Promise<void>) => {
    if (!action) return;
    lastActionRef.current = action;
    void action();
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    const action = lastActionRef.current;
    if (action) void action();
  };

  const retryAvailable = Boolean(onRetry || lastActionRef.current);

  useEffect(() => {
    if (!opened) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [opened]);

  const setCardNode = useMergedRef(nodeRef, cardMeasureRef);

  const scale =
    previewWidth > 0 ? Math.min(1, previewWidth / SNAPSHOT_WIDTH) : 1;

  const body = (
    <SnapshotOptionsContext.Provider value={{ hideValues }}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
            {captureLabel}
          </div>
          <Switch
            size="sm"
            checked={hideValues}
            onChange={(event) => handleHideValuesChange(event.currentTarget.checked)}
            label={t("hideValues")}
            aria-label={t("hideValuesAria")}
            styles={{ label: { color: "rgba(255,255,255,0.7)", fontSize: 12 } }}
          />
        </div>
        {error ? (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center justify-between gap-3 rounded-xl border border-sell/40 bg-sell/10 px-3 py-2 text-xs text-sell"
          >
            <span className="min-w-0 break-words">{errorMessage}</span>
            {retryAvailable ? (
              <Button variant="ghost" size="small" onClick={handleRetry} disabled={isBusy}>
                {t("retry")}
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center gap-2" aria-busy={isBusy}>
          <Button
            variant="primary"
            size="compact"
            className="flex-1"
            onClick={() => invoke(onSave)}
            disabled={isBusy}
            aria-label={t("saveAria")}
          >
            {isBusy ? <Loader size={14} color="#fff" /> : t("save")}
          </Button>
          <Button
            variant="outline"
            size="compact"
            className="flex-1"
            onClick={() => invoke(onCopy)}
            disabled={isBusy}
            aria-label={t("copyAria")}
          >
            {t("copy")}
          </Button>
          {onShare ? (
            <Button
              variant="secondary"
              size="compact"
              className="flex-1"
              onClick={() => invoke(onShare)}
              disabled={isBusy}
              aria-label={t("shareAria")}
            >
              {t("share")}
            </Button>
          ) : null}
          {isBusy ? <span className="sr-only" role="status">{t("working")}</span> : null}
          </div>

        <div ref={previewRef} className="w-full">
          <div
            style={{
              width: SNAPSHOT_WIDTH * scale,
              height: cardHeight * scale,
              overflow: "hidden",
              borderRadius: 32 * scale,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                width: SNAPSHOT_WIDTH,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <div ref={setCardNode}>{children}</div>
            </div>
          </div>
        </div>
        </div>
    </SnapshotOptionsContext.Provider>
  );

  if (isMobile) {
    return (
      <Drawer
        opened={opened}
        onClose={onClose}
        position="bottom"
        size="auto"
        title={title}
        withinPortal
        closeOnEscape
        styles={sheetStyles}
        radius="16px 16px 0 0"
      >
        {body}
      </Drawer>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="auto"
      title={title}
      withinPortal
      closeOnEscape
      styles={sheetStyles}
      radius="xl"
    >
      {body}
    </Modal>
  );
}
