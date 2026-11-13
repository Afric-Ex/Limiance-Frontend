import wordmark from "@/public/limiance-wordmark.png";

export const SNAPSHOT_WIDTH = 1080;

export const SNAPSHOT_COLORS = {
  card: "#0b0e14",
  surface: "#12161f",
  border: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.5)",
  up: "#25AB42",
  down: "#F6465D",
} as const;

export const SNAPSHOT_TAGLINE = "Trade smarter on Limiance";

export const SNAPSHOT_DISCLAIMER =
  "Trading involves risk. Figures shown are for reference only.";

let cachedWordmark: string | null = null;
let pendingWordmark: Promise<string> | null = null;

const wordmarkSource =
  typeof wordmark === "string" ? wordmark : (wordmark as { src: string }).src;

async function toDataUri(source: string): Promise<string> {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to load wordmark: ${response.status}`);
  }
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read wordmark"));
    reader.readAsDataURL(blob);
  });
}

export async function getWordmarkDataUri(): Promise<string> {
  if (cachedWordmark) return cachedWordmark;
  if (!pendingWordmark) {
    pendingWordmark = toDataUri(wordmarkSource)
      .then((dataUri) => {
        cachedWordmark = dataUri;
        return dataUri;
      })
      .finally(() => {
        pendingWordmark = null;
      });
  }
  return pendingWordmark;
}
