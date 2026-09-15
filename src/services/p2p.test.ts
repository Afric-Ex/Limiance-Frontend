vi.mock("../lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiRoot: { get: vi.fn(), post: vi.fn() },
}));

import { api, apiRoot } from "../lib/axios";
import { p2p, p2pKey } from "./p2p";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPatch = vi.mocked(api.patch);
const mockDelete = vi.mocked(api.delete);
const mockRootGet = vi.mocked(apiRoot.get);

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

describe("p2pKey", () => {
  it("declares the expected query keys", () => {
    expect(p2pKey.orderListing()).toEqual(["order-listing"]);
    expect(p2pKey.pendingOrders).toEqual(["pending-orders"]);
    expect(p2pKey.matchedOrder("m1")).toEqual(["matched-order", "m1"]);
    expect(p2pKey.chatMessages("c1")).toEqual(["chat-messages", "c1"]);
    expect(p2pKey.allMatchedOrders({ page: 1 })).toEqual(["all-matched-orders", { page: 1 }]);
  });
});

describe("p2p.fetchOrderListing", () => {
  it("fetches all orders with params", async () => {
    const response = axiosResponse({ data: [] });
    mockGet.mockResolvedValueOnce(response);
    const params = { type: "Buy", asset: "USDT", page: 1, limit: 20 };
    const result = await p2p.fetchOrderListing(params);
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/all_orders", { params });
    expect(result).toEqual(response);
  });

  it("fetches all orders without params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await p2p.fetchOrderListing();
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/all_orders", { params: undefined });
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("listing failed"));
    await expect(p2p.fetchOrderListing()).rejects.toThrow("listing failed");
  });
});

describe("p2p.userOrders", () => {
  it("fetches user orders with params", async () => {
    const response = axiosResponse({ data: [] });
    mockGet.mockResolvedValueOnce(response);
    const params = { status: "true" as const, page: 2 };
    const result = await p2p.userOrders(params);
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/get_user_orders", { params });
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("user orders failed"));
    await expect(p2p.userOrders()).rejects.toThrow("user orders failed");
  });
});

describe("p2p.pendingOrders", () => {
  it("fetches pending orders with params", async () => {
    const response = axiosResponse({ data: [] });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.pendingOrders({ type: "Sell", page: 1, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/pending_orders", {
      params: { type: "Sell", page: 1, limit: 10 },
    });
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("pending failed"));
    await expect(p2p.pendingOrders()).rejects.toThrow("pending failed");
  });
});

describe("p2p.advertiserInfo", () => {
  it("fetches advertiser info", async () => {
    const response = axiosResponse({ data: { verified: true } });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.advertiserInfo();
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/advertiser_info");
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("advertiser failed"));
    await expect(p2p.advertiserInfo()).rejects.toThrow("advertiser failed");
  });
});

describe("p2p.becomeAdvertiser", () => {
  it("fetches the become-advertiser flag", async () => {
    const response = axiosResponse({ success: true });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.becomeAdvertiser();
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/become_an_advertiser");
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("become failed"));
    await expect(p2p.becomeAdvertiser()).rejects.toThrow("become failed");
  });
});

describe("p2p.createOrder", () => {
  const orderData = {
    type: "Buy" as const,
    asset: "usdt",
    fiat: "NGN",
    fixedPrice: "100",
    paymentDuration: "15m",
    minQuantity: "50",
    maxQuantity: "500",
    numberLinked: true,
    emailLinked: false,
    daysSinceAccountCreation: "30",
    completedOrders: "10",
    allCompletedOrders: "20",
    selectedCountry: "NG",
    remark: "fast",
    paymentMethod: ["bank"],
    floatingPrice: false,
    quantity: "25",
  };

  it("posts a normalized payload with asset logo and numeric conversions", async () => {
    const response = axiosResponse({ data: [] });
    mockPost.mockResolvedValueOnce(response);
    const result = await p2p.createOrder(orderData);
    expect(mockPost).toHaveBeenCalledWith("trading/p2p/create_order", {
      ...orderData,
      active: true,
      assetLogo: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
      quantity: 25,
      minQuantity: 50,
      maxQuantity: 500,
      allCompletedOrders: 20,
      completedOrders: 10,
      daysSinceAccountCreation: 30,
      fixedPrice: 100,
    });
    expect(result).toEqual(response);
  });

  it("maps unknown assets to an empty logo and coerces empty values to null", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await p2p.createOrder({
      ...orderData,
      asset: "DOGE",
      quantity: "",
      fixedPrice: "",
      minQuantity: "",
      completedOrders: "",
    });
    expect(mockPost).toHaveBeenCalledWith("trading/p2p/create_order", {
      ...orderData,
      asset: "DOGE",
      active: true,
      assetLogo: "",
      quantity: null,
      minQuantity: null,
      maxQuantity: 500,
      allCompletedOrders: 20,
      completedOrders: null,
      daysSinceAccountCreation: 30,
      fixedPrice: null,
    });
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("create order failed"));
    await expect(p2p.createOrder(orderData)).rejects.toThrow("create order failed");
  });
});

