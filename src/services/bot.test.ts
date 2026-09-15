vi.mock("../lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiRoot: { get: vi.fn(), post: vi.fn() },
}));

import { api } from "../lib/axios";
import { MOCK_MODE } from "../mocks";
import { botKeys, botService } from "./bot";

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
  (MOCK_MODE as any).tradingBot = false;
});

afterEach(() => {
  (MOCK_MODE as any).tradingBot = false;
});

describe("botKeys", () => {
  it("declares the expected query keys", () => {
    expect(botKeys.tradingHistory("spot")).toEqual(["bot-history", "spot"]);
    expect(botKeys.tradingHistory("futures")).toEqual(["bot-history", "futures"]);
    expect(botKeys.activeBots("spot")).toEqual(["active-bots", "spot"]);
    expect(botKeys.activeBots("futures")).toEqual(["active-bots", "futures"]);
  });
});

describe("botService.createBot", () => {
  const botData = {
    type: "spot" as const,
    pair: "BTC/USDT",
    strategy: "DCA",
    investmentAmount: 100,
    asset: "BTC",
  };

  it("posts the bot payload and resolves with response.data", async () => {
    const payload = { data: { id: "bot-1" }, success: true };
    mockPost.mockResolvedValueOnce(axiosResponse(payload));
    const result = await botService.createBot(botData);
    expect(mockPost).toHaveBeenCalledWith("trading/bot/create", botData);
    expect(result).toEqual(payload);
  });

  it("returns a mock bot when MOCK_MODE.tradingBot is enabled", async () => {
    (MOCK_MODE as any).tradingBot = true;
    const result = await botService.createBot(botData);
    expect(mockPost).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, message: "Bot created successfully" });
    expect(result.data).toMatchObject({ type: "spot", pair: "BTC/USDT", status: "active" });
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("create bot failed"));
    await expect(botService.createBot(botData)).rejects.toThrow("create bot failed");
  });
});

describe("botService.tradingHistory", () => {
  it("posts the history payload and resolves with response.data", async () => {
    const payload = { data: [] };
    mockPost.mockResolvedValueOnce(axiosResponse(payload));
    const result = await botService.tradingHistory({ type: "spot", page: 1, limit: 20 });
    expect(mockPost).toHaveBeenCalledWith("trading/bot/trading_history", {
      type: "spot",
      page: 1,
      limit: 20,
    });
    expect(result).toEqual(payload);
  });

  it("returns mock history when MOCK_MODE.tradingBot is enabled", async () => {
    (MOCK_MODE as any).tradingBot = true;
    const result = await botService.tradingHistory({ type: "futures" });
    expect(mockPost).not.toHaveBeenCalled();
    expect(result).toMatchObject({ statusCode: 200, success: true });
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("history failed"));
    await expect(botService.tradingHistory({ type: "spot" })).rejects.toThrow("history failed");
  });
});

describe("botService.getActiveBots", () => {
  it("fetches active bots by type", async () => {
    const payload = { data: [{ id: "b1" }] };
    mockGet.mockResolvedValueOnce(axiosResponse(payload));
    const result = await botService.getActiveBots("spot");
    expect(mockGet).toHaveBeenCalledWith("trading/bot/list", { params: { type: "spot" } });
    expect(result).toEqual(payload);
  });

  it("returns mock bots when MOCK_MODE.tradingBot is enabled", async () => {
    (MOCK_MODE as any).tradingBot = true;
    const result = await botService.getActiveBots("spot");
    expect(mockGet).not.toHaveBeenCalled();
    expect(result).toMatchObject({ statusCode: 200, success: true });
    expect(result.data.every((b: any) => b.type === "spot")).toBe(true);
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("active bots failed"));
    await expect(botService.getActiveBots("futures")).rejects.toThrow("active bots failed");
  });
});

describe("botService.stopBot", () => {
  it("posts the botId to the stop endpoint", async () => {
    const payload = { success: true, message: "Bot stopped" };
    mockPost.mockResolvedValueOnce(axiosResponse(payload));
    const result = await botService.stopBot("bot-1");
    expect(mockPost).toHaveBeenCalledWith("trading/bot/stop", { botId: "bot-1" });
    expect(result).toEqual(payload);
  });

  it("returns a mock response when MOCK_MODE.tradingBot is enabled", async () => {
    (MOCK_MODE as any).tradingBot = true;
    const result = await botService.stopBot("bot-1");
    expect(mockPost).not.toHaveBeenCalled();
    expect(result).toMatchObject({ statusCode: 200, success: true, message: "Bot stopped" });
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("stop bot failed"));
    await expect(botService.stopBot("bot-1")).rejects.toThrow("stop bot failed");
  });
});