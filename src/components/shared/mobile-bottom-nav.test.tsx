import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileBottomNav } from "./mobile-bottom-nav";

const pathnameMock = vi.hoisted(() => vi.fn(() => "/dashboard"));
const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

describe("MobileBottomNav", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/dashboard");
    pushMock.mockClear();
  });

  it("renders the four nav tabs and the trade button", () => {
    render(<MobileBottomNav />);
    for (const name of ["Home", "Markets", "Assets", "Profile", "Trade"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("links each tab to its route", () => {
    render(<MobileBottomNav />);
    expect(screen.getByText("Home").closest("a")).toHaveAttribute(
      "href",
      "/dashboard"
    );
    expect(screen.getByText("Markets").closest("a")).toHaveAttribute(
      "href",
      "/markets"
    );
    expect(screen.getByText("Assets").closest("a")).toHaveAttribute(
      "href",
      "/assets/overview"
    );
    expect(screen.getByText("Profile").closest("a")).toHaveAttribute(
      "href",
      "/account/profile"
    );
  });

  it("highlights the active tab", () => {
    render(<MobileBottomNav />);
    expect(screen.getByText("Home").className).toContain("text-primary");
    expect(screen.getByText("Markets").className).not.toContain("text-primary");
  });

  it("opens the trade sheet with all options", () => {
    render(<MobileBottomNav />);
    expect(screen.queryByText("Spot Trading")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Trade").parentElement!.querySelector("button")!);
    for (const label of [
      "Spot Trading",
      "Futures Trading",
      "Margin Trading",
      "P2P Trading",
      "Buy Crypto",
      "Convert",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("navigates and closes when an option is selected", () => {
    render(<MobileBottomNav />);
    fireEvent.click(screen.getByText("Trade").parentElement!.querySelector("button")!);
    fireEvent.click(screen.getByText("Spot Trading"));
    expect(pushMock).toHaveBeenCalledWith("/trades/spot");
    expect(screen.queryByText("Spot Trading")).not.toBeInTheDocument();
  });
});