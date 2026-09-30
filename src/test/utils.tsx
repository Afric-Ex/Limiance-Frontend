import React from "react";
import { render } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { vi } from "vitest";

(globalThis as any).React = React;

export interface RenderOptions {
  withQuery?: boolean;
  queryClient?: QueryClient;
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactNode,
  opts: RenderOptions = {}
) {
  installTestGlobals();

  const queryClient =
    opts.queryClient ?? (opts.withQuery ? createTestQueryClient() : undefined);

  const build = (node: ReactNode) => {
    let content = <MantineProvider>{node}</MantineProvider>;
    if (queryClient) {
      content = (
        <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
      );
    }
    return content;
  };

  const result = render(build(ui));
  const rerender = (node: ReactNode) => result.rerender(build(node));

  return { ...result, rerender, queryClient };
}

export function installTestGlobals() {
  if (typeof globalThis !== "undefined" && !("ResizeObserver" in globalThis)) {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
  }

  // jsdom has no IntersectionObserver. Mantine's useIntersection would throw on
  // construction, so infinite-scroll components need a stub. It never reports
  // an intersection, which means the trigger stays in its idle state — tests
  // drive loading by calling the returned fetchNextPage directly.
  if (typeof globalThis !== "undefined" && !("IntersectionObserver" in globalThis)) {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        root = null;
        rootMargin = "";
        thresholds: number[] = [];
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      }
    );
  }

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }

  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn();
  }
}

export function mockClipboard() {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
}