import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { MerchantStats } from "./merchant-stats";

const baseProps = {
  name: "Alice",
  verified: true,
  trades: 150,
  completionRate: 98.5,
  responseTime: "5 mins",
};

describe("MerchantStats", () => {
  it("renders the merchant name", () => {
    renderWithProviders(<MerchantStats {...baseProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders the avatar initial", () => {
    const { container } = renderWithProviders(<MerchantStats {...baseProps} />);
    const avatar = container.querySelector(".rounded-full");
    expect(avatar?.textContent).toContain("A");
  });

  it("renders trade count and completion rate", () => {
    renderWithProviders(<MerchantStats {...baseProps} />);
    expect(screen.getByText("150 orders")).toBeInTheDocument();
    expect(screen.getByText("98.5%")).toBeInTheDocument();
  });

  it("renders response time", () => {
    renderWithProviders(<MerchantStats {...baseProps} />);
    expect(screen.getByText("Avg. pay: 5 mins")).toBeInTheDocument();
  });

  it("renders verified badge when verified", () => {
    const { container } = renderWithProviders(<MerchantStats {...baseProps} />);
    expect(container.querySelector(".text-buy")).toBeTruthy();
  });

  it("does not render verified icon when not verified", () => {
    const { container } = renderWithProviders(
      <MerchantStats {...baseProps} verified={false} />
    );
    expect(container.querySelector(".text-buy")).toBeFalsy();
  });

  it("uses default 'M' initial for empty name", () => {
    const { container } = renderWithProviders(
      <MerchantStats {...baseProps} name="" />
    );
    const avatar = container.querySelector(".rounded-full");
    expect(avatar?.textContent).toContain("M");
  });

  it("always shows the thumbs-up percentage", () => {
    renderWithProviders(<MerchantStats {...baseProps} />);
    expect(screen.getByText("98%")).toBeInTheDocument();
  });
});
