"use client";

import { useMemo, useRef } from "react";
import {
  useInfiniteQuery,
  type QueryKey,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { readList, readNumber } from "@/src/lib/api-response";

/** Default identity for de-duplicating rows across page boundaries. */
const defaultItemId = (item: unknown): string | number | undefined =>
  (item as { id?: string | number } | null)?.id;

export interface UseInfiniteListOptions<
  TItem,
  TFilters extends Record<string, unknown> = Record<string, never>,
> {
  /** Filters only — never include the page. React-query owns the page param. */
  queryKey: QueryKey;
  limit: number;
  /** Non-page params merged into every request. */
  filters?: TFilters;
  fetchPage: (
    params: TFilters & { page: number; limit: number }
  ) => Promise<unknown>;
  getItemId?: (item: TItem) => string | number | undefined;
  enabled?: boolean;
}

export interface UseInfiniteListResult<TItem> {
  items: TItem[];
  /** First page in flight — the caller shows skeleton rows for this. */
  isPending: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  /** Pages fetched so far; the trigger uses this to auto-fill short viewports. */
  loadedCount: number;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  fetchNextPage: () => void;
}

const STALE_TIME_MS = 30_000;

/**
 * Paginated fetch loop shared by every "load more" list in the app.
 *
 * Wraps `useInfiniteQuery` with the conventions the backend actually uses:
 * items live behind a `data` envelope, and the total count arrives as
 * `totalRecords` as a *string*. The stopping rules are deliberately layered —
 * an explicit total is authoritative, an empty page is treated as the end, and
 * a short page only ends the loop when no total was supplied (a backend that
 * caps `limit` below what we asked for would otherwise truncate the list).
 *
 * The global QueryClient defaults (`staleTime: 0`, `gcTime` 5 min) are wrong for
 * this shape: a refetch replays every loaded page, and evicting early pages
 * would silently drop rows the user has already scrolled past. So both are
 * pinned per-query here rather than changed app-wide.
 */
/**
 * Note the single type parameter: it's the *filters* shape. The item type can't
 * be inferred — items only exist once a response has been parsed — so callers
 * annotate rows where they render them, matching the `(item: any)` convention
 * the existing list pages already use.
 */
export function useInfiniteList<
  TFilters extends Record<string, unknown> = Record<string, never>,
>({
  queryKey,
  limit,
  filters,
  fetchPage,
  getItemId,
  enabled = true,
}: UseInfiniteListOptions<any, TFilters>): UseInfiniteListResult<any> {
  // Held in a ref so an inline `getItemId` arrow doesn't invalidate the
  // flattened-items memo on every render.
  const getItemIdRef = useRef(getItemId ?? defaultItemId);
  getItemIdRef.current = getItemId ?? defaultItemId;

  const query = useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: 1,
    staleTime: STALE_TIME_MS,
    gcTime: Infinity,
    queryFn: ({ pageParam }) =>
      fetchPage({ ...(filters ?? ({} as TFilters)), page: pageParam, limit }),
    getNextPageParam: (lastPage, allPages) => {
      const pageItems = readList(lastPage);
      // Definitive end-of-data, and the guard against a malformed body (a
      // swallowed 502, for instance) looping forever.
      if (pageItems.length === 0) return undefined;

      const total = readNumber(lastPage, "totalRecords");
      if (total !== null) {
        return allPages.length * limit >= total ? undefined : allPages.length + 1;
      }

      // No total to go on: a short page is the only remaining hint.
      return pageItems.length < limit ? undefined : allPages.length + 1;
    },
  }) as UseInfiniteQueryResult<
    { pages: unknown[]; pageParams: number[] },
    Error
  >;

  const { data } = query;

  const items = useMemo(() => {
    if (!data?.pages) return [] as any[];
    const seen = new Set<string>();
    const flattened: any[] = [];

    for (const page of data.pages) {
      for (const item of readList(page)) {
        // Rows can shift between requests as new activity lands, so the same
        // record can arrive on two pages. Without this, React logs duplicate
        // keys and the user sees a row twice.
        const id = getItemIdRef.current(item);
        if (id !== undefined && id !== null) {
          const key = String(id);
          if (seen.has(key)) continue;
          seen.add(key);
        }
        flattened.push(item);
      }
    }

    return flattened;
  }, [data]);

  return {
    items,
    isPending: query.isPending,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    loadedCount: data?.pages?.length ?? 0,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
    fetchNextPage: () => {
      void query.fetchNextPage();
    },
  };
}
