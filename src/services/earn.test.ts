vi.mock("../lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiRoot: { get: vi.fn(), post: vi.fn() },
}));

import { api } from "../lib/axios";
import { earnKeys, earnService } from "./earn";

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

describe("earnKeys", () => {
  it("declares the expected query keys", () => {
    expect(earnKeys.products).toEqual(["earn-products"]);
    expect(earnKeys.myPositions).toEqual(["earn-my-positions"]);
  });
});

describe("earnService.fetchProducts", () => {
  it("fetches the earn products", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await earnService.fetchProducts();
    expect(mockGet).toHaveBeenCalledWith("earn/products");
    expect(result).toEqual({ data: [] });
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("products failed"));
    await expect(earnService.fetchProducts()).rejects.toThrow("products failed");
  });
});

describe("earnService.subscribe", () => {
  it("posts the subscription payload", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    const result = await earnService.subscribe({ productId: "p1", amount: "100" });
    expect(mockPost).toHaveBeenCalledWith("earn/subscribe", { productId: "p1", amount: "100" });
    expect(result).toEqual({ success: true });
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("subscribe failed"));
    await expect(earnService.subscribe({ productId: "p1", amount: "10" })).rejects.toThrow(
      "subscribe failed"
    );
  });
});

describe("earnService.unstake", () => {
  it("posts the unstake payload", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    const result = await earnService.unstake({ subscriptionId: "s1" });
    expect(mockPost).toHaveBeenCalledWith("earn/unstake", { subscriptionId: "s1" });
    expect(result).toEqual({ success: true });
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("unstake failed"));
    await expect(earnService.unstake({ subscriptionId: "s1" })).rejects.toThrow("unstake failed");
  });
});

describe("earnService.myPositions", () => {
  it("fetches the user positions", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await earnService.myPositions();
    expect(mockGet).toHaveBeenCalledWith("earn/positions");
    expect(result).toEqual({ data: [] });
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("positions failed"));
    await expect(earnService.myPositions()).rejects.toThrow("positions failed");
  });
});