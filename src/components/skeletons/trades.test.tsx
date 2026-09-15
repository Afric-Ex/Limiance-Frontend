import React from "react";
(globalThis as any).React = React;
import { render } from "@testing-library/react";
import {
  SpotTradePageSkeleton,
  MarginTradePageSkeleton,
  FuturesTradePageSkeleton,
} from "./trades";

describe("SpotTradePageSkeleton", () => {
  it("renders the trading workspace layout", () => {
    const { container } = render(<SpotTradePageSkeleton />);
    const shell = container.firstChild as HTMLElement;
    expect(shell.className).toContain("page-enter");
    expect(shell.className).toContain("max-w-[1600px]");
  });

  it("renders avatar, chart and order panels", () => {
    const { container } = render(<SpotTradePageSkeleton />);
    const circles = Array.from(
      container.querySelectorAll<HTMLElement>(".skeleton")
    ).filter((el) => el.style.width === "36px");
    expect(circles).toHaveLength(1);
    expect(container.querySelectorAll(".skeleton").length).toBe(33);
  });
});

describe("MarginTradePageSkeleton", () => {
  it("reuses the spot trading workspace layout", () => {
    const { container } = render(<MarginTradePageSkeleton />);
    expect(container.querySelectorAll(".skeleton").length).toBe(33);
  });
});

describe("FuturesTradePageSkeleton", () => {
  it("reuses the spot trading workspace layout", () => {
    const { container } = render(<FuturesTradePageSkeleton />);
    expect(container.querySelectorAll(".skeleton").length).toBe(33);
  });
});