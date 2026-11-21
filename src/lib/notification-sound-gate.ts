export interface ChimeGateInput {
  id?: string;
  signature: string;
  createdAt?: number;
  ownerId?: string | null;
}

export interface ChimeGateResult {
  allowed: boolean;
  reason: string;
}

interface GateState {
  ids: string[];
  signatures: Record<string, number>;
  watermark: number;
}

const STORAGE_PREFIX = "limiance-notification-chime-gate:";
const MAX_IDS = 500;
const SIGNATURE_WINDOW_MS = 10 * 60_000;
const WATERMARK_TOLERANCE_MS = 60_000;
const EMPTY_STATE: GateState = { ids: [], signatures: {}, watermark: 0 };

function storageKey(ownerId?: string | null) {
  return `${STORAGE_PREFIX}${ownerId ?? "anonymous"}`;
}

function readState(ownerId?: string | null): GateState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(storageKey(ownerId));
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    const ids = Array.isArray(parsed?.ids)
      ? parsed.ids.filter((value: unknown): value is string => typeof value === "string").slice(-MAX_IDS)
      : [];
    const signatures =
      parsed?.signatures && typeof parsed.signatures === "object" && !Array.isArray(parsed.signatures)
        ? (parsed.signatures as Record<string, number>)
        : {};
    const watermark =
      typeof parsed?.watermark === "number" && Number.isFinite(parsed.watermark) ? parsed.watermark : 0;
    return { ids, signatures, watermark };
  } catch {
    return EMPTY_STATE;
  }
}

function writeState(ownerId: string | null | undefined, state: GateState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(ownerId), JSON.stringify(state));
  } catch {
    return;
  }
}

export function shouldChimeNotification(input: ChimeGateInput): ChimeGateResult {
  if (typeof window === "undefined") return { allowed: false, reason: "no browser window" };

  const state = readState(input.ownerId);
  const now = Date.now();
  const idKey = input.id ? `id:${input.id}` : undefined;
  const signatureKey = `sig:${input.signature}`;
  const ids = new Set(state.ids);

  if (idKey && ids.has(idKey)) {
    return { allowed: false, reason: "already chimed for this notification id" };
  }
  if (
    typeof input.createdAt === "number" &&
    input.createdAt > 0 &&
    input.createdAt < state.watermark - WATERMARK_TOLERANCE_MS
  ) {
    return { allowed: false, reason: "older than last chimed notification" };
  }
  const lastSignature = state.signatures[signatureKey];
  if (typeof lastSignature === "number" && now - lastSignature < SIGNATURE_WINDOW_MS) {
    return { allowed: false, reason: "duplicate signature within 10 minutes" };
  }

  if (idKey) ids.add(idKey);
  const signatures: Record<string, number> = {};
  for (const [key, at] of Object.entries(state.signatures)) {
    if (typeof at === "number" && now - at < SIGNATURE_WINDOW_MS) signatures[key] = at;
  }
  signatures[signatureKey] = now;
  const watermark =
    typeof input.createdAt === "number" && input.createdAt > 0
      ? Math.max(state.watermark, input.createdAt)
      : state.watermark;

  writeState(input.ownerId, { ids: [...ids].slice(-MAX_IDS), signatures, watermark });
  return { allowed: true, reason: "new chime" };
}
