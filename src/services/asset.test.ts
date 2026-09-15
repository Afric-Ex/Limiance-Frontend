vi.mock("../lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiRoot: { get: vi.fn(), post: vi.fn() },
}));

import { api } from "../lib/axios";
import { asset, assetKeys } from "./asset";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);

const axiosResponse = (data: unknown, status = 200) => ({
  data,
  status,
  statusText: "OK",
  headers: {},
  config: {},
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("assetKeys", () => {
  it("declares the expected query keys", () => {
    expect(assetKeys.supportedChainsKey("trx")).toEqual(["assets", "supported-chains", "trx"]);
    expect(assetKeys.supportedTokensKey("btc")).toEqual(["assets", "supported-tokens", "btc"]);
    expect(assetKeys.generateWalletKeys("BTC", 1)).toEqual([
      "assets",
      "generate-wallet",
      "BTC",
      1,
    ]);
    expect(assetKeys.portfolio()).toEqual(["portfolio"]);
    expect(assetKeys.balance({ account: "spot" })).toEqual(["balance", { account: "spot" }]);
    expect(assetKeys.walletById("w1")).toEqual(["wallet-by-id", "w1"]);
  });
});

describe("asset.internalTransfer", () => {
  const internalTransferBody = {
    symbol: "BTC",
    amount: "0.5",
    fromBalance: "spot",
    toBalance: "funding",
    sourceWallet: "spot",
    destinationWallet: "funding",
    SourceWallet: "spot",
    DestinationWallet: "funding",
    source_wallet: "spot",
    destination_wallet: "funding",
  };

  it("posts the transfer payload with a 2FA header when totpCode is provided", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    const result = await asset.internalTransfer({
      symbol: "BTC",
      fromBalance: "spot",
      toBalance: "funding",
      amount: "0.5",
      totpCode: "111111",
    });
    expect(mockPost).toHaveBeenCalledWith("wallet/internal_transfer", internalTransferBody, {
      headers: { "X-2FA-Code": "111111" },
    });
    expect(result).toEqual({ success: true });
  });

  it("omits the config when totpCode is absent", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await asset.internalTransfer({
      symbol: "ETH",
      fromBalance: "spot",
      toBalance: "funding",
      amount: "2",
    });
    expect(mockPost).toHaveBeenCalledWith(
      "wallet/internal_transfer",
      expect.objectContaining({ symbol: "ETH", sourceWallet: "spot", destinationWallet: "funding" }),
      undefined
    );
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("internal transfer failed"));
    await expect(
      asset.internalTransfer({
        symbol: "BTC",
        fromBalance: "spot",
        toBalance: "funding",
        amount: "1",
      })
    ).rejects.toThrow("internal transfer failed");
  });
});

describe("asset.convertAsset", () => {
  it("posts uppercased symbols", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ data: {} }));
    const result = await asset.convertAsset({
      fromAsset: "usdt",
      toAsset: "ngn",
      amount: "100",
      sourceWallet: "spot",
    });
    expect(mockPost).toHaveBeenCalledWith("wallet/convert_asset", {
      fromSymbol: "USDT",
      toSymbol: "NGN",
      amount: "100",
    });
    expect(result).toEqual({ data: {} });
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("convert failed"));
    await expect(
      asset.convertAsset({ fromAsset: "USDT", toAsset: "NGN", amount: "1" })
    ).rejects.toThrow("convert failed");
  });
});

