import { SNAPSHOT_COLORS } from "./brand";

export type SnapshotReason =
  | "node-missing"
  | "capture-failed"
  | "empty-blob"
  | "image-load-failed"
  | "clipboard-unsupported"
  | "share-unsupported"
  | "share-failed";

export class SnapshotError extends Error {
  readonly reason: SnapshotReason;

  constructor(reason: SnapshotReason, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SnapshotError";
    this.reason = reason;
  }
}

export type CaptureOptions = {
  pixelRatio?: number;
  backgroundColor?: string;
  cacheBust?: boolean;
};

const MAX_PIXELS = 12_000_000;
const MIN_PIXEL_RATIO = 1;
const MAX_BLOB_BYTES = 1_000_000;
const IMAGE_TIMEOUT_MS = 5_000;

function isSafariOrIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iP(hone|ad|od)/.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|Android|FxiOS|EdgiOS/i.test(ua);
  return isIOS || isSafari;
}

function waitForImage(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    };
    const handleLoad = () => {
      cleanup();
      if (image.naturalWidth > 0) resolve();
      else reject(new SnapshotError("image-load-failed", "An image in the snapshot failed to load"));
    };
    const handleError = () => {
      cleanup();
      reject(new SnapshotError("image-load-failed", "An image in the snapshot failed to load"));
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new SnapshotError("image-load-failed", "An image in the snapshot took too long to load"));
    }, IMAGE_TIMEOUT_MS);

    image.addEventListener("load", handleLoad);
    image.addEventListener("error", handleError);
  });
}

async function ensureImagesReady(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll("img"));
  if (images.length === 0) return;
  await Promise.all(images.map(waitForImage));
}

function fitPixelRatio(node: HTMLElement, requested: number): number {
  let ratio = requested;
  const pixels = () => node.offsetWidth * node.offsetHeight * ratio * ratio;
  while (pixels() > MAX_PIXELS && ratio > MIN_PIXEL_RATIO) {
    ratio = Math.max(MIN_PIXEL_RATIO, ratio - 0.5);
  }
  return ratio;
}

export async function captureNodeToBlob(
  node: HTMLElement,
  options: CaptureOptions = {}
): Promise<Blob> {
  if (!node) {
    throw new SnapshotError("node-missing", "No node was provided to capture");
  }

  if (typeof document !== "undefined" && document.fonts) {
    await document.fonts.ready;
  }

  const { toBlob } = await import("html-to-image");
  await ensureImagesReady(node);

  const pixelRatio = fitPixelRatio(node, options.pixelRatio ?? 2);
  const captureOptions = (ratio: number) => ({
    pixelRatio: ratio,
    cacheBust: options.cacheBust ?? true,
    backgroundColor: options.backgroundColor ?? SNAPSHOT_COLORS.card,
  });
  const capture = async (ratio: number): Promise<Blob> => {
    const blob = await toBlob(node, captureOptions(ratio));
    if (!blob) {
      throw new SnapshotError("empty-blob", "The snapshot produced an empty image");
    }
    return blob;
  };

  try {
    // Safari needs a warm-up render; keep its result instead of capturing twice.
    let blob: Blob | null = null;
    if (isSafariOrIOS()) {
      blob = await capture(pixelRatio);
    }
    if (!blob) {
      blob = await capture(pixelRatio);
    }

    if (blob.size > MAX_BLOB_BYTES && pixelRatio > MIN_PIXEL_RATIO) {
      const reducedRatio = Math.max(MIN_PIXEL_RATIO, pixelRatio - 1);
      const smaller = await toBlob(node, captureOptions(reducedRatio));
      if (smaller && smaller.size > 0) {
        blob = smaller;
      }
    }

    return blob;
  } catch (cause) {
    if (cause instanceof SnapshotError) throw cause;
    throw new SnapshotError("capture-failed", "Unable to capture the snapshot", {
      cause,
    });
  }
}
