vi.mock("../lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiRoot: { get: vi.fn(), post: vi.fn() },
}));

import { api } from "../lib/axios";
import { tradingKeys, tradingService } from "./trading";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockPatch = vi.mocked(api.patch);
const mockDelete = vi.mocked(api.delete);

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

describe("tradingKeys", () => {
  it("declares the expected query keys", () => {
    expect(tradingKeys.orderBooks).toEqual(["order-books"]);
    expect(tradingKeys.openOrders("BTC/USDT")).toEqual(["open-orders", "BTC/USDT"]);
    expect(tradingKeys.orderHistory({ page: 1 })).toEqual(["order-history", { page: 1 }]);
    expect(tradingKeys.klineData("BTCUSDT", "1h")).toEqual(["kline", "BTCUSDT", "1h"]);
    expect(tradingKeys.listedTokens({ q: "btc" })).toEqual(["listed-tokens", { q: "btc" }]);
  });
});

describe("orderBooks", () => {
  it("fetches the order books", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: {} }));
    const result = await tradingService.orderBooks();
    expect(mockGet).toHaveBeenCalledWith("trading/order_books");
    expect(result).toEqual({ data: {} });
  });

  it("rejects on failure", async () => {
    mockGet.mockRejectedValueOnce(new Error("boom"));
    await expect(tradingService.orderBooks()).rejects.toThrow("boom");
  });
});

describe("placeLimitOrder", () => {
  it("posts a buy limit order with slash symbol and uppercase side", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeLimitOrder({
      side: "buy",
      base: "btc",
      quote: "usdt",
      type: "buy_limit",
      price: 100,
      quantity: 0.5,
    });
    expect(mockPost).toHaveBeenCalledWith("trading/spot/buy_limit", {
      symbol: "BTC/USDT",
      side: "BUY",
      type: "LIMIT",
      quantity: 0.5,
      price: 100,
    });
  });

  it("posts a sell limit order to the sell endpoint", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeLimitOrder({
      side: "sell",
      base: "BTC",
      quote: "USDT",
      type: "sell_limit",
      price: 99,
      quantity: 1,
    });
    expect(mockPost).toHaveBeenCalledWith("trading/spot/sell_limit", {
      symbol: "BTC/USDT",
      side: "SELL",
      type: "LIMIT",
      quantity: 1,
      price: 99,
    });
  });

  it("coerces numeric strings", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeLimitOrder({
      side: "buy",
      base: "ETH",
      quote: "USDT",
      type: "buy_limit",
      price: "3000" as any,
      quantity: "0.25" as any,
    });
    expect(mockPost).toHaveBeenCalledWith(
      "trading/spot/buy_limit",
      expect.objectContaining({ quantity: 0.25, price: 3000 })
    );
  });

  it("rejects on failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("limit failed"));
    await expect(
      tradingService.placeLimitOrder({
        side: "buy",
        base: "BTC",
        quote: "USDT",
        type: "buy_limit",
        price: 1,
        quantity: 1,
      })
    ).rejects.toThrow("limit failed");
  });
});

describe("placeStopOrder", () => {
  it("posts a buy stop order with price and stopPrice", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeStopOrder({
      side: "buy",
      base: "BTC",
      quote: "USDT",
      type: "buy_stop",
      stopPrice: 110,
      quantity: 2,
    });
    expect(mockPost).toHaveBeenCalledWith("trading/spot/buy_stop", {
      symbol: "BTC/USDT",
      side: "BUY",
      type: "STOP",
      quantity: 2,
      price: 110,
      stopPrice: 110,
    });
  });

  it("posts a sell stop order to the sell endpoint", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeStopOrder({
      side: "sell",
      base: "BTC",
      quote: "USDT",
      type: "sell_stop",
      stopPrice: 90,
      quantity: 2.5,
    });
    expect(mockPost).toHaveBeenCalledWith("trading/spot/sell_stop", {
      symbol: "BTC/USDT",
      side: "SELL",
      type: "STOP",
      quantity: 2.5,
      price: 90,
      stopPrice: 90,
    });
  });

  it("rejects on failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("stop failed"));
    await expect(
      tradingService.placeStopOrder({
        side: "buy",
        base: "BTC",
        quote: "USDT",
        type: "buy_stop",
        stopPrice: 1,
        quantity: 1,
      })
    ).rejects.toThrow("stop failed");
  });
});