describe("asset.initiateWithdrawal", () => {
  const body = {
    walletId: "w1",
    walletID: "w1",
    WalletID: "w1",
    asset: "USDT",
    chain: "ERC20",
    amount: "1.5",
    destinationAddress: "0xabc",
    sourceWallet: "spot",
    tokenAddress: "0xtk",
    TokenAddress: "0xtk",
    contractAddress: "0xtk",
    idempotencyKey: "ik1",
    idempotency_key: "ik1",
  };

  it("posts the withdrawal payload with uppercase chain and optional config", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    const result = await asset.initiateWithdrawal({
      chain: "erc20",
      destinationAddress: "0xabc",
      amount: "1.5",
      asset: "USDT",
      sourceWallet: "spot",
      walletId: "w1",
      tokenAddress: "0xtk",
      idempotencyKey: "ik1",
      totpCode: "222222",
    });
    expect(mockPost).toHaveBeenCalledWith("wallet/initiate_withdrawal", body, {
      headers: { "X-2FA-Code": "222222" },
    });
    expect(result).toEqual({ success: true });
  });

  it("omits config and undefined optional fields when not provided", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await asset.initiateWithdrawal({
      chain: "trc20",
      destinationAddress: "addr",
      amount: "5",
      asset: "USDT",
    });
    expect(mockPost).toHaveBeenCalledWith(
      "wallet/initiate_withdrawal",
      expect.objectContaining({
        chain: "TRC20",
        destinationAddress: "addr",
        amount: "5",
        asset: "USDT",
        walletId: undefined,
        sourceWallet: undefined,
        tokenAddress: undefined,
        idempotencyKey: undefined,
      }),
      undefined
    );
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("withdrawal failed"));
    await expect(
      asset.initiateWithdrawal({ chain: "BTC", destinationAddress: "a", amount: "1", asset: "BTC" })
    ).rejects.toThrow("withdrawal failed");
  });
});

describe("asset.confirmWithdrawal", () => {
  const body = { otpCode: "123456", otp_code: "123456", otp: "123456" };

  it("posts the otp payload with a 2FA header when totpCode is provided", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    const result = await asset.confirmWithdrawal({ otpCode: "123456", totpCode: "333333" });
    expect(mockPost).toHaveBeenCalledWith("wallet/confirm_withdrawal", body, {
      headers: { "X-2FA-Code": "333333" },
    });
    expect(result).toEqual({ success: true });
  });

  it("omits the config when totpCode is absent", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await asset.confirmWithdrawal({ otpCode: "123456" });
    expect(mockPost).toHaveBeenCalledWith("wallet/confirm_withdrawal", body, undefined);
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("confirm failed"));
    await expect(asset.confirmWithdrawal({ otpCode: "123456" })).rejects.toThrow("confirm failed");
  });
});

describe("asset fetch endpoints", () => {
  it("fetchPortfolio fetches with a default limit", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: {} }));
    const result = await asset.fetchPortfolio();
    expect(mockGet).toHaveBeenCalledWith("wallet/portfolio", { params: { limit: 100 } });
    expect(result).toEqual({ data: {} });
  });

  it("balance fetches with optional params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ btc: 1 }));
    const result = await asset.balance({ account: "spot", symbol: "BTC" });
    expect(mockGet).toHaveBeenCalledWith("wallet/balance", {
      params: { account: "spot", symbol: "BTC" },
    });
    expect(result).toEqual({ btc: 1 });
  });

  it("balance fetches without params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({}));
    await asset.balance();
    expect(mockGet).toHaveBeenCalledWith("wallet/balance", { params: undefined });
  });

  it("transactionHistory fetches with params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await asset.transactionHistory({ page: 1, limit: 50, transaction_type: "deposit" });
    expect(mockGet).toHaveBeenCalledWith("wallet/user/transactions_history", {
      params: { page: 1, limit: 50, transaction_type: "deposit" },
    });
  });

  it("allTransactionHistory fetches all history", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await asset.allTransactionHistory();
    expect(mockGet).toHaveBeenCalledWith("wallet/all_transaction_history");
    expect(result).toEqual({ data: [] });
  });

  it("allWallets fetches wallets with params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await asset.allWallets({ page: 1, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith("wallet/all_wallets", {
      params: { page: 1, limit: 10 },
    });
  });

  it("balanceAllocations fetches allocations", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: {} }));
    const result = await asset.balanceAllocations();
    expect(mockGet).toHaveBeenCalledWith("wallet/balance_allocations");
    expect(result).toEqual({ data: {} });
  });

  it("fetchSupportedTokens fetches listed tokens with params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await asset.fetchSupportedTokens({ q: "btc", page: 1, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith("trading/listed_tokens", {
      params: { q: "btc", page: 1, limit: 10 },
    });
  });

  it("fetchSupportedChains fetches listed networks with params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await asset.fetchSupportedChains({ q: "erc" });
    expect(mockGet).toHaveBeenCalledWith("trading/listed_networks", { params: { q: "erc" } });
  });

  it("rejects when a fetch request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("portfolio failed"));
    await expect(asset.fetchPortfolio()).rejects.toThrow("portfolio failed");
  });
});

