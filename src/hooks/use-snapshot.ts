"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { captureNodeToBlob, SnapshotError } from "@/src/lib/snapshot/capture";
import { successNotification } from "@/src/lib/notification-handler";

const FILENAME_PREFIX = "limiance";

function defaultFilename() {
  return `${FILENAME_PREFIX}-${Date.now()}.png`;
}

export function useSnapshot() {
  const t = useTranslations("Snapshot");
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<SnapshotError | null>(null);

  const toBlob = useCallback(async (): Promise<Blob> => {
    const node = nodeRef.current;
    if (!node) {
      throw new SnapshotError("node-missing", "The snapshot node is not mounted");
    }
    return captureNodeToBlob(node);
  }, []);

  const run = useCallback(async <T,>(task: () => Promise<T>): Promise<T> => {
    setIsBusy(true);
    setError(null);
    try {
      return await task();
    } catch (cause) {
      const snapshotError =
        cause instanceof SnapshotError
          ? cause
          : new SnapshotError("capture-failed", "Something went wrong", { cause });
      setError(snapshotError);
      throw snapshotError;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const download = useCallback(
    async (filename: string = defaultFilename()) => {
      await run(async () => {
        const blob = await toBlob();
        const url = URL.createObjectURL(blob);
        try {
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
        } finally {
          URL.revokeObjectURL(url);
        }
        successNotification(t("imageSaved"));
      });
    },
    [run, toBlob, t]
  );

  const copy = useCallback(async () => {
    await run(async () => {
      if (
        typeof navigator === "undefined" ||
        !navigator.clipboard?.write ||
        typeof ClipboardItem === "undefined"
      ) {
        throw new SnapshotError(
          "clipboard-unsupported",
          "Copying images is not supported in this browser"
        );
      }
      const blob = await toBlob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      successNotification(t("imageCopied"));
    });
  }, [run, toBlob, t]);

  const share = useCallback(
    async (title?: string) => {
      await run(async () => {
        if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
          throw new SnapshotError(
            "share-unsupported",
            "Sharing is not supported in this browser. Use Save instead."
          );
        }

        const blob = await toBlob();
        const file = new File([blob], defaultFilename(), { type: "image/png" });

        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
          throw new SnapshotError(
            "share-unsupported",
            "Sharing images is not supported in this browser. Use Save instead."
          );
        }

        try {
          await navigator.share({ files: [file], title });
        } catch (cause) {
          if (cause instanceof DOMException && cause.name === "AbortError") {
            return;
          }
          throw new SnapshotError("share-failed", "Unable to share the image", {
            cause,
          });
        }
      });
    },
    [run, toBlob]
  );

  return { nodeRef, isBusy, error, toBlob, download, copy, share };
}