describe("placeMarketOrder", () => {
  it("posts a buy market order with price when positive", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeMarketOrder({
      side: "buy",
      base: "BTC",
      quote: "USDT",
      type: "market",
      quantity: 0.1,
      price: 67000,
    });
    expect(mockPost).toHaveBeenCalledWith("trading/spot/buy", {
      symbol: "BTC/USDT",
      side: "BUY",
      type: "MARKET",
      quantity: 0.1,
      price: 67000,
    });
  });

  it("posts a sell market order without price when absent", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeMarketOrder({
      side: "sell",
      base: "ETH",
      quote: "USDT",
      type: "market",
      quantity: 3,
    });
    expect(mockPost).toHaveBeenCalledWith("trading/spot/sell", {
      symbol: "ETH/USDT",
      side: "SELL",
      type: "MARKET",
      quantity: 3,
    });
  });

  it("omits price when zero", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeMarketOrder({
      side: "buy",
      base: "ETH",
      quote: "USDT",
      type: "market",
      quantity: 3,
      price: 0,
    });
    expect(mockPost).toHaveBeenCalledWith(
      "trading/spot/buy",
      expect.not.objectContaining({ price: expect.anything() })
    );
  });

  it("rejects on failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("market failed"));
    await expect(
      tradingService.placeMarketOrder({
        side: "buy",
        base: "BTC",
        quote: "USDT",
        type: "market",
        quantity: 1,
      })
    ).rejects.toThrow("market failed");
  });
});

describe("closeSpotOrder", () => {
  it("posts orderId with symbol when provided", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.closeSpotOrder("o1", "BTC/USDT");
    expect(mockPost).toHaveBeenCalledWith("trading/spot/close_order", {
      orderId: "o1",
      symbol: "BTC/USDT",
    });
  });

  it("posts orderId only when symbol is absent", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.closeSpotOrder("o1");
    expect(mockPost).toHaveBeenCalledWith("trading/spot/close_order", { orderId: "o1" });
  });

  it("rejects on failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("close failed"));
    await expect(tradingService.closeSpotOrder("o1")).rejects.toThrow("close failed");
  });
});

describe("spotOrderStatus", () => {
  it("fetches the transactional order by id", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ status: "filled" }));
    const result = await tradingService.spotOrderStatus("tx1");
    expect(mockGet).toHaveBeenCalledWith("trading/transactions/spot/tx1");
    expect(result).toEqual({ status: "filled" });
  });

  it("rejects on failure", async () => {
    mockGet.mockRejectedValueOnce(new Error("status failed"));
    await expect(tradingService.spotOrderStatus("tx1")).rejects.toThrow("status failed");
  });
});

describe("margin account", () => {
  it("getMarginAccount fetches the margin account", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ balance: 100 }));
    const result = await tradingService.getMarginAccount();
    expect(mockGet).toHaveBeenCalledWith("trading/margin/account");
    expect(result).toEqual({ balance: 100 });
  });

  it("createMarginAccount posts to the margin account endpoint", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.createMarginAccount();
    expect(mockPost).toHaveBeenCalledWith("trading/margin/account");
  });

  it("rejects on failure", async () => {
    mockGet.mockRejectedValueOnce(new Error("margin account failed"));
    await expect(tradingService.getMarginAccount()).rejects.toThrow("margin account failed");
  });
});

