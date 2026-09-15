import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import TradingViewChart from "./candlestick-char";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  (globalThis as any).ResizeObserver = ResizeObserverStub;
  (HTMLCanvasElement.prototype as any).getContext = vi.fn(() => {
    const noop = () => {};
    return {
      clearRect: noop,
      fillRect: noop,
      beginPath: noop,
      moveTo: noop,
      lineTo: noop,
      closePath: noop,
      fill: noop,
      stroke: noop,
      setLineDash: noop,
      fillText: noop,
      measureText: () => ({ width: 0 }),
    };
  });
});

const INTERVALS = ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W"] as const;

describe("TradingViewChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the chart view with view toggles and interval buttons", () => {
    renderWithProviders(<TradingViewChart symbol="BTC/USDT" />);
    expect(screen.getByText("Chart")).toBeInTheDocument();
    expect(screen.getByText("Depth")).toBeInTheDocument();
    for (const iv of INTERVALS) {
      expect(screen.getAllByText(iv).length).toBeGreaterThan(0);
    }
    fireEvent.click(screen.getByText("1h"));
    expect(screen.getByText("1h")).toBeInTheDocument();
  });

  it("renders the order level overlay with labels and prices", () => {
    renderWithProviders(
      <TradingViewChart
        symbol="BTC/USDT"
        orderLevels={[
          { id: "e1", label: "Entry", price: 65000, color: "entry" },
          { id: "tp1", label: "TP", price: 68000, color: "tp" },
          { id: "sl1", label: "SL", price: 62000, color: "sl" },
        ]}
      />
    );
    expect(screen.getByText("Entry")).toBeInTheDocument();
    expect(screen.getByText("TP")).toBeInTheDocument();
    expect(screen.getByText("SL")).toBeInTheDocument();
    expect(screen.getAllByText("65,000").length).toBeGreaterThan(0);
  });

  it("switches between chart and depth views", () => {
    renderWithProviders(
      <TradingViewChart
        orderBook={{
          buyOrders: [
            { price: 64000, quantity: 2 },
            { price: 63900, quantity: 1 },
          ],
          sellOrders: [{ price: 64100, quantity: 1 }],
        }}
      />
    );
    fireEvent.click(screen.getByText("Depth"));
    expect(screen.getByRole("button", { name: "Depth" })).toHaveClass("text-white");
    expect(document.querySelector("canvas")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Chart"));
    expect(screen.getByRole("button", { name: "Chart" })).toHaveClass("text-white");
  });
});