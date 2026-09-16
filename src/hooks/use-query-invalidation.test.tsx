import React from "react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import { useQueryInvalidation } from "./use-query-invalidation";

function createWrapper(client: QueryClient) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "Wrapper";
  return Wrapper;
}

describe("useQueryInvalidation", () => {
  it("invalidates a flat array of string keys as a single query key", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockImplementation(() => Promise.resolve());

    const { result } = renderHook(() => useQueryInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.invalidateQueries(["orders", "pending"]);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      queryKey: ["orders", "pending"],
      exact: undefined,
      refetchType: undefined,
    });
  });

  it("invalidates a single-element string array as one query key", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockImplementation(() => Promise.resolve());

    const { result } = renderHook(() => useQueryInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.invalidateQueries(["portfolio"]);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      queryKey: ["portfolio"],
      exact: undefined,
      refetchType: undefined,
    });
  });

  it("handles an empty array as a single flat invalidation", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockImplementation(() => Promise.resolve());

    const { result } = renderHook(() => useQueryInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.invalidateQueries([]);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      queryKey: [],
      exact: undefined,
      refetchType: undefined,
    });
  });

  it("splits nested key arrays into one invalidateQueries call per key", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockImplementation(() => Promise.resolve());

    const { result } = renderHook(() => useQueryInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.invalidateQueries([
        ["user", "1"],
        ["chats", "c-9"],
      ]);
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, {
      queryKey: ["user", "1"],
      exact: undefined,
      refetchType: undefined,
    });
    expect(spy).toHaveBeenNthCalledWith(2, {
      queryKey: ["chats", "c-9"],
      exact: undefined,
      refetchType: undefined,
    });
  });

  it("forwards exact and refetchType options to every invalidation", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockImplementation(() => Promise.resolve());

    const { result } = renderHook(() => useQueryInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.invalidateQueries(
        [
          ["a", "1"],
          ["b", "2"],
        ],
        { exact: true, refetchType: "inactive" }
      );
    });

    expect(spy).toHaveBeenNthCalledWith(1, {
      queryKey: ["a", "1"],
      exact: true,
      refetchType: "inactive",
    });
    expect(spy).toHaveBeenNthCalledWith(2, {
      queryKey: ["b", "2"],
      exact: true,
      refetchType: "inactive",
    });
  });

  it("forwards options when invalidation happens in parallel", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockImplementation(() => Promise.resolve());

    const { result } = renderHook(() => useQueryInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.invalidateQueries(
        [["d"]],
        { exact: false, refetchType: "all" }
      );
    });

    expect(spy).toHaveBeenCalledWith({
      queryKey: ["d"],
      exact: false,
      refetchType: "all",
    });
  });

  it("uses the active queries for refetching when no refetchType is supplied", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockImplementation(() => Promise.resolve());

    const { result } = renderHook(() => useQueryInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.invalidateQueries(["spot"]);
    });

    const arg = spy.mock.calls[0][0] as { refetchType?: string };
    expect(arg.refetchType).toBeUndefined();
  });
});