describe("placeMarginLimitOrder", () => {
  it("posts a buy margin limit order with compact symbol and stringified values", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeMarginLimitOrder({
      side: "buy",
      base: "btc",
      quote: "usdt",
      type: "buy_limit",
      price: 100,
      quantity: 5,
      leverage: 10,
    });
    expect(mockPost).toHaveBeenCalledWith("trading/margin/buy_limit", {
      symbol: "BTCUSDT",
      side: "BUY",
      type: "LIMIT",
      quantity: "5",
      price: "100",
      leverage: 10,
    });
  });

  it("posts a sell margin limit order to the sell endpoint", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeMarginLimitOrder({
      side: "sell",
      base: "ETH",
      quote: "USDT",
      type: "sell_limit",
      price: 3000,
      quantity: 1,
      leverage: 5,
    });
    expect(mockPost).toHaveBeenCalledWith("trading/margin/sell_limit", {
      symbol: "ETHUSDT",
      side: "SELL",
      type: "LIMIT",
      quantity: "1",
      price: "3000",
      leverage: 5,
    });
  });

  it("rejects on failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("margin limit failed"));
    await expect(
      tradingService.placeMarginLimitOrder({
        side: "buy",
        base: "BTC",
        quote: "USDT",
        type: "buy_limit",
        price: 1,
        quantity: 1,
        leverage: 2,
      })
    ).rejects.toThrow("margin limit failed");
  });
});

describe("placeMarginMarketOrder", () => {
  it("posts a buy margin market order with price when positive", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeMarginMarketOrder({
      side: "buy",
      base: "BTC",
      quote: "USDT",
      type: "market",
      quantity: 0.5,
      leverage: 3,
      price: 66000,
    });
    expect(mockPost).toHaveBeenCalledWith("trading/margin/buy", {
      symbol: "BTCUSDT",
      side: "BUY",
      type: "MARKET",
      quantity: "0.5",
      leverage: 3,
      price: "66000",
    });
  });

  it("omits price when not positive", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeMarginMarketOrder({
      side: "sell",
      base: "ETH",
      quote: "USDT",
      type: "market",
      quantity: 2,
      leverage: 3,
      price: 0,
    });
    expect(mockPost).toHaveBeenCalledWith(
      "trading/margin/sell",
      expect.not.objectContaining({ price: expect.anything() })
    );
  });

  it("rejects on failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("margin market failed"));
    await expect(
      tradingService.placeMarginMarketOrder({
        side: "buy",
        base: "BTC",
        quote: "USDT",
        type: "market",
        quantity: 1,
        leverage: 2,
      })
    ).rejects.toThrow("margin market failed");
  });
});

describe("placeMarginStopOrder", () => {
  it("posts a buy margin stop order", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeMarginStopOrder({
      side: "buy",
      base: "BTC",
      quote: "USDT",
      type: "buy_stop",
      stopPrice: 70,
      quantity: 4,
      leverage: 8,
    });
    expect(mockPost).toHaveBeenCalledWith("trading/margin/buy_stop", {
      symbol: "BTCUSDT",
      side: "BUY",
      type: "STOP",
      quantity: "4",
      stopPrice: "70",
      leverage: 8,
    });
  });

  it("rejects on failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("margin stop failed"));
    await expect(
      tradingService.placeMarginStopOrder({
        side: "sell",
        base: "ETH",
        quote: "USDT",
        type: "sell_stop",
        stopPrice: 2900,
        quantity: 1,
        leverage: 2,
      })
    ).rejects.toThrow("margin stop failed");
  });
});

describe("closeMarginOrder", () => {
  it("posts orderId with normalized symbol when provided", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.closeMarginOrder("o2", "btc/usdt");
    expect(mockPost).toHaveBeenCalledWith("trading/margin/close_order", {
      orderId: "o2",
      symbol: "BTCUSDT",
    });
  });

  it("posts orderId only when symbol is absent", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.closeMarginOrder("o2");
    expect(mockPost).toHaveBeenCalledWith("trading/margin/close_order", { orderId: "o2" });
  });

  it("rejects on failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("margin close failed"));
    await expect(tradingService.closeMarginOrder("o2")).rejects.toThrow("margin close failed");
  });
});

describe("margin balance & positions", () => {
  it("marginBalance fetches the margin balance", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ consolidated: {} }));
    const result = await tradingService.marginBalance();
    expect(mockGet).toHaveBeenCalledWith("trading/margin/balance");
    expect(result).toEqual({ consolidated: {} });
  });

  it("marginPositions fetches the margin positions", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await tradingService.marginPositions();
    expect(mockGet).toHaveBeenCalledWith("trading/margin/positions");
    expect(result).toEqual({ data: [] });
  });

  it("rejects on failure", async () => {
    mockGet.mockRejectedValueOnce(new Error("margin balance failed"));
    await expect(tradingService.marginBalance()).rejects.toThrow("margin balance failed");
  });
});

