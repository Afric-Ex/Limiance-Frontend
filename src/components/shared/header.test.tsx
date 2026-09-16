import React from "react";
(globalThis as any).React = React;
import { fireEvent, screen } from "@testing-library/react";
import Header from "./header";
import { useUserStore } from "@/src/stores/user-store";
import { useNotificationStore } from "@/src/stores/notification-store";
import { installTestGlobals, renderWithProviders } from "@/src/test/utils";

const pathnameMock = vi.hoisted(() => vi.fn(() => "/"));
const openDepositMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ usePathname: pathnameMock }));
vi.mock("next/link", () => ({
  default: ({ href, children, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  default: (props: any) => <img src={props.src ?? ""} alt={props.alt ?? ""} />,
}));
vi.mock("@/src/hooks/use-assets", () => ({
  useAssets: () => ({ handleOpenDepositModal: openDepositMock }),
}));
vi.mock("./mobile-navbar", () => ({
  MobileNavbar: () => <div data-testid="mobile-navbar" />,
}));

installTestGlobals();

describe("Header", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/");
    openDepositMock.mockClear();
    useUserStore.setState({ user: null });
    useNotificationStore.setState({ unreadCount: 0, notifications: [] });
  });

  it("shows login and signup links for guests", () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole("button", { name: "Login" }).closest("a")).toHaveAttribute(
      "href",
      "/auth/login"
    );
    expect(screen.getByRole("button", { name: "Sign Up" }).closest("a")).toHaveAttribute(
      "href",
      "/auth/signup"
    );
  });

  it("renders the navigation for authenticated users", () => {
    useUserStore.setState({ user: { id: 1 } as any });
    renderWithProviders(<Header />);
    for (const name of ["Buy crypto", "Markets", "Trades", "Earn", "More"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("opens the deposit modal", () => {
    useUserStore.setState({ user: { id: 1 } as any });
    renderWithProviders(<Header />);
    fireEvent.click(screen.getByText("Deposit"));
    expect(openDepositMock).toHaveBeenCalledTimes(1);
  });

  it("renders the notification badge with a max of 9+", () => {
    useUserStore.setState({ user: { id: 1 } as any });
    useNotificationStore.setState({ unreadCount: 12 });
    renderWithProviders(<Header />);
    expect(screen.getAllByText("9+").length).toBeGreaterThan(0);
  });

  it("renders the numeric notification count when small", () => {
    useUserStore.setState({ user: { id: 1 } as any });
    useNotificationStore.setState({ unreadCount: 3 });
    renderWithProviders(<Header />);
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
  });

  it("renders the mobile navbar container", () => {
    renderWithProviders(<Header />);
    expect(screen.getByTestId("mobile-navbar")).toBeInTheDocument();
  });
});