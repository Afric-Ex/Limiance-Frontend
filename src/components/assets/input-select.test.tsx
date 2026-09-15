import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

import { InputSelect } from "./input-select";

const data = [
  { name: "Nigerian Naira", logo: "/ngn.png", short: "NGN" },
  { name: "US Dollar", logo: "/usd.png", short: "USD" },
];

describe("InputSelect", () => {
  it("defaults to the first currency", () => {
    renderWithProviders(<InputSelect data={data} />);
    expect(screen.getByText("NGN")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Amount")).toBeInTheDocument();
  });

  it("respects an initialValue", () => {
    renderWithProviders(<InputSelect data={data} initialValue="USD" />);
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("calls handleCurrencyUpdate when a currency is selected from the dropdown", () => {
    const handleCurrencyUpdate = vi.fn();
    renderWithProviders(
      <InputSelect data={data} handleCurrencyUpdate={handleCurrencyUpdate} />
    );
    fireEvent.click(screen.getByText("NGN"));
    const usdOption = screen.getAllByText("US Dollar");
    fireEvent.click(usdOption[0]);
    expect(handleCurrencyUpdate).toHaveBeenCalledWith("usd");
    expect(screen.getByText("USD")).toBeInTheDocument();
  });
});