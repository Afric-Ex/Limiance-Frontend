type PlainObject = Record<string, unknown>;

/**
 * Some endpoints answer with a `data` envelope, others bare. Object-shaped
 * payloads (fees, minimums) must not go through the list-only "guarantee array"
 * coercion used for array endpoints: it swapped them for `[]`, so every
 * property read on them silently became undefined. Descends the envelope and
 * returns the first object it finds.
 */
export function unwrapObject<T = PlainObject>(res: unknown): T | null {
  let current: unknown = res;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return null;
    const record = current as PlainObject;
    if (record.data !== undefined && record.data !== null) {
      current = record.data;
      continue;
    }
    return record as T;
  }
  return null;
}

/** Numeric field read that distinguishes "absent" from a real zero. */
export function readNumber(source: unknown, key: string): number | null {
  if (!source || typeof source !== "object") return null;
  const value = (source as PlainObject)[key];
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Pull the item array out of a paginated response *without* discarding the
 * envelope, so sibling fields like `totalRecords` stay reachable.
 *
 * Two shapes are in play: most services unwrap the Axios response and hand back
 * the backend envelope directly (list at `res.data`), while the p2p services
 * return the whole AxiosResponse, putting the same list at `res.data.data`.
 *
 * Anything unrecognised becomes `[]` rather than a partial guess. That matters
 * for `getNextPageParam`: `asset.transactionHistory` deliberately swallows 502s
 * and returns the error body as if it were a success, and a non-empty-but-
 * unrecognised body must not read as "another full page of results".
 */
export function readList<T = unknown>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (!res || typeof res !== "object") return [];
  const record = res as PlainObject;
  if (Array.isArray(record.data)) return record.data as T[];
  const nested = (record.data as PlainObject | null | undefined)?.data;
  if (Array.isArray(nested)) return nested as T[];
  return [];
}
