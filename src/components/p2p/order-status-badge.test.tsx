import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderStatus } from "@/src/stores/p2p-store";

const getBadge = (text: string) =>
  screen.getByText(text).closest("div") as HTMLElement;

describe("OrderStatusBadge", () => {
  const statuses: { status: OrderStatus; label: string }[] = [
    { status: "PENDING_PAYMENT", label: "PENDING PAYMENT" },
    { status: "PAID", label: "PAID" },
    { status: "RELEASED", label: "RELEASED" },
    { status: "COMPLETED", label: "COMPLETED" },
    { status: "CANCELLED", label: "CANCELLED" },
    { status: "DISPUTED", label: "DISPUTED" },
  ];

  statuses.forEach(({ status, label }) => {
    it(`renders ${status} with correct label`, () => {
      renderWithProviders(<OrderStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("shows pulse dot for PENDING_PAYMENT", () => {
    const { container } = renderWithProviders(
      <OrderStatusBadge status="PENDING_PAYMENT" />
    );
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("shows checkmark for COMPLETED", () => {
    renderWithProviders(<OrderStatusBadge status="COMPLETED" />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows cross for CANCELLED", () => {
    renderWithProviders(<OrderStatusBadge status="CANCELLED" />);
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("shows warning for DISPUTED", () => {
    renderWithProviders(<OrderStatusBadge status="DISPUTED" />);
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("applies red styles for DISPUTED", () => {
    renderWithProviders(<OrderStatusBadge status="DISPUTED" />);
    expect(getBadge("DISPUTED").className).toContain("#F6465D");
  });

  it("applies green styles for COMPLETED", () => {
    renderWithProviders(<OrderStatusBadge status="COMPLETED" />);
    expect(getBadge("COMPLETED").className).toContain("text-buy");
  });

  it("accepts additional className", () => {
    renderWithProviders(
      <OrderStatusBadge status="PAID" className="extra-class" />
    );
    expect(getBadge("PAID").className).toContain("extra-class");
  });
});