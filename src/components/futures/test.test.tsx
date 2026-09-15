import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

vi.mock("echarts/core", () => ({
  use: vi.fn(),
  format: { formatTime: vi.fn(() => "formatted") },
}));

vi.mock("echarts-for-react/lib/core", () => ({
  default: () => <div data-testid="chart" />,
}));

vi.mock("echarts/components", () => ({
  TitleComponent: {},
  GraphicComponent: {},
  TooltipComponent: {},
  GridComponent: {},
  LegendComponent: {},
  DataZoomComponent: {},
}));

vi.mock("echarts/charts", () => ({
  BarChart: {},
  CandlestickChart: {},
  LineChart: {},
}));

vi.mock("echarts/features", () => ({
  UniversalTransition: {},
}));

vi.mock("echarts/renderers", () => ({
  CanvasRenderer: {},
}));

import App from "./test";
import * as echarts from "echarts/core";

describe("futures/test.tsx (scratch echarts component)", () => {
  it("renders the echarts core chart wrapper", () => {
    renderWithProviders(<App />);
    expect(screen.getByTestId("chart")).toBeInTheDocument();
  });

  it("registers echarts modules on mount", () => {
    renderWithProviders(<App />);
    expect(echarts.use).toHaveBeenCalled();
  });
});