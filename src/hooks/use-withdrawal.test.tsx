import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { asset } from "../services/asset";
import { modals } from "@mantine/modals";
import { errorMessageHandler } from "../lib/error-handler";
import { useUserStore } from "../stores/user-store";
import { useWithdrawal } from "./use-withdrawal";

vi.mock("@mantine/form", () => ({
  useForm: vi.fn(() => ({
    values: { amount: "", address: "" },
    setFieldValue: vi.fn(),
    reset: vi.fn(),
    onSubmit: vi.fn((fn: any) => fn),
  })),
}));

vi.mock("@mantine/modals", () => ({
  modals: {
    open: vi.fn(),
    closeAll: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("../utils/network-mapper", () => ({
  mapSymbolToWalletChain: vi.fn((s: string) => {
    const map: Record<string, string> = {
      BTC: "bitcoin",
      ETH: "evm",
      SOL: "solana",
      BSC: "bsc",
    };
    return map[s] || s?.toLowerCase() || "";
  }),
  mapSymbolToWithdrawalChain: vi.fn((s: string) => {
    const map: Record<string, string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SOL: "solana",
      BSC: "bsc",
    };
    return map[s] || s?.toLowerCase() || "";
  }),
}));

vi.mock("../services/asset", () => ({
  asset: {
    allWallets: vi.fn(),
    generateWallet: vi.fn(),
    initiateWithdrawal: vi.fn(),
    confirmWithdrawal: vi.fn(),
    networkFee: vi.fn(),
    minimumWithdrawal: vi.fn(),
  },
  assetKeys: {
    allWallets: () => ["all-wallets"],
    generateWalletKeys: (n: string, t: number) => ["generate-wallet", n, t],
  },
}));

vi.mock("../mocks", () => ({
  MOCK_MODE: {
    networkFee: false,
    minimumWithdrawal: false,
  },
}));

vi.mock("../mocks/mock-asset", () => ({
  mockAsset: {
    networkFee: vi.fn().mockResolvedValue({ data: { fee: "0.001" } }),
    minimumWithdrawal: vi.fn().mockResolvedValue({ data: { minimum: "0.01" } }),
  },
}));

vi.mock("../stores/user-store", () => ({
  useUserStore: vi.fn(() => ({
    user: { id: "user-1", email: "test@test.com", twoFaEnabled: false },
  })),
}));

vi.mock("../lib/notification-handler", () => ({
  successNotification: vi.fn(),
  errorNotification: vi.fn(),
}));

vi.mock("../lib/error-handler", () => ({
  errorMessageHandler: vi.fn(),
}));

vi.mock("@mantine/core", () => ({
  Button: ({ children }: any) => children,
}));

vi.mock("../components/settings/otp-input", () => ({
  OtpInput: () => null,
}));

vi.mock("../components/icons/modal-close", () => ({
  ModalClose: () => null,
}));

vi.mock("../components/transactions/authenticator-verify-modal", () => ({
  AuthenticatorVerificationModal: () => null,
}));

vi.mock("../components/login/verify-email-success", () => ({
  SuccessModal: () => null,
}));

vi.mock("../utils/constants", () => ({
  DEFAULT_MODAL_SETTINGS: { centered: true },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useWithdrawal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
        asset.allWallets.mockResolvedValue({ data: [] });
    asset.networkFee.mockResolvedValue({ data: { fee: "0.001" } });
    asset.minimumWithdrawal.mockResolvedValue({ data: { minimum: "0.01" } });
  });

  it("returns initial state correctly", () => {
    const { result } = renderHook(() => useWithdrawal(), {
      wrapper: createWrapper(),
    });

    expect(result.current.selectedCoin.symbol).toBe("");
    expect(result.current.selectedNetwork.symbol).toBe("");
    expect(result.current.networkFee).toBe(0);
    expect(result.current.minimumWithdrawal).toBe(0);
    expect(result.current.withdrawalPending).toBe(false);
    expect(result.current.sourceWallet).toBe("funding");
    expect(typeof result.current.handleWithdrawal).toBe("function");
  });

  it("setSelectedCoin updates selected coin", () => {
    const { result } = renderHook(() => useWithdrawal(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedCoin({
        name: "Bitcoin",
        image: "btc.png",
        symbol: "BTC",
        contractAddress: "",
      });
    });

    expect(result.current.selectedCoin.symbol).toBe("BTC");
    expect(result.current.selectedCoin.name).toBe("Bitcoin");
  });

  it("setSelectedNetwork updates selected network", () => {
    const { result } = renderHook(() => useWithdrawal(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedNetwork({
        name: "Bitcoin",
        symbol: "BTC",
        blockchain: "Bitcoin",
      });
    });

    expect(result.current.selectedNetwork.symbol).toBe("BTC");
  });

  it("setSourceWallet updates source wallet", () => {
    const { result } = renderHook(() => useWithdrawal(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSourceWallet("spot");
    });

    expect(result.current.sourceWallet).toBe("spot");
  });

  it("setWalletType updates wallet type", () => {
    const { result } = renderHook(() => useWithdrawal(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setWalletType(1);
    });

    expect(result.current.walletType).toBe(1);
  });

  it("handleWithdrawal shows error when no resolvedWalletId", async () => {
        const { result } = renderHook(() => useWithdrawal(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.handleWithdrawal();
    });

    expect(errorMessageHandler).toHaveBeenCalled();
  });

  it("handleWithdrawal calls initiateWithdrawal when wallet exists", async () => {
            asset.allWallets.mockResolvedValue({
      data: [{ id: "w1", chain: "bitcoin", address: "addr1" }],
    });
    asset.initiateWithdrawal.mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useWithdrawal(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedCoin({
        name: "Bitcoin",
        image: "btc.png",
        symbol: "BTC",
        contractAddress: "",
      });
      result.current.setSelectedNetwork({
        name: "Bitcoin",
        symbol: "BTC",
        blockchain: "Bitcoin",
      });
    });

    await waitFor(() => {
      expect(result.current.resolvedWalletId).toBe("w1");
    });

    await act(async () => {
      result.current.handleWithdrawal();
    });

    expect(asset.initiateWithdrawal).toHaveBeenCalled();
  });

  it("handleWithdrawal with 2FA enabled opens authenticator modal", async () => {
        useUserStore.mockReturnValue({
      user: { id: "user-1", email: "test@test.com", twoFaEnabled: true },
    });
            asset.allWallets.mockResolvedValue({
      data: [{ id: "w1", chain: "bitcoin", address: "addr1" }],
    });

    const { result } = renderHook(() => useWithdrawal(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedCoin({
        name: "Bitcoin",
        image: "btc.png",
        symbol: "BTC",
        contractAddress: "",
      });
      result.current.setSelectedNetwork({
        name: "Bitcoin",
        symbol: "BTC",
        blockchain: "Bitcoin",
      });
    });

    await waitFor(() => {
      expect(result.current.resolvedWalletId).toBe("w1");
    });

    await act(async () => {
      result.current.handleWithdrawal();
    });

    expect(modals.open).toHaveBeenCalled();
  });
});
