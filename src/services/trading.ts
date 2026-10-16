import { api } from "../lib/axios";
import { ApiResponse } from "../types/api";
import { OrderBooksResponse } from "../types/trading";

export type OrderSide = "buy" | "sell";
export type TradingMarket = "spot" | "margin" | "futures";
export type SpotOrderType = "buy_limit" | "sell_limit" | "buy_stop" | "sell_stop" | "market";

const compactSymbol = (base: string, quote: string) => `${base}${quote}`.toUpperCase();
const slashSymbol = (base: string, quote: string) => `${base}/${quote}`.toUpperCase();
const filterOrdersByPair = (orders: any[], pair?: string) => {
  if (!pair) return orders;
  const normalizedPair = pair.replace("/", "").toUpperCase();
  return orders.filter((order: any) => {
    const orderPair =
      order.pair ||
      order.symbol ||
      (order.base && order.quote ? `${order.base}/${order.quote}` : "");
    return String(orderPair).replace("/", "").toUpperCase() === normalizedPair;
  });
};

export const tradingKeys = {
  orderBooks: ["order-books"],
  openOrders: (pair?: string) => ["open-orders", pair],
  orderHistory: (market?: TradingMarket, pair?: string) => ["order-history", market, pair],
  tradeHistory: (market?: TradingMarket, pair?: string) => ["trade-history", market, pair],
  spotRecentTrades: (symbol?: string) => ["spot-recent-trades", symbol],
  klineData: (symbol: string, interval: string, market?: string) => ["kline", symbol, interval, market],
  gainersLosers: ["gainers-losers"],
  marginOrderHistory: ["margin-order-history"],
  marginOpenOrders: ["margin-open-orders"],
  marginBorrowHistory: ["margin-borrow-history"],
  marginLiquidationHistory: ["margin-liquidation-history"],
  convertHistory: ["convert-history"],
  fiatOrderHistory: ["fiat-order-history"],
  paymentHistory: ["payment-history"],
  listedTokens: (params?: { query?: string; page?: number; limit?: number; isTradable?: boolean }) => ["listed-tokens", params],
} as const;

