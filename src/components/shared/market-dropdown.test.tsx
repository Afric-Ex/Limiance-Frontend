import React from "react";
(globalThis as any).React = React;
import { screen, fireEvent } from "@testing-library/react";
import { MarketDropdown } from "./market-dropdown";
import { renderWithProviders } from "@/src/test/utils";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("next/image", () => ({
  default: (props: any) => <img src={props.src ?? ""} alt={props.alt ?? ""} />,
}));

describe("MarketDropdown", () => {
  beforeEach(() => pushMock.mockClear());

  it("renders the market list and trading pairs", () => {
    renderWithProviders(<MarketDropdown />);
    expect(screen.getByText("Markets")).toBeInTheDocument();
    expect(screen.getByText("Trading Pairs")).toBeInTheDocument();
    for (const title of [
      "Futures",
      "Spot Trading",
      "Margin Trading",
      "Convert",
      "Trading Bots",
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("shows the futures trading pair by default", () => {
    renderWithProviders(<MarketDropdown />);
    expect(screen.getByText("BTC/USDT")).toBeInTheDocument();
  });

  it("switches the right panel on hover", () => {
    renderWithProviders(<MarketDropdown />);
    const futures = screen.getByText("Futures").closest("li");
    const spot = screen.getByText("Spot Trading").closest("li");
    expect(futures?.className).toContain("bg-gray-18");
    fireEvent.mouseOver(spot as HTMLElement);
    expect(spot?.className).toContain("bg-gray-18");
    expect(screen.getByText("Trading Pairs")).toBeInTheDocument();
  });

  it("navigates on click of a linked item", () => {
    renderWithProviders(<MarketDropdown />);
    fireEvent.click(screen.getByText("Spot Trading"));
    expect(pushMock).toHaveBeenCalledWith("/trades/spot");
  });

  it("shows the fees count for futures", () => {
    renderWithProviders(<MarketDropdown />);
    expect(screen.getByText("0 fees")).toBeInTheDocument();
  });
});