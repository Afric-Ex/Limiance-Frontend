import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { PaymentMethodBadge } from "./payment-method-badge";

const getBadge = (text: string) =>
  screen.getByText(text).closest("div") as HTMLElement;

describe("PaymentMethodBadge", () => {
  it("renders the method name", () => {
    renderWithProviders(<PaymentMethodBadge method="Bank Transfer" />);
    expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
  });

  it("applies blue styles for bank-related methods", () => {
    renderWithProviders(<PaymentMethodBadge method="Bank Transfer" />);
    expect(getBadge("Bank Transfer").className).toContain("text-blue-400");
  });

  it("applies blue styles for transfer methods", () => {
    renderWithProviders(<PaymentMethodBadge method="Wire Transfer" />);
    expect(getBadge("Wire Transfer").className).toContain("text-blue-400");
  });

  it("applies PayPal styles", () => {
    renderWithProviders(<PaymentMethodBadge method="PayPal" />);
    expect(getBadge("PayPal").className).toContain("#0079C1");
  });

  it("applies WeChat styles", () => {
    renderWithProviders(<PaymentMethodBadge method="WeChat Pay" />);
    expect(getBadge("WeChat Pay").className).toContain("text-green-400");
  });

  it("applies Alipay styles", () => {
    renderWithProviders(<PaymentMethodBadge method="Alipay" />);
    expect(getBadge("Alipay").className).toContain("#1677FF");
  });

  it("applies default yellow styles for unknown methods", () => {
    renderWithProviders(<PaymentMethodBadge method="Cash" />);
    expect(getBadge("Cash").className).toContain("text-yellow-400");
  });

  it("accepts additional className", () => {
    renderWithProviders(
      <PaymentMethodBadge method="Bank Transfer" className="extra-class" />
    );
    expect(getBadge("Bank Transfer").className).toContain("extra-class");
  });
});