describe("setMarginLeverage / setMarginMode", () => {
  it("setMarginLeverage puts max_leverage", async () => {
    mockPut.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.setMarginLeverage(25);
    expect(mockPut).toHaveBeenCalledWith("trading/margin/leverage", { max_leverage: 25 });
  });

  it("setMarginMode puts the margin mode", async () => {
    mockPut.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.setMarginMode("isolated");
    expect(mockPut).toHaveBeenCalledWith("trading/margin/mode", { mode: "isolated" });
  });

  it("rejects on failure", async () => {
    mockPut.mockRejectedValueOnce(new Error("leverage failed"));
    await expect(tradingService.setMarginLeverage(10)).rejects.toThrow("leverage failed");
  });
});

describe("borrowMargin / repayMargin", () => {
  it("borrowMargin posts the borrow payload", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.borrowMargin({ asset: "USDT", amount: 100 });
    expect(mockPost).toHaveBeenCalledWith("trading/margin/borrow", { asset: "USDT", amount: 100 });
  });

  it("repayMargin posts the repay payload", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.repayMargin({ asset: "USDT", amount: 50 });
    expect(mockPost).toHaveBeenCalledWith("trading/margin/repay", { asset: "USDT", amount: 50 });
  });

  it("rejects on failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("borrow failed"));
    await expect(tradingService.borrowMargin({ asset: "USDT", amount: 1 })).rejects.toThrow(
      "borrow failed"
    );
  });
});

describe("margin orders & history", () => {
  it("marginOrderHistory fetches closed margin orders", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await tradingService.marginOrderHistory();
    expect(mockGet).toHaveBeenCalledWith("trading/margin/orders", { params: { status: "closed" } });
    expect(result).toEqual({ data: [] });
  });

  it("fetchMarginOpenOrders fetches open orders", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await tradingService.fetchMarginOpenOrders();
    expect(mockGet).toHaveBeenCalledWith("trading/margin/orders", { params: { status: "open" } });
    expect(result).toEqual({ data: [] });
  });

  it("fetchMarginOpenOrders filters open orders by pair", async () => {
    mockGet.mockResolvedValueOnce(
      axiosResponse({
        data: [
          { pair: "BTC/USDT", id: "a" },
          { symbol: "ETHUSDT", id: "b" },
          { base: "SOL", quote: "USDT", id: "c" },
        ],
      })
    );
    const result = await tradingService.fetchMarginOpenOrders({ pair: "BTC/USDT" });
    expect(result.data).toEqual([{ pair: "BTC/USDT", id: "a" }]);
  });

  it("fetchMarginOpenOrders passes through non-array data", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ message: "no data" }));
    const result = await tradingService.fetchMarginOpenOrders({ pair: "BTC/USDT" });
    expect(result).toEqual({ message: "no data" });
  });

  it("marginBorrowHistory fetches borrow history", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await tradingService.marginBorrowHistory();
    expect(mockGet).toHaveBeenCalledWith("trading/margin/borrow_history");
    expect(result).toEqual({ data: [] });
  });

  it("marginLiquidationHistory fetches liquidation history", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await tradingService.marginLiquidationHistory();
    expect(mockGet).toHaveBeenCalledWith("trading/margin/liquidation_history");
    expect(result).toEqual({ data: [] });
  });

  it("placeMarginOCOOrder posts the OCO payload", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    const data = {
      symbol: "BTCUSDT",
      order_side: "buy",
      tp_trigger_price: "70000",
      sl_trigger_price: "60000",
      quantity: "1",
      tp_limit_price: "71000",
      sl_limit_price: "59000",
    };
    await tradingService.placeMarginOCOOrder(data);
    expect(mockPost).toHaveBeenCalledWith("trading/margin/oco", data);
  });

  it("rejects on failure", async () => {
    mockGet.mockRejectedValueOnce(new Error("margin history failed"));
    await expect(tradingService.marginOrderHistory()).rejects.toThrow("margin history failed");
  });
});

