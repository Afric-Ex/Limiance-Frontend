import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { PaymentMethodManager } from "./payment-method-manager";

const { usePaymentMethods, useAddPaymentMethod } = vi.hoisted(() => ({
  usePaymentMethods: vi.fn(),
  useAddPaymentMethod: vi.fn(),
}));

vi.mock("@/src/hooks/p2p/use-p2p", () => ({
  usePaymentMethods,
  useAddPaymentMethod,
}));

const addMutate = vi.fn();

const savedMethods = [
  {
    id: "pm-1",
    method: "Bank Transfer",
    data: { bankName: "Chase", accountName: "John Doe", accountNumber: "123" },
  },
  {
    id: "pm-2",
    method: "PayPal",
    data: { bankName: "", accountName: "John D", accountNumber: "j@x.com" },
  },
];

describe("PaymentMethodManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePaymentMethods.mockReturnValue({
      data: { data: { data: savedMethods } },
      isLoading: false,
    });
    useAddPaymentMethod.mockReturnValue({
      mutate: addMutate,
      isPending: false,
    });
  });

  const makeProps = (overrides = {}) => ({
    isOpen: true,
    onClose: vi.fn(),
    selectedMethodIds: ["pm-1"],
    onChangeSelected: vi.fn(),
    fiat: "USD",
    adMode: "BUY" as const,
    ...overrides,
  });

  it("renders saved payment methods", () => {
    renderWithProviders(<PaymentMethodManager {...makeProps()} />);
    expect(screen.getByText("Chase")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
  });

  it("shows loading skeletons while fetching", () => {
    usePaymentMethods.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<PaymentMethodManager {...makeProps()} />);
    expect(screen.getByText("Manage Payment Methods")).toBeInTheDocument();
  });

  it("marks selected methods", () => {
    renderWithProviders(<PaymentMethodManager {...makeProps()} />);
    const selectedRow = screen.getByText("Chase").closest(".p-4");
    expect(selectedRow?.className).toContain("bg-yellow-500/10");
  });

  it("toggles a method selection", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <PaymentMethodManager {...makeProps({ onChangeSelected: onChange })} />
    );
    fireEvent.click(screen.getByText("PayPal"));
    expect(onChange).toHaveBeenCalledWith(["pm-1", "pm-2"]);
  });

  it("deselects a selected method", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <PaymentMethodManager {...makeProps({ onChangeSelected: onChange })} />
    );
    fireEvent.click(screen.getByText("Chase"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("opens add method form", () => {
    renderWithProviders(<PaymentMethodManager {...makeProps()} />);
    fireEvent.click(screen.getByText("+ Add New Payment Method"));
    expect(screen.getByText("Add New Method")).toBeInTheDocument();
  });

  it("adds a new payment method", () => {
    renderWithProviders(<PaymentMethodManager {...makeProps()} />);
    fireEvent.click(screen.getByText("+ Add New Payment Method"));
    fireEvent.change(screen.getByPlaceholderText("Exactly as shown on ID"), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByPlaceholderText("Number or Email"), {
      target: { value: "555" },
    });
    fireEvent.change(screen.getByLabelText("Bank Name"), {
      target: { value: "BOA" },
    });
    fireEvent.click(screen.getByText("Add Method"));
    expect(addMutate).toHaveBeenCalledWith(
      {
        method: "Bank Transfer",
        accountName: "Alice",
        accountNumber: "555",
        bankName: "BOA",
      },
      expect.any(Object)
    );
  });

  it("disables Add Method without account name/number", () => {
    renderWithProviders(<PaymentMethodManager {...makeProps()} />);
    fireEvent.click(screen.getByText("+ Add New Payment Method"));
    const addBtn = screen.getByText("Add Method").closest("button");
    expect(addBtn).toBeDisabled();
  });

  it("shows Bank Name field for Bank Transfer methods", () => {
    renderWithProviders(<PaymentMethodManager {...makeProps()} />);
    fireEvent.click(screen.getByText("+ Add New Payment Method"));
    expect(screen.getByLabelText("Bank Name")).toBeInTheDocument();
  });
});