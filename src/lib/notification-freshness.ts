export interface FreshnessNotification {
  id: string;
  createdAt?: number;
  read?: boolean;
}

export interface FreshnessState {
  seenIds: Set<string> | null;
  watermark: number;
}

export const EMPTY_FRESHNESS_STATE: FreshnessState = { seenIds: null, watermark: 0 };

export function selectFreshNotifications<T extends FreshnessNotification>(
  state: FreshnessState,
  notifications: T[],
  hasData: boolean
): { state: FreshnessState; fresh: T[] } {
  if (!hasData) return { state: EMPTY_FRESHNESS_STATE, fresh: [] };

  const currentIds = new Set(notifications.map((n) => n.id));
  const timestamps = notifications
    .map((n) => n.createdAt)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const watermark = timestamps.length
    ? Math.max(state.watermark, ...timestamps)
    : state.watermark;

  if (state.seenIds === null) {
    return { state: { seenIds: currentIds, watermark }, fresh: [] };
  }

  const fresh = notifications.filter(
    (n) => !state.seenIds!.has(n.id) && (n.createdAt ?? 0) > state.watermark
  );
  return { state: { seenIds: currentIds, watermark }, fresh };
}
