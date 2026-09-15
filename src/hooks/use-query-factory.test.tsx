import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { query, mutate } from "./use-query-factory";
import * as errorHandler from "../lib/error-handler";

vi.mock("../lib/error-handler", () => ({
  errorMessageHandler: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("query factory", () => {
  it("returns a hook that fetches data successfully", async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({
      data: { name: "test" },
      status: 200,
    });
    const useTestQuery = query(
      () => ["test-key"],
      mockQueryFn,
    );

    const { result } = renderHook(() => useTestQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ name: "test" });
    expect(mockQueryFn).toHaveBeenCalled();
  });

  it("passes params to queryFn", async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({
      data: "result",
      status: 200,
    });
    const useTestQuery = query(
      (id: string) => ["test-key", id],
      mockQueryFn,
    );

    const { result } = renderHook(() => useTestQuery("123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockQueryFn).toHaveBeenCalledWith("123");
  });

  it("handles query error", async () => {
    const mockQueryFn = vi.fn().mockRejectedValue(new Error("Network error"));
    const useTestQuery = query(
      () => ["test-error"],
      mockQueryFn,
    );

    const { result } = renderHook(() => useTestQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Network error");
  });

  it("uses default select when none provided", async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({
      data: { nested: "value" },
      status: 200,
    });
    const useTestQuery = query(
      () => ["select-test"],
      mockQueryFn,
    );

    const { result } = renderHook(() => useTestQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ nested: "value" });
  });

  it("uses custom select function when provided", async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({
      data: { items: [1, 2, 3] },
      status: 200,
    });
    const useTestQuery = query(
      () => ["custom-select"],
      mockQueryFn,
      { select: (res) => res.data.items.length },
    );

    const { result } = renderHook(() => useTestQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(3);
  });

  it("passes staleTime config", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 60000 } },
    });

    function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    }

    const mockQueryFn = vi.fn().mockResolvedValue({ data: "cached", status: 200 });
    const useTestQuery = query(
      () => ["stale-test"],
      mockQueryFn,
      { staleTime: 60000 },
    );

    const { result } = renderHook(() => useTestQuery(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryClient.getQueryState(["stale-test"])?.dataUpdatedAt).toBeGreaterThan(0);
  });

  it("accepts multiple params", async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({ data: "multi", status: 200 });
    const useTestQuery = query(
      (a: string, b: number) => ["multi", a, b],
      mockQueryFn,
    );

    const { result } = renderHook(() => useTestQuery("hello", 42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockQueryFn).toHaveBeenCalledWith("hello", 42);
  });
});

describe("mutate factory", () => {
  it("returns a hook that can mutate data", async () => {
    const mockMutateFn = vi.fn().mockResolvedValue({
      data: { id: 1 },
      status: 200,
    });
    const useTestMutation = mutate(mockMutateFn);

    const { result } = renderHook(() => useTestMutation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ name: "test" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ id: 1 });
    expect(mockMutateFn).toHaveBeenCalledWith({ name: "test" });
  });

  it("calls default onSuccess callback", async () => {
    const onSuccessDefault = vi.fn();
    const mockMutateFn = vi.fn().mockResolvedValue({ data: "ok", status: 200 });
    const useTestMutation = mutate(mockMutateFn, { onSuccess: onSuccessDefault });

    const { result } = renderHook(() => useTestMutation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("var");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccessDefault).toHaveBeenCalledWith("ok", "var");
  });

  it("calls per-call onSuccess callback", async () => {
    const onSuccessDefault = vi.fn();
    const onSuccessCall = vi.fn();
    const mockMutateFn = vi.fn().mockResolvedValue({ data: "ok", status: 200 });
    const useTestMutation = mutate(mockMutateFn, { onSuccess: onSuccessDefault });

    const { result } = renderHook(() => useTestMutation({ onSuccess: onSuccessCall }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("v");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccessDefault).toHaveBeenCalledWith("ok", "v");
    expect(onSuccessCall).toHaveBeenCalledWith("ok", "v");
  });

  it("calls errorMessageHandler on error", async () => {
    const mockMutateFn = vi.fn().mockRejectedValue(new Error("fail"));
    const useTestMutation = mutate(mockMutateFn);

    const { result } = renderHook(() => useTestMutation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(errorHandler.errorMessageHandler).toHaveBeenCalled();
  });

  it("calls default onError callback", async () => {
    const onErrorDefault = vi.fn();
    const mockMutateFn = vi.fn().mockRejectedValue(new Error("err"));
    const useTestMutation = mutate(mockMutateFn, { onError: onErrorDefault });

    const { result } = renderHook(() => useTestMutation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onErrorDefault).toHaveBeenCalled();
  });

  it("calls per-call onError callback", async () => {
    const onErrorDefault = vi.fn();
    const onErrorCall = vi.fn();
    const mockMutateFn = vi.fn().mockRejectedValue(new Error("err2"));
    const useTestMutation = mutate(mockMutateFn, { onError: onErrorDefault });

    const { result } = renderHook(() => useTestMutation({ onError: onErrorCall }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onErrorDefault).toHaveBeenCalled();
    expect(onErrorCall).toHaveBeenCalled();
  });

  it("unwraps response.data from mutationFn", async () => {
    const mockMutateFn = vi.fn().mockResolvedValue({
      data: { unwrapped: true },
      status: 200,
    });
    const useTestMutation = mutate(mockMutateFn);

    const { result } = renderHook(() => useTestMutation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(null);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ unwrapped: true });
  });
});
