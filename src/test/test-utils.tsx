import React from "react";
import { MantineProvider } from "@mantine/core";
import { cleanup, render, RenderOptions } from "@testing-library/react";
import { afterEach, vi } from "vitest";

(globalThis as any).React = React;

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

if (typeof navigator !== "undefined" && !navigator.clipboard) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn(), readText: vi.fn() },
    configurable: true,
  });
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (typeof HTMLElement !== "undefined") {
  HTMLElement.prototype.hasPointerCapture = HTMLElement.prototype.hasPointerCapture || (() => false);
  HTMLElement.prototype.setPointerCapture = HTMLElement.prototype.setPointerCapture || (() => {});
  HTMLElement.prototype.releasePointerCapture = HTMLElement.prototype.releasePointerCapture || (() => {});
}

export const renderWithProviders = (ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  const wrapper = (node: React.ReactElement) => <MantineProvider>{node}</MantineProvider>;
  const result = render(wrapper(ui), options);
  const rerender = (nextUi: React.ReactElement) => result.rerender(wrapper(nextUi));
  return { ...result, rerender };
};

afterEach(() => {
  cleanup();
});