import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useInfiniteList } from "./use-infinite-list";

(globalThis as any).React = React;

const LIMIT = 3;

/** Builds a backend envelope exactly as the API returns it: counts as strings. */
const page = (rows: { id: number }[], totalRecords: number | string) => ({
  data: rows,
  currentPage: "1",
  totalPages: "9",
  totalRecords: String(totalRecords),
});

const rows = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: from + i }));

const rowsNamed = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: from + i, tag: `r${from + i}` }));

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });

/** Resolves page N of an infinite total, so the loop runs to completion. */
const paginatedSource = (total: number) =>
  vi.fn(async ({ page: pageParam }: { page: number; limit: number }) => {
    const start = (pageParam - 1) * LIMIT;
    const slice = rowsNamed(start + 1, Math.max(0, Math.min(LIMIT, total - start)));
    return page(slice, total);
  });

describe("useInfiniteList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps loading until the whole set is retrieved", async () => {
    const client = makeClient();
    const fetchPage = paginatedSource(7);

    const { result } = renderHook(
      () => useInfiniteList({ queryKey: ["t", 7], limit: LIMIT, fetchPage }),
      { wrapper: wrapper(client) }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(3));
    expect(result.current.hasNextPage).toBe(true);

    // Drive the loop the way the scroll trigger does.
    for (let i = 0; i < 10 && result.current.hasNextPage; i += 1) {
      await act(async () => {
        result.current.fetchNextPage();
      });
    }

    await waitFor(() => expect(result.current.items).toHaveLength(7));
    expect(result.current.hasNextPage).toBe(false);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(result.current.loadedCount).toBe(3);
  });

  it("requests each page exactly once, with the limit passed through", async () => {
    const client = makeClient();
    const fetchPage = paginatedSource(4);

    const { result } = renderHook(
      () => useInfiniteList({ queryKey: ["t", 4], limit: LIMIT, fetchPage }),
      { wrapper: wrapper(client) }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(3));
    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.items).toHaveLength(4));

    expect(result.current.hasNextPage).toBe(false);
    // One request per page — a second call would be a duplicate load.
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage.mock.calls.map(([p]) => p)).toEqual([
      { page: 1, limit: LIMIT },
      { page: 2, limit: LIMIT },
    ]);
  });

  it("stops on an exact multiple of the limit without a trailing empty request", async () => {
    const client = makeClient();
    const fetchPage = paginatedSource(6);

    const { result } = renderHook(
      () => useInfiniteList({ queryKey: ["t", 6], limit: LIMIT, fetchPage }),
      { wrapper: wrapper(client) }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(3));
    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.items).toHaveLength(6));

    expect(result.current.hasNextPage).toBe(false);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("stops on an empty page when the backend supplies no total", async () => {
    const client = makeClient();
    // No totalRecords at all — only the empty page can end the loop. Rows are
    // distinct per page so de-duplication doesn't mask the count.
    const fetchPage = vi.fn(async ({ page: pageParam }: { page: number }) => ({
      data: pageParam <= 2 ? rows((pageParam - 1) * LIMIT + 1, LIMIT) : [],
    }));

    const { result } = renderHook(
      () => useInfiniteList({ queryKey: ["t", "no-total"], limit: LIMIT, fetchPage }),
      { wrapper: wrapper(client) }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(3));

    // Two full pages look like "there may be more" with no total to consult,
    // so only the empty third page can end the loop.
    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.items).toHaveLength(6));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));

    expect(result.current.items).toHaveLength(6);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it("does not loop forever on a swallowed 502 body", async () => {
    const client = makeClient();
    // asset.transactionHistory returns the error body as a "success".
    const fetchPage = vi.fn(async ({ page: pageParam }: { page: number }) =>
      pageParam === 1
        ? page(rowsNamed(1, LIMIT), 99)
        : { statusCode: 502, error: "Bad Gateway" }
    );

    const { result } = renderHook(
      () => useInfiniteList({ queryKey: ["t", "502"], limit: LIMIT, fetchPage }),
      { wrapper: wrapper(client) }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(3));
    await act(async () => {
      result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(result.current.items).toHaveLength(3);
  });

  it("deduplicates rows that shift across page boundaries", async () => {
    const client = makeClient();
    // Row 3 lands on both pages, as it would if a new deposit shifted the
    // window between the two requests.
    const fetchPage = vi.fn(async ({ page: pageParam }: { page: number }) =>
      page(pageParam === 1 ? rows(1, 3) : rows(3, 3), 6)
    );

    const { result } = renderHook(
      () => useInfiniteList({ queryKey: ["t", "dupe"], limit: LIMIT, fetchPage }),
      { wrapper: wrapper(client) }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(3));
    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.loadedCount).toBe(2));

    const ids = result.current.items.map((i: any) => i.id);
    expect(ids).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("passes filters to every page request without leaking them into the key", async () => {
    const client = makeClient();
    const fetchPage = vi.fn(async (_params: { page: number; limit: number; type: string }) =>
      page(rowsNamed(1, Math.min(LIMIT, 2)), 2)
    );

    const { result } = renderHook(
      () =>
        useInfiniteList({
          queryKey: ["t", { type: "deposit" }],
          limit: LIMIT,
          filters: { type: "deposit" },
          fetchPage,
        }),
      { wrapper: wrapper(client) }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(fetchPage).toHaveBeenCalledWith({ type: "deposit", page: 1, limit: LIMIT });
  });

  it("surfaces a page failure as an error with no extra requests", async () => {
    const client = makeClient();
    const fetchPage = vi.fn(async ({ page: pageParam }: { page: number }) => {
      if (pageParam === 1) return page(rowsNamed(1, LIMIT), 99);
      throw new Error("network down");
    });

    const { result } = renderHook(
      () => useInfiniteList({ queryKey: ["t", "fail"], limit: LIMIT, fetchPage }),
      { wrapper: wrapper(client) }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(3));
    await act(async () => {
      result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // retry is disabled, so a failed page must not loop.
    expect(fetchPage).toHaveBeenCalledTimes(2);
    // Rows already on screen survive the failure.
    expect(result.current.items).toHaveLength(3);
  });

  it("handles a single-page result set", async () => {
    const client = makeClient();
    const fetchPage = vi.fn(async () => page(rowsNamed(1, 2), 2));

    const { result } = renderHook(
      () => useInfiniteList({ queryKey: ["t", "one"], limit: LIMIT, fetchPage }),
      { wrapper: wrapper(client) }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