describe("p2p.addPaymentMethod", () => {
  it("posts the bank payment method", async () => {
    const response = axiosResponse({ data: {} });
    mockPost.mockResolvedValueOnce(response);
    const data = { accountNumber: "0123", bankName: "GTBank", accountName: "Ada", method: "bank" };
    const result = await p2p.addPaymentMethod(data);
    expect(mockPost).toHaveBeenCalledWith("/trading/p2p/payment_methods/bank", data);
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("payment method failed"));
    await expect(
      p2p.addPaymentMethod({
        accountNumber: "1",
        bankName: "B",
        accountName: "A",
        method: "bank",
      })
    ).rejects.toThrow("payment method failed");
  });
});

describe("p2p.deletePaymentMethod", () => {
  it("deletes the payment method by id", async () => {
    const response = axiosResponse({ success: true });
    mockDelete.mockResolvedValueOnce(response);
    const result = await p2p.deletePaymentMethod("pm1");
    expect(mockDelete).toHaveBeenCalledWith("trading/p2p/payment_methods/pm1");
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockDelete.mockRejectedValueOnce(new Error("delete pm failed"));
    await expect(p2p.deletePaymentMethod("pm1")).rejects.toThrow("delete pm failed");
  });
});

describe("p2p.matchOrder", () => {
  it("posts the match payload", async () => {
    const response = axiosResponse({ data: {} });
    mockPost.mockResolvedValueOnce(response);
    const data = { orderId: "o1", paymentMethodId: "pm1", quantity: 50 };
    const result = await p2p.matchOrder(data);
    expect(mockPost).toHaveBeenCalledWith("trading/p2p/match_order", data);
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("match failed"));
    await expect(
      p2p.matchOrder({ orderId: "o1", paymentMethodId: "pm1", quantity: 1 })
    ).rejects.toThrow("match failed");
  });
});

describe("p2p.releaseOrder", () => {
  it("posts releaseCode and totpCode when provided", async () => {
    const response = axiosResponse({ data: {} });
    mockPost.mockResolvedValueOnce(response);
    const result = await p2p.releaseOrder({ id: "o1", releaseCode: "rc", totpCode: "123456" });
    expect(mockPost).toHaveBeenCalledWith("trading/p2p/release_order/o1", {
      releaseCode: "rc",
      totpCode: "123456",
    });
    expect(result).toEqual(response);
  });

  it("posts releaseCode only when totpCode is absent", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ data: {} }));
    await p2p.releaseOrder({ id: "o1", releaseCode: "rc" });
    expect(mockPost).toHaveBeenCalledWith("trading/p2p/release_order/o1", { releaseCode: "rc" });
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("release failed"));
    await expect(p2p.releaseOrder({ id: "o1", releaseCode: "rc" })).rejects.toThrow(
      "release failed"
    );
  });
});

describe("p2p payment methods & chats", () => {
  it("fetchPaymentMethod fetches the user payment methods", async () => {
    const response = axiosResponse({ data: [] });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.fetchPaymentMethod();
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/payment_methods");
    expect(result).toEqual(response);
  });

  it("fetchChatMessages fetches messages for a chat", async () => {
    const response = axiosResponse({ data: [] });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.fetchChatMessages("c1");
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/chats/messages/c1");
    expect(result).toEqual(response);
  });

  it("sendMessage posts the content to a chat", async () => {
    const response = axiosResponse({ data: {} });
    mockPost.mockResolvedValueOnce(response);
    const result = await p2p.sendMessage({ chatId: "c1", content: "hello" });
    expect(mockPost).toHaveBeenCalledWith("trading/p2p/chats/send/c1", { content: "hello" });
    expect(result).toEqual(response);
  });

  it("fetchChats fetches chats with params", async () => {
    const response = axiosResponse({ data: [] });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.fetchChats({ page: 1, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/chats", { params: { page: 1, limit: 10 } });
    expect(result).toEqual(response);
  });

  it("rejects when a chat request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("chat failed"));
    await expect(p2p.sendMessage({ chatId: "c1", content: "hi" })).rejects.toThrow("chat failed");
  });
});

describe("p2p.getOrderById / getMatchedOrder (root fallback)", () => {
  it("getOrderById returns the api response directly", async () => {
    const response = axiosResponse({ data: {} });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.getOrderById("o1");
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/get_order_by_id/o1");
    expect(mockRootGet).not.toHaveBeenCalled();
    expect(result).toEqual(response);
  });

  it("getMatchedOrder returns the api response directly", async () => {
    const response = axiosResponse({ data: {} });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.getMatchedOrder("m1");
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/matched_order/m1");
    expect(mockRootGet).not.toHaveBeenCalled();
    expect(result).toEqual(response);
  });

  it("falls back to apiRoot on a 400 response", async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 400 } });
    const fallback = axiosResponse({ data: { from: "root" } });
    mockRootGet.mockResolvedValueOnce(fallback);
    const result = await p2p.getOrderById("o1");
    expect(mockRootGet).toHaveBeenCalledWith("trading/p2p/get_order_by_id/o1");
    expect(result).toEqual(fallback);
  });

  it("falls back to apiRoot on a 404 response", async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    const fallback = axiosResponse({ data: {} });
    mockRootGet.mockResolvedValueOnce(fallback);
    const result = await p2p.getMatchedOrder("m1");
    expect(mockRootGet).toHaveBeenCalledWith("trading/p2p/matched_order/m1");
    expect(result).toEqual(fallback);
  });

  it("rethrows on non-400/404 statuses without calling apiRoot", async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 500 } });
    await expect(p2p.getOrderById("o1")).rejects.toMatchObject({ response: { status: 500 } });
    expect(mockRootGet).not.toHaveBeenCalled();
  });

  it("rethrows network errors without calling apiRoot", async () => {
    mockGet.mockRejectedValueOnce(new Error("network down"));
    await expect(p2p.getOrderById("o1")).rejects.toThrow("network down");
    expect(mockRootGet).not.toHaveBeenCalled();
  });
});

