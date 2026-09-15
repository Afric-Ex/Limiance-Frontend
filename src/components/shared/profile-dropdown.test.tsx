import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileDropdown } from "./profile-dropdown";
import { useUserStore } from "@/src/stores/user-store";
import { renderWithProviders } from "@/src/test/utils";

const handleLogoutMock = vi.hoisted(() => vi.fn());

vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
vi.mock("@/src/lib/handle-logout", () => ({ handleLogout: handleLogoutMock }));

const user = {
  id: 42,
  email: "john.doe@example.com",
  isVerified: true,
  firstName: "John",
  lastName: "Doe",
};

describe("ProfileDropdown", () => {
  beforeEach(() => {
    handleLogoutMock.mockClear();
    useUserStore.setState({ user: user as any });
  });

  it("renders the truncated email and uid", () => {
    renderWithProviders(<ProfileDropdown />);
    expect(screen.getByText("john***@example.com")).toBeInTheDocument();
    expect(screen.getByText("UID: 42")).toBeInTheDocument();
  });

  it("shows the Verified badge when the user is verified", () => {
    renderWithProviders(<ProfileDropdown />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("omits the Verified badge when the user is unverified", () => {
    useUserStore.setState({ user: { ...user, isVerified: false } as any });
    renderWithProviders(<ProfileDropdown />);
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });

  it("renders the desktop navigation links", () => {
    renderWithProviders(<ProfileDropdown />);
    for (const [name, href] of [
      ["Dashboard", "/dashboard"],
      ["Assets", "/assets/overview"],
      ["Orders", "/orders/spot"],
      ["Rewards Hub", "/rewards-hub"],
      ["Account", "/account/profile"],
      ["Settings", "/settings"],
    ]) {
      expect(screen.getByText(name).closest("a")).toHaveAttribute("href", href);
    }
  });

  it("calls handleLogout when Log Out is clicked", () => {
    renderWithProviders(<ProfileDropdown />);
    fireEvent.click(screen.getByText("Log Out"));
    expect(handleLogoutMock).toHaveBeenCalledTimes(1);
  });

  it("omits links and logout on mobile", () => {
    renderWithProviders(<ProfileDropdown isMobile />);
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Log Out")).not.toBeInTheDocument();
  });
});