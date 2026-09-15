import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { screen, act } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { CountdownTimer } from "./countdown-timer";

describe("CountdownTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const getElement = () =>
    document.querySelector(".font-mono") as HTMLElement;

  it("shows 00:00 for a past date", () => {
    renderWithProviders(
      <CountdownTimer targetDate="2020-01-01T00:00:00Z" />
    );
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("calls onExpire when the target date is in the past", () => {
    const onExpire = vi.fn();
    renderWithProviders(
      <CountdownTimer targetDate="2020-01-01T00:00:00Z" onExpire={onExpire} />
    );
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("does not call onExpire immediately if target is in the future", () => {
    const future = new Date(Date.now() + 300_000).toISOString();
    const onExpire = vi.fn();
    renderWithProviders(
      <CountdownTimer targetDate={future} onExpire={onExpire} />
    );
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("counts down by 1 second each tick", () => {
    const future = new Date(Date.now() + 65_000).toISOString();
    renderWithProviders(
      <CountdownTimer targetDate={future} />
    );
    expect(screen.getByText("01:05")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("01:04")).toBeInTheDocument();
  });

  it("applies red class when under 2 minutes", () => {
    const future = new Date(Date.now() + 90_000).toISOString();
    renderWithProviders(
      <CountdownTimer targetDate={future} />
    );
    expect(getElement().className).toContain("text-[#F6465D]");
  });

  it("applies yellow class when between 2 and 5 minutes", () => {
    const future = new Date(Date.now() + 240_000).toISOString();
    renderWithProviders(
      <CountdownTimer targetDate={future} />
    );
    expect(getElement().className).toContain("text-yellow-500");
  });

  it("applies white class when over 5 minutes", () => {
    const future = new Date(Date.now() + 600_000).toISOString();
    renderWithProviders(
      <CountdownTimer targetDate={future} />
    );
    expect(getElement().className).toContain("text-white");
  });

  it("transitions to red when falling below 2 minutes", () => {
    const future = new Date(Date.now() + 180_000).toISOString();
    renderWithProviders(
      <CountdownTimer targetDate={future} />
    );
    expect(getElement().className).toContain("text-yellow-500");

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(getElement().className).toContain("text-[#F6465D]");
  });
});