describe("p2p matched orders", () => {
  it("getAllMatchedOrders fetches matched orders with params", async () => {
    const response = axiosResponse({ data: [] });
    mockGet.mockResolvedValueOnce(response);
    const params = { page: 1, limit: 20, status: "active" as const };
    const result = await p2p.getAllMatchedOrders(params);
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/all_matched_orders", { params });
    expect(result).toEqual(response);
  });

  it("updateMatchedOrder patches the matched order", async () => {
    const response = axiosResponse({ data: {} });
    mockPatch.mockResolvedValueOnce(response);
    const data = { orderMatchId: "m1", status: "confirmed" as const };
    const result = await p2p.updateMatchedOrder(data);
    expect(mockPatch).toHaveBeenCalledWith("trading/p2p/update_matched_order", data);
    expect(result).toEqual(response);
  });

  it("getReleaseCode fetches the release code", async () => {
    const response = axiosResponse({ data: { sent: true } });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.getReleaseCode("o1");
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/get_release_order_code/o1");
    expect(result).toEqual(response);
  });

  it("rejects when a matched-order request fails", async () => {
    mockPatch.mockRejectedValueOnce(new Error("update match failed"));
    await expect(
      p2p.updateMatchedOrder({ orderMatchId: "m1", status: "confirmed" })
    ).rejects.toThrow("update match failed");
  });
});

describe("p2p reviews & advertisements", () => {
  it("addReview posts the review payload", async () => {
    const response = axiosResponse({ data: {} });
    mockPost.mockResolvedValueOnce(response);
    const data = { orderMatchId: "m1", rating: 5, review: "great" };
    const result = await p2p.addReview(data);
    expect(mockPost).toHaveBeenCalledWith("trading/p2p/add_review", data);
    expect(result).toEqual(response);
  });

  it("deactivateAllOrders fetches the deactivate endpoint", async () => {
    const response = axiosResponse({ success: true });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.deactivateAllOrders();
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/deactivate_orders");
    expect(result).toEqual(response);
  });

  it("reactivateAllOrders fetches the reactivate endpoint", async () => {
    const response = axiosResponse({ success: true });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.reactivateAllOrders();
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/reactivate_orders");
    expect(result).toEqual(response);
  });

  it("deactivateSingleOrder fetches the deactivate endpoint by id", async () => {
    const response = axiosResponse({ success: true });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.deactivateSingleOrder("o1");
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/deactivate_single_order/o1");
    expect(result).toEqual(response);
  });

  it("getDisputedOrders fetches disputed orders with params", async () => {
    const response = axiosResponse({ data: [] });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.getDisputedOrders({ page: 1, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith("trading/p2p/advertiser_disputed_orders", {
      params: { page: 1, limit: 10 },
    });
    expect(result).toEqual(response);
  });

  it("getSellerPaymentMethodsById fetches payment methods for a seller", async () => {
    const response = axiosResponse({ data: [] });
    mockGet.mockResolvedValueOnce(response);
    const result = await p2p.getSellerPaymentMethodsById("seller1", { query: "gtbank" });
    expect(mockGet).toHaveBeenCalledWith(
      "trading/p2p/get_payment_by_method_by_id/seller1",
      { params: { query: "gtbank" } }
    );
    expect(result).toEqual(response);
  });

  it("rejects when a review request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("review failed"));
    await expect(p2p.addReview({ orderMatchId: "m1", rating: 3 })).rejects.toThrow(
      "review failed"
    );
  });
});