describe("placeFuturesOrder", () => {
  const base = {
    pair: "BTCUSD",
    quantity: 1,
    leverage: 5,
  };

  it("posts a market order with defaults", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeFuturesOrder({ ...base, side: "buy", type: "market" });
    expect(mockPost).toHaveBeenCalledWith("trading/futures/place_order", {
      pair: "BTCUSD",
      side: "LONG",
      type: "market",
      quantity: 1,
      leverage: 5,
      marginMode: "cross",
    });
  });

  it("posts a sell limit order with price and configured margin mode", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeFuturesOrder({
      ...base,
      side: "sell",
      type: "limit",
      price: 60000,
      marginMode: "isolated",
      takeProfit: 65000,
      stopLoss: 55000,
    });
    expect(mockPost).toHaveBeenCalledWith("trading/futures/place_order", {
      pair: "BTCUSD",
      side: "SHORT",
      type: "limit",
      quantity: 1,
      leverage: 5,
      marginMode: "isolated",
      price: 60000,
      takeProfit: 65000,
      stopLoss: 55000,
    });
  });

  it("maps stop types and forwards stopPrice as price", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeFuturesOrder({
      ...base,
      side: "buy",
      type: "stop_buy",
      stopPrice: 70000,
    });
    expect(mockPost).toHaveBeenCalledWith(
      "trading/futures/place_order",
      expect.objectContaining({ type: "stop", price: 70000 })
    );
  });

  it("omits price for market orders", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.placeFuturesOrder({ ...base, side: "buy", type: "market", price: 500 });
    expect(mockPost).toHaveBeenCalledWith(
      "trading/futures/place_order",
      expect.not.objectContaining({ price: expect.anything() })
    );
  });

  it("rejects on failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("futures order failed"));
    await expect(
      tradingService.placeFuturesOrder({ ...base, side: "buy", type: "market" })
    ).rejects.toThrow("futures order failed");
  });
});

describe("futures configuration", () => {
  it("setFuturesMode posts the margin mode", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.setFuturesMode("cross");
    expect(mockPost).toHaveBeenCalledWith("trading/futures/set_margin_mode", { mode: "cross" });
  });

  it("setFuturesLeverage posts the leverage", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.setFuturesLeverage(20);
    expect(mockPost).toHaveBeenCalledWith("trading/futures/set_leverage", { leverage: 20 });
  });

  it("acceptFutures posts to users/accept_futures", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.acceptFutures();
    expect(mockPost).toHaveBeenCalledWith("users/accept_futures");
  });

  it("rejects on failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("futures config failed"));
    await expect(tradingService.setFuturesLeverage(10)).rejects.toThrow("futures config failed");
  });
});