describe("asset.generateWallet", () => {
  it("posts the wallet payload with an uppercased chain", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ address: "0x1" }));
    const result = await asset.generateWallet({ chain: "eth", userid: "u9", walletType: 1 });
    expect(mockPost).toHaveBeenCalledWith("wallet/generate", {
      chain: "ETH",
      userid: "u9",
      walletType: 1,
    });
    expect(result).toEqual({ address: "0x1" });
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("generate failed"));
    await expect(
      asset.generateWallet({ chain: "BTC", userid: "u1", walletType: 0 })
    ).rejects.toThrow("generate failed");
  });
});

describe("asset fee endpoints", () => {
  it("networkFee fetches with asset and network params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ fee: "0.001" }));
    const result = await asset.networkFee({ chain: "ERC20", token: "USDT" });
    expect(mockGet).toHaveBeenCalledWith("wallet/fees", {
      params: { asset: "USDT", network: "ERC20" },
    });
    expect(result).toEqual({ fee: "0.001" });
  });

  it("minimumDeposit fetches with the asset param", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ min: "10" }));
    const result = await asset.minimumDeposit({ token: "USDT", chain: "TRC20" });
    expect(mockGet).toHaveBeenCalledWith("wallet/minimum_deposit", { params: { asset: "USDT" } });
    expect(result).toEqual({ min: "10" });
  });

  it("minimumWithdrawal fetches with the asset param", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ min: "5" }));
    const result = await asset.minimumWithdrawal({ token: "USDT" });
    expect(mockGet).toHaveBeenCalledWith("wallet/minimum_withdrawal", {
      params: { asset: "USDT" },
    });
    expect(result).toEqual({ min: "5" });
  });

  it("rejects when a fee request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("fee failed"));
    await expect(asset.networkFee({ chain: "BTC", token: "BTC" })).rejects.toThrow("fee failed");
  });
});

describe("asset external transfer", () => {
  it("getExternalTransferCode fetches the code for an asset", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ code: "x1" }));
    const result = await asset.getExternalTransferCode("USDT");
    expect(mockGet).toHaveBeenCalledWith("wallet/get_external_transfer_code/USDT");
    expect(result).toEqual({ code: "x1" });
  });

  it("externalTransfer posts the uppercase symbol and recipient mapping", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    const result = await asset.externalTransfer({
      toUserId: "u2",
      symbol: "btc",
      fromBalance: "spot",
      toBalance: "funding",
      amount: "0.1",
      releaseCode: "rc1",
    });
    expect(mockPost).toHaveBeenCalledWith("wallet/external_transfer", {
      symbol: "BTC",
      amount: "0.1",
      releaseCode: "rc1",
      toUserId: "u2",
      fromBalance: "spot",
      toBalance: "funding",
      recipientAccount: "u2",
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects when an external transfer request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("code failed"));
    await expect(asset.getExternalTransferCode("USDT")).rejects.toThrow("code failed");
  });
});

describe("asset deposits", () => {
  it("initiateDeposit posts the deposit payload", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ address: "0x1" }));
    const result = await asset.initiateDeposit({
      walletId: "w1",
      asset: "USDT",
      network: "TRC20",
    });
    expect(mockPost).toHaveBeenCalledWith("wallet/initiate_deposit", {
      walletId: "w1",
      asset: "USDT",
      network: "TRC20",
    });
    expect(result).toEqual({ address: "0x1" });
  });

  it("getWalletById fetches the wallet", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ id: "w1" }));
    const result = await asset.getWalletById("w1");
    expect(mockGet).toHaveBeenCalledWith("wallet/w1");
    expect(result).toEqual({ id: "w1" });
  });

  it("rejects when a deposit request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("deposit failed"));
    await expect(
      asset.initiateDeposit({ walletId: "w1", asset: "USDT" })
    ).rejects.toThrow("deposit failed");
  });
});