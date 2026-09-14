import {
  MOCK_SPOT_ORDERS,
  MOCK_OPEN_ORDERS,
  MOCK_CONVERT_HISTORY,
  MOCK_FIAT_HISTORY,
  MOCK_PAYMENT_HISTORY,
} from "./data/transaction-data";
import { MOCK_PRICES, MOCK_ORDER_BOOK } from "./data/market-data";

const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

// mutable state so UI updates reflect actions
let mockOpenOrders = [...MOCK_OPEN_ORDERS];
let nextOrderId = 100;

export const mockTrading = {
  placeSpotOrder: async (data: {
    side: "buy" | "sell";
    base: string;
    quote: string;
    type: string;
    price?: number;
    quantity: number;
  }) => {
    await delay(800);
    const id = `ord_mock_${++nextOrderId}`;
    const pair = `${data.base}/${data.quote}`;
    const price = data.price ?? MOCK_PRICES[pair]?.price ?? 0;
    const order = {
      id,
      pair,
      side: data.side,
      type: data.type,
      price,
      amount: data.quantity,
      filled: 0,
      total: price * data.quantity,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    mockOpenOrders.push(order);
    return { data: order, statusCode: 200, success: true, message: "Order placed" };
  },

  cancelSpotOrder: async (orderId: string) => {
    await delay(800);
    mockOpenOrders = mockOpenOrders.filter((o) => o.id !== orderId);
    return { data: { orderId, status: "cancelled" }, statusCode: 200, success: true, message: "Order cancelled" };
  },

  fetchOpenOrders: async (params?: { pair?: string }) => {
    await delay();
    const filtered = params?.pair
      ? mockOpenOrders.filter((o) => o.pair === params.pair)
      : mockOpenOrders;
    return { data: filtered, statusCode: 200, success: true, message: "OK" };
  },

  spotOrderHistory: async () => {
    await delay();
    return { data: MOCK_SPOT_ORDERS, statusCode: 200, success: true, message: "OK" };
  },

  marginOrderHistory: async () => {
    await delay();
    return { data: [], statusCode: 200, success: true, message: "OK" };
  },

  convertHistory: async () => {
    await delay();
    return { data: MOCK_CONVERT_HISTORY, statusCode: 200, success: true, message: "OK" };
  },

  fiatOrderHistory: async () => {
    await delay();
    return { data: MOCK_FIAT_HISTORY, statusCode: 200, success: true, message: "OK" };
  },

  paymentHistory: async () => {
    await delay();
    return { data: MOCK_PAYMENT_HISTORY, statusCode: 200, success: true, message: "OK" };
  },

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
    await delay(800);
    const id = `fut_mock_${++nextOrderId}`;
    const pair = data.pair.toUpperCase();
    const [base, quote = "USDT"] = pair.split("/");
    const normalizedPair = `${base}/${quote}`;
    const price = data.price ?? data.stopPrice ?? MOCK_PRICES[normalizedPair]?.price ?? 0;
    const order = {
      id,
      userId: "usr_001",
      side: data.side,
      base,
      quote,
      type: data.type,
      price,
      quantity: data.quantity,
      leverage: data.leverage ?? 15,
      marginUsed: (price * data.quantity) / (data.leverage ?? 15),
      liquidated: false,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    return { data: order, statusCode: 200, success: true, message: "Futures order placed" };
  },

  marginBalance: async () => {
    await delay();
    return {
      data: {
        totalBalance: "2,450.00",
        availableBalance: "1,800.00",
        usedMargin: "650.00",
        unrealizedPnl: "+45.32",
        marginLevel: "378%",
      },
      statusCode: 200,
      success: true,
      message: "OK",
    };
  },

  marginPositions: async () => {
    await delay();
    return { data: [], statusCode: 200, success: true, message: "OK" };
  },

  openMarginPosition: async (data: {
    side: "buy" | "sell";
    base: string;
    quote: string;
    type: string;
    price?: number;
    quantity: number;
    leverage: number;
  }) => {
    await delay(800);
    const id = `margin_mock_${++nextOrderId}`;
    const pair = `${data.base}/${data.quote}`;
    const price = data.price ?? MOCK_PRICES[pair]?.price ?? 0;
    return {
      data: {
        id,
        side: data.side,
        pair,
        price,
        quantity: data.quantity,
        leverage: data.leverage,
        marginUsed: (price * data.quantity) / data.leverage,
        status: "open",
        createdAt: new Date().toISOString(),
      },
      statusCode: 200,
      success: true,
      message: "Margin position opened",
    };
  },

  closeMarginPosition: async (positionId: string) => {
    await delay(800);
    return {
      data: { positionId, status: "closed" },
      statusCode: 200,
      success: true,
      message: "Position closed",
    };
  },

  // for chart — generate mock kline candles
  klineData: async (params: {
    symbol: string;
    interval: string;
    limit?: number;
  }) => {
    await delay();
    const basePrice = MOCK_PRICES[params.symbol]?.price ?? 67000;
    const count = params.limit ?? 500;
    const now = Date.now();
    const intervalMs =
      params.interval === "1m" ? 60000 :
      params.interval === "5m" ? 300000 :
      params.interval === "15m" ? 900000 :
      params.interval === "1h" ? 3600000 :
      params.interval === "4h" ? 14400000 :
      86400000;

    const candles = Array.from({ length: count }, (_, i) => {
      const time = Math.floor((now - (count - i) * intervalMs) / 1000);
      const drift = (Math.random() - 0.5) * basePrice * 0.01;
      const open = basePrice + drift;
      const close = open + (Math.random() - 0.5) * basePrice * 0.005;
      const high = Math.max(open, close) + Math.random() * basePrice * 0.003;
      const low = Math.min(open, close) - Math.random() * basePrice * 0.003;
      const volume = Math.random() * 100 + 1;
      return { t: time, o: +open.toFixed(2), h: +high.toFixed(2), l: +low.toFixed(2), c: +close.toFixed(2), v: +volume.toFixed(4) };
    });
    return { data: candles, statusCode: 200, success: true, message: "OK" };
  },

  gainersLosers: async (limit = 10) => {
    await delay();
    const movers = Object.entries(MOCK_PRICES)
      .map(([pair, data]) => ({
        pair,
        symbol: pair.split("/")[0],
        price: data.price,
        change24h: data.change24h,
        changePercent24h: data.changePercent24h,
        volume24h: data.volume24h,
      }))
      .sort((a, b) => Math.abs(b.changePercent24h) - Math.abs(a.changePercent24h))
      .slice(0, limit);
    return { data: movers, statusCode: 200, success: true, message: "OK" };
  },

  conversionRate: async (data: {
    fromAsset: string;
    toAsset: string;
    quantity: string;
  }) => {
    await delay();
    const fromPair = `${data.fromAsset}/USDT`;
    const toPair = `${data.toAsset}/USDT`;
    const fromPrice = MOCK_PRICES[fromPair]?.price ?? 1;
    const toPrice = MOCK_PRICES[toPair]?.price ?? 1;
    const rate = fromPrice / toPrice;
    const result = parseFloat(data.quantity) * rate;
    return {
      data: { rate: rate.toFixed(8), result: result.toFixed(8), fromAsset: data.fromAsset, toAsset: data.toAsset },
      statusCode: 200,
      success: true,
      message: "OK",
    };
  },

  orderBooks: async () => {
    await delay();
    const book = MOCK_ORDER_BOOK["BTC/USDT"];
    return {
      data: {
        buyOrders: book.bids.map((b, i) => ({
          id: `bid_${i}`,
          userId: "usr_mock",
          side: "buy",
          base: "BTC",
          quote: "USDT",
          type: "buy_limit",
          price: b.price,
          quantity: b.quantity,
          leverage: 0,
          marginUsed: 0,
          liquidated: false,
          status: "open",
          createdAt: new Date().toISOString(),
        })),
        sellOrders: book.asks.map((a, i) => ({
          id: `ask_${i}`,
          userId: "usr_mock",
          side: "sell",
          base: "BTC",
          quote: "USDT",
          type: "sell_limit",
          price: a.price,
          quantity: a.quantity,
          leverage: 0,
          marginUsed: 0,
          liquidated: false,
          status: "open",
          createdAt: new Date().toISOString(),
        })),
      },
      statusCode: 200,
      success: true,
      message: "OK",
      error: "",
    };
  },
};