describe("futures orders & history", () => {
  it("fetchFuturesOpenOrders fetches and filters open orders", async () => {
    mockGet.mockResolvedValueOnce(
      axiosResponse({
        data: [
          { pair: "BTC/USDT", id: "f1" },
          { pair: "ETH/USDT", id: "f2" },
        ],
      })
    );
    const result = await tradingService.fetchFuturesOpenOrders({ pair: "BTC/USDT" });
    expect(mockGet).toHaveBeenCalledWith("trading/futures/orders", { params: { status: "open" } });
    expect(result.data.map((o: any) => o.id)).toEqual(["f1"]);
  });

  it("futuresOrderHistory fetches and filters closed orders", async () => {
    mockGet.mockResolvedValueOnce(
      axiosResponse({ data: [{ pair: "ETH/USDT", id: "h1" }] })
    );
    const result = await tradingService.futuresOrderHistory({ pair: "ETH/USDT" });
    expect(mockGet).toHaveBeenCalledWith("trading/futures/orders", {
      params: { status: "closed" },
    });
    expect(result.data).toEqual([{ pair: "ETH/USDT", id: "h1" }]);
  });

  it("futuresOrderHistory passes through non-array data", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ message: "empty" }));
    const result = await tradingService.futuresOrderHistory({ pair: "BTC/USDT" });
    expect(result).toEqual({ message: "empty" });
  });

  it("futuresTradeHistory fetches trade history with pair param", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await tradingService.futuresTradeHistory({ pair: "BTC/USDT" });
    expect(mockGet).toHaveBeenCalledWith("trading/futures/trade_history", {
      params: { pair: "BTC/USDT" },
    });
    expect(result).toEqual({ data: [] });
  });

  it("futuresTradeHistory passes through non-array data", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ message: "empty" }));
    const result = await tradingService.futuresTradeHistory({ pair: "BTC/USDT" });
    expect(result).toEqual({ message: "empty" });
  });

  it("closeFuturesPosition posts to the close_position endpoint", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.closeFuturesPosition({ positionId: "pos1" });
    expect(mockPost).toHaveBeenCalledWith("trading/futures/close_position/pos1");
  });

  it("partialCloseFuturesPosition posts close_quantity", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.partialCloseFuturesPosition({ positionId: "pos1", close_quantity: "0.05" });
    expect(mockPost).toHaveBeenCalledWith("trading/futures/partial_close/pos1", {
      close_quantity: "0.05",
    });
  });

  it("updateFuturesPositionTPSL patches take profit and stop loss", async () => {
    mockPatch.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.updateFuturesPositionTPSL({
      positionId: "pos1",
      take_profit_price: "65000",
      stop_loss_price: "55000",
    });
    expect(mockPatch).toHaveBeenCalledWith("trading/futures/position/pos1/tpsl", {
      take_profit_price: "65000",
      stop_loss_price: "55000",
    });
  });

  it("cancelFuturesOrder deletes the order", async () => {
    mockDelete.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.cancelFuturesOrder("fo1");
    expect(mockDelete).toHaveBeenCalledWith("trading/futures/order/fo1");
  });

  it("editFuturesOrder patches the body without orderId", async () => {
    mockPatch.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.editFuturesOrder({ orderId: "fo1", price: "65000", quantity: "2" });
    expect(mockPatch).toHaveBeenCalledWith("trading/futures/order/fo1", {
      price: "65000",
      quantity: "2",
    });
  });

  it("rejects on failure", async () => {
    mockGet.mockRejectedValueOnce(new Error("futures history failed"));
    await expect(tradingService.fetchFuturesOpenOrders()).rejects.toThrow("futures history failed");
  });
});

describe("spot orders & history", () => {
  it("fetchOpenOrders fetches open orders without params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await tradingService.fetchOpenOrders();
    expect(mockGet).toHaveBeenCalledWith("trading/spot/orders", { params: { status: "open" } });
    expect(result).toEqual({ data: [] });
  });

  it("fetchOpenOrders filters by pair when provided", async () => {
    mockGet.mockResolvedValueOnce(
      axiosResponse({
        data: [
          { pair: "BTC/USDT", id: "s1" },
          { symbol: "ETHUSDT", id: "s2" },
        ],
      })
    );
    const result = await tradingService.fetchOpenOrders({ pair: "BTC/USDT" });
    expect(result.data.map((o: any) => o.id)).toEqual(["s1"]);
  });

  it("cancelSpotOrder deletes the order", async () => {
    mockDelete.mockResolvedValueOnce(axiosResponse({ success: true }));
    await tradingService.cancelSpotOrder("so1");
    expect(mockDelete).toHaveBeenCalledWith("trading/spot/order/so1");
  });

  it("spotOrderHistory fetches closed orders with merged params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await tradingService.spotOrderHistory({ page: 2, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith("trading/spot/orders", {
      params: { status: "closed", page: 2, limit: 10 },
    });
  });

  it("spotOrderHistory works without params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await tradingService.spotOrderHistory();
    expect(mockGet).toHaveBeenCalledWith("trading/spot/orders", { params: { status: "closed" } });
  });

  it("fetchSpotOrderById fetches the transactional order", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ id: "tx9" }));
    const result = await tradingService.fetchSpotOrderById("tx9");
    expect(mockGet).toHaveBeenCalledWith("trading/transactions/spot/tx9");
    expect(result).toEqual({ id: "tx9" });
  });

  it("spotRecentTrades fetches recent trades with params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await tradingService.spotRecentTrades({ symbol: "BTC/USDT" });
    expect(mockGet).toHaveBeenCalledWith("trading/spot/recent_trades", {
      params: { symbol: "BTC/USDT" },
    });
  });

  it("rejects on failure", async () => {
    mockDelete.mockRejectedValueOnce(new Error("spot order failed"));
    await expect(tradingService.cancelSpotOrder("so1")).rejects.toThrow("spot order failed");
  });
});

