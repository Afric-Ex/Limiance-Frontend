const cache = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

async function loadImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return null;

    const blob = await response.blob();
    if (blob.type && !blob.type.startsWith("image/")) return null;

    return await blobToDataUri(blob);
  } catch {
    return null;
  }
}

export function toDataUri(url: string): Promise<string | null> {
  if (!url) return Promise.resolve(null);

  const cached = cache.get(url);
  if (cached !== undefined || cache.has(url)) {
    return Promise.resolve(cached ?? null);
  }

  const inFlight = pending.get(url);
  if (inFlight) return inFlight;

  const task = loadImage(url).then((result) => {
    cache.set(url, result);
    pending.delete(url);
    return result;
  });

  pending.set(url, task);
  return task;
}
