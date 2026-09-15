import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { modals } from "@mantine/modals";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { useAssets } from "./use-assets";

vi.mock("@mantine/modals", () => ({
  modals: {
    open: vi.fn(),
  },
}));

vi.mock("../utils/constants", () => ({
  DEFAULT_MODAL_SETTINGS: { centered: true },
}));

vi.mock("../components/assets/select-deposit-method", () => ({
  SelectDepositMethod: () => null,
}));

vi.mock("../components/transactions/internal-transfer", () => ({
  InternalTransfer: () => null,
}));

vi.mock("../components/transactions/external-transfer", () => ({
  ExternalTransfer: () => null,
}));

vi.mock("../stores/user-store", () => ({
  useUserStore: vi.fn(() => ({
    user: { id: "user-1", email: "test@test.com" },
  })),
}));

vi.mock("@/src/hooks/use-portfolio-ws", () => ({
  usePortfolioWs: vi.fn(() => ({
    coins: [
      { symbol: "BTC", currencyPrice: "67000", spotBalance: "1" },
    ],
    isLoading: false,
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useAssets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all expected properties", () => {
    const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.handleOpenDepositModal).toBe("function");
    expect(typeof result.current.handleOpenInternalTransferModal).toBe("function");
    expect(typeof result.current.handleOpenExternalTransferModal).toBe("function");
    expect(result.current.portfolio).toBeDefined();
    expect(typeof result.current.portfolioLoading).toBe("boolean");
  });

  it("handleOpenDepositModal calls modals.open", async () => {
        const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(),
    });

    result.current.handleOpenDepositModal();

    expect(modals.open).toHaveBeenCalledWith(
      expect.objectContaining({ centered: true }),
    );
  });

  it("handleOpenInternalTransferModal calls modals.open with defaults", async () => {
        const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(),
    });

    result.current.handleOpenInternalTransferModal();

    expect(modals.open).toHaveBeenCalled();
  });

  it("handleOpenInternalTransferModal passes defaultFrom and defaultTo", async () => {
        const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(),
    });

    result.current.handleOpenInternalTransferModal("spot", "funding");

    expect(modals.open).toHaveBeenCalled();
  });

  it("handleOpenExternalTransferModal calls modals.open", async () => {
        const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(),
    });

    result.current.handleOpenExternalTransferModal();

    expect(modals.open).toHaveBeenCalled();
  });

  it("portfolioLoading reflects portfolio ws loading state", () => {
        usePortfolioWs.mockReturnValue({
      coins: [],
      isLoading: true,
    });

    const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(),
    });

    expect(result.current.portfolioLoading).toBe(true);
  });
});
