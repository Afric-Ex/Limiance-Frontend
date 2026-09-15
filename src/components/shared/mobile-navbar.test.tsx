import React from "react";
(globalThis as any).React = React;
import { fireEvent, waitFor } from "@testing-library/react";
import { MobileNavbar } from "./mobile-navbar";
import { useUserStore } from "@/src/stores/user-store";
import { installTestGlobals, renderWithProviders } from "@/src/test/utils";

const pathnameMock = vi.hoisted(() => vi.fn(() => "/dashboard"));
const handleLogoutMock = vi.hoisted(() => vi.fn());
const openDepositMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
  useRouter: () => ({ push: vi.fn() }),
}));
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
vi.mock("@/src/lib/handle-logout", () => ({ handleLogout: handleLogoutMock }));

installTestGlobals();

describe("MobileNavbar", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/dashboard");
    handleLogoutMock.mockClear();
    openDepositMock.mockClear();
    useUserStore.setState({
      user: {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      } as any,
    });
  });

  it("renders nothing when closed", async () => {
    const { baseElement } = renderWithProviders(
      <MobileNavbar opened={false} close={vi.fn()} />
    );
    await waitFor(() => {
      expect(baseElement.textContent).not.toContain("Deposit");
    });
  });

  it("renders the menu for authenticated users", async () => {
    const { baseElement } = renderWithProviders(
      <MobileNavbar opened close={vi.fn()} />
    );
    await waitFor(() => {
      expect(baseElement.textContent).toContain("MENU");
      expect(baseElement.textContent).toContain("OTHERS");
      expect(baseElement.textContent).toContain("Rewards Hub");
      expect(baseElement.textContent).toContain("Settings");
      expect(baseElement.textContent).toContain("Log Out");
    });
  });

  it("opens the deposit modal and closes", async () => {
    const close = vi.fn();
    const { baseElement, getAllByText } = renderWithProviders(
      <MobileNavbar opened close={close} />
    );
    await waitFor(() =>
      expect(baseElement.textContent).toContain("Deposit")
    );
    fireEvent.click(getAllByText("Deposit")[0]);
    expect(openDepositMock).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalled();
  });

  it("logs out and closes", async () => {
    const close = vi.fn();
    const { baseElement, getByText } = renderWithProviders(
      <MobileNavbar opened close={close} />
    );
    await waitFor(() => expect(baseElement.textContent).toContain("Log Out"));
    fireEvent.click(getByText("Log Out"));
    expect(handleLogoutMock).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalled();
  });

  it("shows auth links for guests", async () => {
    useUserStore.setState({ user: null });
    const { baseElement } = renderWithProviders(
      <MobileNavbar opened close={vi.fn()} />
    );
    await waitFor(() => {
      expect(baseElement.textContent).toContain("Login");
      expect(baseElement.textContent).toContain("Sign Up");
    });
  });

  it("uses transaction links on transaction routes", async () => {
    pathnameMock.mockReturnValue("/transactions/deposit");
    const { baseElement } = renderWithProviders(
      <MobileNavbar opened close={vi.fn()} />
    );
    await waitFor(() =>
      expect(baseElement.textContent).toContain("Withdrawal")
    );
  });
});