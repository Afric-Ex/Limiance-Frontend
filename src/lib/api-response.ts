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
