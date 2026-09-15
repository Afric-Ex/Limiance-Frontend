import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileSideDrawer } from "./mobile-side-drawer";
import { useUserStore } from "@/src/stores/user-store";

const pathnameMock = vi.hoisted(() => vi.fn(() => "/dashboard"));
const handleLogoutMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ usePathname: pathnameMock }));
vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
vi.mock("@/src/lib/handle-logout", () => ({ handleLogout: handleLogoutMock }));

describe("MobileSideDrawer", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/dashboard");
    handleLogoutMock.mockClear();
    useUserStore.setState({
      user: {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      } as any,
    });
    document.body.style.overflow = "";
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <MobileSideDrawer open={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the user and nav sections when open", () => {
    render(<MobileSideDrawer open onClose={vi.fn()} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
    expect(screen.getByText("Deposit").closest("a")).toHaveAttribute(
      "href",
      "/transactions/deposit"
    );
  });

  it("locks body scroll while open", () => {
    render(<MobileSideDrawer open onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("calls onClose from the close button", () => {
    const onClose = vi.fn();
    render(<MobileSideDrawer open onClose={onClose} />);
    onClose.mockClear();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the overlay is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <MobileSideDrawer open onClose={onClose} />
    );
    onClose.mockClear();
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls handleLogout when Log Out is clicked", () => {
    render(<MobileSideDrawer open onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("Log Out"));
    expect(handleLogoutMock).toHaveBeenCalledTimes(1);
  });

  it("closes on route change", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <MobileSideDrawer open onClose={onClose} />
    );
    onClose.mockClear();
    pathnameMock.mockReturnValue("/orders/spot");
    rerender(<MobileSideDrawer open onClose={onClose} />);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});