import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileTopBar } from "./mobile-top-bar";

const backMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: backMock }),
}));

describe("MobileTopBar", () => {
  beforeEach(() => backMock.mockClear());

  it("renders the title", () => {
    render(<MobileTopBar title="Deposit" />);
    expect(screen.getByText("Deposit")).toBeInTheDocument();
  });

  it("does not render a back button by default", () => {
    render(<MobileTopBar />);
    expect(screen.queryByLabelText("Go back")).not.toBeInTheDocument();
  });

  it("renders a working back button when showBack is set", () => {
    render(<MobileTopBar showBack />);
    fireEvent.click(screen.getByLabelText("Go back"));
    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it("renders a custom left element instead of the back button", () => {
    render(<MobileTopBar showBack leftElement={<span>LEFT</span>} />);
    expect(screen.getByText("LEFT")).toBeInTheDocument();
    expect(screen.queryByLabelText("Go back")).not.toBeInTheDocument();
  });

  it("renders a custom right element", () => {
    render(<MobileTopBar rightElement={<span>RIGHT</span>} />);
    expect(screen.getByText("RIGHT")).toBeInTheDocument();
  });
});