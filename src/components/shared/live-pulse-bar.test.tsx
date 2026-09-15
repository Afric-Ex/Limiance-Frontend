import React from "react";
(globalThis as any).React = React;
import { render, screen, act } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { LivePulseBar } from "./live-pulse-bar";

describe("LivePulseBar", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the initial alert text and a fire icon", () => {
    const { container } = render(<LivePulseBar />);
    expect(
      screen.getByText("BTC surged 5.2% in the last 24h")
    ).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("rotates through the alert list on an interval", () => {
    vi.useFakeTimers();
    render(<LivePulseBar />);

    const alerts = [
      "Whale Alert: 1,000 BTC transferred",
      "ETH/USDT high trading volume",
      "New Listing: NOT/USDT is now live!",
      "BTC surged 5.2% in the last 24h",
    ];

    alerts.forEach((text) => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });
});