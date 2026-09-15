import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Sidebar } from "./sidebar";
import { useUserStore } from "@/src/stores/user-store";
import { renderWithProviders } from "@/src/test/utils";

const pathnameMock = vi.hoisted(() => vi.fn(() => "/dashboard"));
const handleLogoutMock = vi.hoisted(() => vi.fn());
const getKycStatusMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ usePathname: pathnameMock }));
vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
vi.mock("@/src/lib/handle-logout", () => ({ handleLogout: handleLogoutMock }));
vi.mock("@/src/services/user", () => ({
  userKeys: { kycStatus: ["user", "kyc-status"] },
  userService: { getKycStatus: getKycStatusMock },
}));

const baseUser = {
  id: 1,
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  isIDverified: true,
  kycStatus: "approved",
};

describe("Sidebar", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/dashboard");
    handleLogoutMock.mockClear();
    getKycStatusMock.mockReset();
    getKycStatusMock.mockResolvedValue({ data: { status: "approved" } });
    useUserStore.setState({ user: baseUser as any });
  });

  it("renders the section labels and primary links", () => {
    renderWithProviders(<Sidebar />, { withQuery: true });
    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
    expect(screen.getByText("Trading")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute(
      "href",
      "/dashboard"
    );
    expect(screen.getByText("Markets").closest("a")).toHaveAttribute(
      "href",
      "/markets"
    );
  });

  it("renders expandable children links", () => {
    renderWithProviders(<Sidebar />, { withQuery: true });
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/assets/overview"
    );
    expect(screen.getByText("Spot Order").closest("a")).toHaveAttribute(
      "href",
      "/orders/spot"
    );
  });

  it("renders the futures PRO badge", () => {
    renderWithProviders(<Sidebar />, { withQuery: true });
    expect(screen.getByText("PRO")).toBeInTheDocument();
  });

  it("shows the transactions section on transaction routes", () => {
    pathnameMock.mockReturnValue("/transactions/deposit");
    renderWithProviders(<Sidebar />, { withQuery: true });
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("Withdrawal")).toBeInTheDocument();
    expect(screen.queryByText("Trading")).not.toBeInTheDocument();
  });

  it("shows the user profile with verified status", async () => {
    renderWithProviders(<Sidebar />, { withQuery: true });
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("KYC Verified")).toBeInTheDocument()
    );
  });

  it("shows KYC Pending for a pending status", async () => {
    useUserStore.setState({
      user: { ...baseUser, isIDverified: false, kycStatus: "pending" } as any,
    });
    getKycStatusMock.mockResolvedValue({ data: { status: "pending" } });
    renderWithProviders(<Sidebar />, { withQuery: true });
    await waitFor(() =>
      expect(screen.getByText("KYC Pending")).toBeInTheDocument()
    );
  });

  it("shows Unverified when no verification data exists", async () => {
    useUserStore.setState({
      user: { ...baseUser, isIDverified: false, kycStatus: "" } as any,
    });
    getKycStatusMock.mockResolvedValue({ data: {} });
    renderWithProviders(<Sidebar />, { withQuery: true });
    await waitFor(() =>
      expect(screen.getByText("Unverified")).toBeInTheDocument()
    );
  });

  it("renders Loading... when there is no user", () => {
    useUserStore.setState({ user: null });
    renderWithProviders(<Sidebar />, { withQuery: true });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("calls handleLogout when the sign out button is clicked", () => {
    renderWithProviders(<Sidebar />, { withQuery: true });
    fireEvent.click(screen.getByTitle("Sign out"));
    expect(handleLogoutMock).toHaveBeenCalledTimes(1);
  });

  it("activates the matching section for the current route", () => {
    pathnameMock.mockReturnValue("/assets/spot");
    const { container } = renderWithProviders(<Sidebar />, { withQuery: true });
    const assetsButton = screen.getByText("Assets").closest("button");
    expect(assetsButton?.className).toContain("bg-primary/10");
    expect(container).toBeTruthy();
  });
});