export const tradingService = {
  orderBooks: async (): Promise<ApiResponse<OrderBooksResponse>> => {
    const response = await api.get("trading/order_books");
    return response.data;
  },

  marketOrderHistory: async (
    market: TradingMarket,
    params?: { pair?: string; page?: number; limit?: number }
  ) => {
    const response = await api.get(`trading/${market}/order_history`, { params });
    return response.data;
  },

  tradeHistory: async (market: TradingMarket) => {
    const response = await api.get("trading/history", { params: { market } });
    return response.data;
  },

  // ─── Spot ────────────────────────────────────────────────────────────────
  placeLimitOrder: async (data: {
    side: OrderSide;
    base: string;
    quote: string;
    type: "buy_limit" | "sell_limit";
    price: number;
    quantity: number;
  }) => {
    const endpoint = data.side === "buy" ? "trading/spot/buy_limit" : "trading/spot/sell_limit";
    const response = await api.post(endpoint, {
      symbol: slashSymbol(data.base, data.quote),
      side: data.side.toUpperCase(),
      type: "LIMIT",
      quantity: Number(data.quantity),
      price: Number(data.price)
    });
    return response.data;
  },

  placeStopOrder: async (data: {
    side: OrderSide;
    base: string;
    quote: string;
    type: "buy_stop" | "sell_stop";
    stopPrice: number;
    quantity: number;
  }) => {
    const endpoint = data.side === "buy" ? "trading/spot/buy_stop" : "trading/spot/sell_stop";
    const response = await api.post(endpoint, {
      symbol: slashSymbol(data.base, data.quote),
      side: data.side.toUpperCase(),
      type: "STOP",
      quantity: Number(data.quantity),
      price: Number(data.stopPrice),
      stopPrice: Number(data.stopPrice),
    });
    return response.data;
  },

  placeMarketOrder: async (data: {
    side: OrderSide;
    base: string;
    quote: string;
    type: "market";
    quantity: number;
    price?: number; // required by backend for max-notional validation on market orders
  }) => {
    const endpoint = data.side === "buy" ? "trading/spot/buy" : "trading/spot/sell";
    const response = await api.post(endpoint, {
      symbol: slashSymbol(data.base, data.quote),
      side: data.side.toUpperCase(),
      type: "MARKET",
      quantity: Number(data.quantity),
      ...(data.price && data.price > 0 ? { price: Number(data.price) } : {}),
    });
    return response.data;
  },

  closeSpotOrder: async (orderId: string, symbol?: string) => {
    const response = await api.post("trading/spot/close_order", {
      orderId,
      ...(symbol ? { symbol } : {}),
    });
    return response.data;
  },

  spotOrderStatus: async (orderId: string) => {
    const response = await api.get(`trading/transactions/spot/${orderId}`);
    return response.data;
  },

  // ─── Margin ──────────────────────────────────────────────────────────────
  getMarginAccount: async () => {
    const response = await api.get("trading/margin/account");
    return response.data;
  },
  createMarginAccount: async () => {
    const response = await api.post("trading/margin/account");
    return response.data;
  },

  placeMarginLimitOrder: async (data: {
    side: OrderSide;
    base: string;
    quote: string;
    type: "buy_limit" | "sell_limit";
    price: number;
    quantity: number;
    leverage: number;
  }) => {
    const endpoint = data.side === "buy" ? "trading/margin/buy_limit" : "trading/margin/sell_limit";
    const response = await api.post(endpoint, {
      symbol: compactSymbol(data.base, data.quote),
      side: data.side.toUpperCase(),
      type: "LIMIT",
      quantity: Number(data.quantity),
      price: Number(data.price),
      leverage: data.leverage,
    });
    return response.data;
  },

  placeMarginMarketOrder: async (data: {
    side: OrderSide;
    base: string;
    quote: string;
    type: "market";
    quantity: number;
    leverage: number;
    price?: number; // forwarded for backend max-notional validation
  }) => {
    const endpoint = data.side === "buy" ? "trading/margin/buy" : "trading/margin/sell";
    const response = await api.post(endpoint, {
      symbol: compactSymbol(data.base, data.quote),
      side: data.side.toUpperCase(),
      type: "MARKET",
      quantity: Number(data.quantity),
      leverage: data.leverage,
      ...(data.price && data.price > 0 ? { price: Number(data.price) } : {}),
    });
    return response.data;
  },

  placeMarginStopOrder: async (data: {
    side: OrderSide;
    base: string;
    quote: string;
    type: "buy_stop" | "sell_stop";
    stopPrice: number;
    quantity: number;
    leverage: number;
  }) => {
    const endpoint = data.side === "buy" ? "trading/margin/buy_stop" : "trading/margin/sell_stop";
    const response = await api.post(endpoint, {
      symbol: compactSymbol(data.base, data.quote),
      side: data.side.toUpperCase(),
      type: "STOP",
      quantity: Number(data.quantity),
      stopPrice: Number(data.stopPrice),
      leverage: data.leverage,
    });
    return response.data;
  },

  closeMarginOrder: async (orderId: string, symbol?: string) => {
    const response = await api.post("trading/margin/close_order", {
      orderId,
      ...(symbol ? { symbol: symbol.replace("/", "").toUpperCase() } : {}),
    });
    return response.data;
  },

  marginBalance: async () => {
    const response = await api.get("trading/margin/balance");
    return response.data;
  },

  marginPositions: async () => {
    const response = await api.get("trading/margin/positions");
    return response.data;
  },

  setMarginLeverage: async (max_leverage: number) => {
    const response = await api.put("trading/margin/leverage", { max_leverage });
    return response.data;
  },

  setMarginMode: async (mode: "cross" | "isolated") => {
    const response = await api.put("trading/margin/mode", { mode });
    return response.data;
  },

  borrowMargin: async (data: { asset: string; amount: number }) => {
    const response = await api.post("trading/margin/borrow", data);
    return response.data;
  },

  repayMargin: async (data: { asset: string; amount: number }) => {
    const response = await api.post("trading/margin/repay", data);
    return response.data;
  },

  marginOrderHistory: async () => {
    return tradingService.marketOrderHistory("margin");
  },

  marginTradeHistory: async () => {
    return tradingService.tradeHistory("margin");
  },

  fetchMarginOpenOrders: async (params?: { pair?: string }) => {
    const response = await api.get("trading/margin/orders", { params: { status: "open" } });
    if (!Array.isArray(response.data?.data)) return response.data;
    return { ...response.data, data: filterOrdersByPair(response.data.data, params?.pair) };
  },

  marginBorrowHistory: async () => {
    const response = await api.get("trading/margin/borrow_history");
    return response.data;
  },

  marginLiquidationHistory: async () => {
    const response = await api.get("trading/margin/liquidation_history");
    return response.data;
  },

  placeMarginOCOOrder: async (data: {
    symbol: string;
    order_side: string;
    tp_trigger_price: string;
    sl_trigger_price: string;
    quantity: string;
    tp_limit_price: string;
    sl_limit_price: string;
  }) => {
    const response = await api.post("trading/margin/oco", data);
    return response.data;
  },

  // ─── Futures ─────────────────────────────────────────────────────────────
  placeFuturesOrder: async (data: {
    pair: string;
    side: "buy" | "sell";
    type: "market" | "limit" | "stop_buy" | "stop_sell";
    quantity: number;
    leverage?: number;
    price?: number;
    stopPrice?: number;
    marginMode?: "cross" | "isolated";
    takeProfit?: number;
    stopLoss?: number;
  }) => {
    const normalizedType =
      data.type === "market" ? "market" : data.type === "limit" ? "limit" : "stop";
    const response = await api.post("trading/futures/place_order", {
      pair: data.pair,
      side: data.side === "buy" ? "LONG" : "SHORT",
      type: normalizedType,
      quantity: data.quantity,
      leverage: data.leverage,
      marginMode: data.marginMode ?? "cross",
      ...(normalizedType === "limit" && typeof data.price === "number" ? { price: data.price } : {}),
      ...(normalizedType === "stop" && typeof data.stopPrice === "number" ? { price: data.stopPrice } : {}),
      ...(typeof data.takeProfit === "number" ? { takeProfit: data.takeProfit } : {}),
      ...(typeof data.stopLoss === "number" ? { stopLoss: data.stopLoss } : {}),
    });
    return response.data;
  },

  setFuturesMode: async (mode: "cross" | "isolated") => {
    const response = await api.post("trading/futures/set_margin_mode", { mode });
    return response.data;
  },

  setFuturesLeverage: async (leverage: number) => {
    const response = await api.post("trading/futures/set_leverage", { leverage });
    return response.data;
  },

  acceptFutures: async () => {
    const response = await api.post("users/accept_futures");
    return response.data;
  },

  fetchFuturesOpenOrders: async (params?: { pair?: string }) => {
    const response = await api.get("trading/futures/orders", { params: { status: "open" } });
    if (!Array.isArray(response.data?.data)) return response.data;
    return { ...response.data, data: filterOrdersByPair(response.data.data, params?.pair) };
  },

  futuresOrderHistory: async (params?: { pair?: string }) => {
    const response = await api.get("trading/futures/order_history", { params: params?.pair ? { pair: params.pair } : {} });
    if (!Array.isArray(response.data?.data)) return response.data;
    return { ...response.data, data: filterOrdersByPair(response.data.data, params?.pair) };
  },

  futuresTradeHistory: async () => {
    return tradingService.tradeHistory("futures");
  },

  closeFuturesPosition: async (data: { positionId: string }) => {
    // Correct endpoint: POST /trading/futures/close_position/{position_id}
    const response = await api.post(`trading/futures/close_position/${data.positionId}`);
    return response.data;
  },

  partialCloseFuturesPosition: async (data: { positionId: string; close_quantity: string }) => {
    // POST /trading/futures/partial_close/{position_id} body: { close_quantity: "0.05" }
    const response = await api.post(`trading/futures/partial_close/${data.positionId}`, {
      close_quantity: data.close_quantity,
    });
    return response.data;
  },


  updateFuturesPositionTPSL: async (data: { positionId: string; take_profit_price?: number | string; stop_loss_price?: number | string }) => {
    const response = await api.patch(`trading/futures/position/${data.positionId}/tpsl`, {
      take_profit_price: data.take_profit_price,
      stop_loss_price: data.stop_loss_price,
    });
    return response.data;
  },

  cancelFuturesOrder: async (orderId: string) => {
    const response = await api.delete(`trading/futures/order/${orderId}`);
    return response.data;
  },

  editFuturesOrder: async (data: { orderId: string; price?: string; quantity?: string }) => {
    const { orderId, ...body } = data;
    const response = await api.patch(`trading/futures/order/${orderId}`, body);
    return response.data;
  },


  // ─── Orders & History ────────────────────────────────────────────────────
  fetchOpenOrders: async (params?: { pair?: string }) => {
    const response = await api.get("trading/spot/orders", { params: { status: "open" } });
    if (!params?.pair || !Array.isArray(response.data?.data)) return response.data;
    return { ...response.data, data: filterOrdersByPair(response.data.data, params.pair) };
  },

  cancelSpotOrder: async (orderId: string) => {
    const response = await api.delete(`trading/spot/order/${orderId}`);
    return response.data;
  },

  spotOrderHistory: async (params?: { page?: number; limit?: number }) => {
    return tradingService.marketOrderHistory("spot", params);
  },

  spotTradeHistory: async () => {
    return tradingService.tradeHistory("spot");
  },

  fetchSpotOrderById: async (id: string) => {
    const response = await api.get(`trading/transactions/spot/${id}`);
    return response.data;
  },

  spotRecentTrades: async (params?: { symbol?: string }) => {
    const response = await api.get("trading/spot/recent_trades", { params });
    return response.data;
  },

  // ─── Market Data ─────────────────────────────────────────────────────────
  klineData: async (params: {
    symbol: string;
    interval: string;
    limit?: number;
    startTime?: string;
    endTime?: string;
    market?: string;
  }) => {
    const response = await api.get("trading/kline/historical", {
      params: {
        symbol: params.symbol,
        "start-time": params.startTime || "",
        "end-time": params.endTime || "",
        interval: params.interval,
        limit: params.limit || 500,
        ...(params.market ? { market: params.market } : {}),
      },
    });
    return response.data;
  },

  gainersLosers: async (limit = 100) => {
    const response = await api.get(`trading/24_hours_movers`, { params: { limit } });
    return response.data;
  },

  conversionRate: async (data: { fromAsset: string; toAsset: string; quantity: string }) => {
    const response = await api.post("trading/conversion_rate", data);
    return response.data;
  },

  listedPairs: async (params?: { q?: string; page?: number; limit?: number }) => {
    const response = await api.get("trading/listed_pairs", { params });
    return response.data;
  },

  listedCurrencies: async (params?: { q?: string; page?: number; limit?: number }) => {
    const response = await api.get("trading/listed_currencies", { params });
    return response.data;
  },

  listedTokens: async (params?: {
    page?: number;
    limit?: number;
    query?: string;
    isTradable?: boolean;
  }): Promise<{
    data: { symbol: string; name?: string; logo?: string }[];
    totalRecords?: string | number;
  } | null> => {
    const response = await api.get("trading/listed_tokens", { params });
    return response.data;
  },

  // ─── Payments & History ───────────────────────────────────────────────────
  convertHistory: async () => {
    const response = await api.get("trading/convert/history");
    return response.data;
  },

  fiatOrderHistory: async () => {
    const response = await api.get("wallet/fiat/history");
    return response.data;
  },

  paymentHistory: async () => {
    const response = await api.get("trading/payment/history");
    return response.data;
  },
};