describe("market data", () => {
  it("klineData fetches historical klines with defaults", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await tradingService.klineData({ symbol: "BTCUSDT", interval: "1h" });
    expect(mockGet).toHaveBeenCalledWith("trading/kline/historical", {
      params: {
        symbol: "BTCUSDT",
        "start-time": "",
        "end-time": "",
        interval: "1h",
        limit: 500,
      },
    });
  });

  it("klineData forwards limit and time window", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await tradingService.klineData({
      symbol: "ETHUSDT",
      interval: "4h",
      limit: 100,
      startTime: "2024-01-01",
      endTime: "2024-02-01",
    });
    expect(mockGet).toHaveBeenCalledWith("trading/kline/historical", {
      params: {
        symbol: "ETHUSDT",
        "start-time": "2024-01-01",
        "end-time": "2024-02-01",
        interval: "4h",
        limit: 100,
      },
    });
  });

  it("gainersLosers uses default limit of 100", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await tradingService.gainersLosers();
    expect(mockGet).toHaveBeenCalledWith("trading/24_hours_movers", { params: { limit: 100 } });
  });

  it("gainersLosers forwards a custom limit", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await tradingService.gainersLosers(50);
    expect(mockGet).toHaveBeenCalledWith("trading/24_hours_movers", { params: { limit: 50 } });
  });

  it("conversionRate posts the conversion payload", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ rate: 1.2 }));
    const result = await tradingService.conversionRate({
      fromAsset: "USDT",
      toAsset: "NGN",
      quantity: "100",
    });
    expect(mockPost).toHaveBeenCalledWith("trading/conversion_rate", {
      fromAsset: "USDT",
      toAsset: "NGN",
      quantity: "100",
    });
    expect(result).toEqual({ rate: 1.2 });
  });

  it("listedPairs fetches listed pairs with params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await tradingService.listedPairs({ q: "btc", page: 1, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith("trading/listed_pairs", {
      params: { q: "btc", page: 1, limit: 10 },
    });
  });

  it("listedCurrencies fetches listed currencies with params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await tradingService.listedCurrencies({ q: "usd" });
    expect(mockGet).toHaveBeenCalledWith("trading/listed_currencies", {
      params: { q: "usd" },
    });
  });

  it("listedTokens fetches listed tokens", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [{ symbol: "BTC" }] }));
    const result = await tradingService.listedTokens();
    expect(mockGet).toHaveBeenCalledWith("trading/listed_tokens");
    expect(result).toEqual({ data: [{ symbol: "BTC" }] });
  });

  it("rejects on failure", async () => {
    mockGet.mockRejectedValueOnce(new Error("kline failed"));
    await expect(tradingService.klineData({ symbol: "BTCUSDT", interval: "1h" })).rejects.toThrow(
      "kline failed"
    );
  });
});

describe("history endpoints", () => {
  it("convertHistory fetches convert history", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await tradingService.convertHistory();
    expect(mockGet).toHaveBeenCalledWith("trading/convert/history");
    expect(result).toEqual({ data: [] });
  });

  it("fiatOrderHistory fetches fiat history", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await tradingService.fiatOrderHistory();
    expect(mockGet).toHaveBeenCalledWith("trading/fiat/history");
    expect(result).toEqual({ data: [] });
  });

  it("paymentHistory fetches payment history", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await tradingService.paymentHistory();
    expect(mockGet).toHaveBeenCalledWith("trading/payment/history");
    expect(result).toEqual({ data: [] });
  });

  it("rejects on failure", async () => {
    mockGet.mockRejectedValueOnce(new Error("history failed"));
    await expect(tradingService.paymentHistory()).rejects.toThrow("history failed");
  });
});