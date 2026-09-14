// realistic crypto prices — these show up in demos so they need to look right

export const MOCK_PRICES: Record<
  string,
  {
    price: number;
    change24h: number;
    changePercent24h: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    volumeQuote24h: number;
  }
> = {
  "BTC/USDT": {
    price: 67234.5,
    change24h: 1245.3,
    changePercent24h: 1.89,
    high24h: 67890.0,
    low24h: 65430.2,
    volume24h: 28456.78,
    volumeQuote24h: 1912345678.9,
  },
  "ETH/USDT": {
    price: 3521.82,
    change24h: -45.18,
    changePercent24h: -1.27,
    high24h: 3598.0,
    low24h: 3480.55,
    volume24h: 195432.1,
    volumeQuote24h: 688234567.8,
  },
  "BNB/USDT": {
    price: 584.32,
    change24h: 12.45,
    changePercent24h: 2.18,
    high24h: 592.1,
    low24h: 568.9,
    volume24h: 312456.3,
    volumeQuote24h: 182567890.1,
  },
  "SOL/USDT": {
    price: 172.45,
    change24h: 8.32,
    changePercent24h: 5.07,
    high24h: 175.8,
    low24h: 162.1,
    volume24h: 1845678.2,
    volumeQuote24h: 318234567.4,
  },
  "XRP/USDT": {
    price: 0.6234,
    change24h: -0.0156,
    changePercent24h: -2.44,
    high24h: 0.6512,
    low24h: 0.6102,
    volume24h: 45678901.3,
    volumeQuote24h: 28478901.2,
  },
  "ADA/USDT": {
    price: 0.4521,
    change24h: 0.0087,
    changePercent24h: 1.96,
    high24h: 0.4612,
    low24h: 0.4398,
    volume24h: 34567890.5,
    volumeQuote24h: 15623456.7,
  },
  "DOGE/USDT": {
    price: 0.1534,
    change24h: 0.0042,
    changePercent24h: 2.81,
    high24h: 0.1578,
    low24h: 0.1472,
    volume24h: 89012345.6,
    volumeQuote24h: 13654321.8,
  },
  "MATIC/USDT": {
    price: 0.7123,
    change24h: -0.0234,
    changePercent24h: -3.18,
    high24h: 0.7412,
    low24h: 0.7045,
    volume24h: 23456789.1,
    volumeQuote24h: 16709876.3,
  },
  "AVAX/USDT": {
    price: 36.78,
    change24h: 1.23,
    changePercent24h: 3.46,
    high24h: 37.92,
    low24h: 35.1,
    volume24h: 1234567.8,
    volumeQuote24h: 45412345.6,
  },
  "TRX/USDT": {
    price: 0.1245,
    change24h: 0.0018,
    changePercent24h: 1.47,
    high24h: 0.1278,
    low24h: 0.1215,
    volume24h: 67890123.4,
    volumeQuote24h: 8452345.7,
  },
};

// order book per pair — top 10 bids/asks
function generateOrderBook(basePrice: number) {
  const bids = Array.from({ length: 10 }, (_, i) => ({
    price: +(basePrice - (i + 1) * basePrice * 0.0005).toFixed(
      basePrice > 100 ? 2 : 4
    ),
    quantity: +(Math.random() * 2 + 0.01).toFixed(4),
  }));
  const asks = Array.from({ length: 10 }, (_, i) => ({
    price: +(basePrice + (i + 1) * basePrice * 0.0005).toFixed(
      basePrice > 100 ? 2 : 4
    ),
    quantity: +(Math.random() * 2 + 0.01).toFixed(4),
  }));
  return { bids, asks };
}

export const MOCK_ORDER_BOOK: Record<
  string,
  { bids: { price: number; quantity: number }[]; asks: { price: number; quantity: number }[] }
> = Object.fromEntries(
  Object.entries(MOCK_PRICES).map(([pair, data]) => [
    pair,
    generateOrderBook(data.price),
  ])
);

// recent trades
function generateTrades(basePrice: number, count = 20) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    price: +(basePrice + (Math.random() - 0.5) * basePrice * 0.002).toFixed(
      basePrice > 100 ? 2 : 4
    ),
    quantity: +(Math.random() * 1.5 + 0.001).toFixed(4),
    side: Math.random() > 0.5 ? ("buy" as const) : ("sell" as const),
    time: new Date(now - i * 3000).toISOString(),
  }));
}

export const MOCK_MARKET_TRADES: Record<
  string,
  { price: number; quantity: number; side: "buy" | "sell"; time: string }[]
> = Object.fromEntries(
  Object.entries(MOCK_PRICES).map(([pair, data]) => [
    pair,
    generateTrades(data.price),
  ])
);
