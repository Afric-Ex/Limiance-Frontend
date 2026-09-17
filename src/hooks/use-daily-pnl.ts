"use client";

import { useQuery } from "@tanstack/react-query";
import { usePortfolioWs, PortfolioCoin } from "@/src/hooks/use-portfolio-ws";

interface TickerItem {
  lastPrice: number;
  prevPrice: number;
}

function extractBase(pair: string): string {
  const sym = pair || "";
  if (sym.includes("/")) return sym.split("/")[0];
  if (sym.includes("_")) return sym.split("_")[0];
  if (sym.includes("-")) return sym.split("-")[0];
  if (sym.endsWith("USDT")) return sym.replace("USDT", "");
  return sym;
}

function parseMovers(raw: any): any[] {
  if (!raw) return [];
  const unwrapped = raw?.data ?? raw;
  if (unwrapped?.gainers || unwrapped?.losers) {
    return [...(unwrapped.gainers ?? []), ...(unwrapped.losers ?? [])];
  }
  if (Array.isArray(unwrapped)) return unwrapped;
  return [];
}

/** CoinGecko symbol → coingecko id map */
const COINGECKO_ID_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  TRX: "tron",
  DOT: "polkadot",
  MATIC: "matic-network",
  POL: "matic-network",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  UNI: "uniswap",
  LTC: "litecoin",
  SHIB: "shiba-inu",
  APT: "aptos",
  TON: "the-open-network",
  ARB: "arbitrum",
  OP: "optimism",
};

const STABLECOINS = new Set(["USDT", "USDC", "BUSD", "DAI", "TUSD", "FDUSD"]);

async function fetchCoinGeckoPrices(symbols: string[]): Promise<Record<string, TickerItem>> {
  const ids = symbols
    .filter((s) => !STABLECOINS.has(s) && COINGECKO_ID_MAP[s])
    .map((s) => COINGECKO_ID_MAP[s])
    .filter(Boolean);

  if (!ids.length) return {};

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = await res.json();

    const result: Record<string, TickerItem> = {};
    for (const [sym, cgId] of Object.entries(COINGECKO_ID_MAP)) {
      const item = data[cgId];
      if (!item) continue;
      const lastPrice = item.usd ?? 0;
      const pctChange24h = item.usd_24h_change ?? 0;
      const prevPrice = lastPrice > 0 ? lastPrice / (1 + pctChange24h / 100) : 0;
      result[sym] = { lastPrice, prevPrice };
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Calculates Today's P&L using:
 *  1. Real-time portfolio coins from WebSocket (usePortfolioWs)
 *  2. Backend 24h movers → CoinGecko fallback when backend is empty
 */
export function useDailyPnl(account?: string) {
  // ✅ Use WebSocket portfolio data (same source as the balance display)
  const { coins, isLoading: portfolioLoading } = usePortfolioWs();

  const safeFloat = (v: any) => {
    const n = parseFloat(String(v ?? "0").replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
  };

  // Non-stable symbols in the portfolio
  const portfolioSymbols = [
    ...new Set(
      coins
        .map((c: PortfolioCoin) => c.symbol?.toUpperCase())
        .filter((s: string) => s && !STABLECOINS.has(s))
    ),
  ] as string[];

  // Try backend movers first
  const { data: moversRaw } = useQuery({
    queryKey: ["pnl-movers"],
    queryFn: () =>
      import("@/src/services/trading").then((m) => m.tradingService.gainersLosers(100)),
    staleTime: 60_000,
    throwOnError: false,
    retry: false,
  });

  const backendMovers = parseMovers(moversRaw);
  const backendIsEmpty = backendMovers.length === 0;

  // Fallback: CoinGecko when backend movers is empty
  const { data: cgPrices } = useQuery({
    queryKey: ["pnl-coingecko", portfolioSymbols.sort().join(",")],
    queryFn: () => fetchCoinGeckoPrices(portfolioSymbols),
    enabled: backendIsEmpty && portfolioSymbols.length > 0,
    staleTime: 120_000,
    throwOnError: false,
    retry: false,
  });

  // Build ticker map from whichever source has data
  const tickerMap: Record<string, TickerItem> = {};

  if (!backendIsEmpty) {
    for (const t of backendMovers) {
      const sym = extractBase(t.pair || t.symbol || t.base || "");
      if (!sym) continue;
      const currentPrice = safeFloat(t.latest_price ?? t.lastPrice ?? t.price ?? t.last_price);
      const prevPrice24h = safeFloat(t.price_24h_ago ?? t.open ?? t.prev_price);
      const pctChange =
        safeFloat(t.percent_change_24h ?? t.priceChangePercent ?? t.changePercent24h ?? t.percent_change) / 100;
      const prevPrice =
        prevPrice24h > 0
          ? prevPrice24h
          : pctChange !== -1 && currentPrice > 0
          ? currentPrice / (1 + pctChange)
          : 0;
      tickerMap[sym] = { lastPrice: currentPrice, prevPrice };
    }
  } else if (cgPrices) {
    Object.assign(tickerMap, cgPrices);
  }

  let currTotal = 0;
  let prevTotal = 0;

  for (const coin of coins) {
    const sym = coin.symbol?.toUpperCase();
    if (!sym) continue;

    let balance = 0;
    if (account === "spot") {
      balance = safeFloat(coin.spotBalance);
    } else if (account === "margin") {
      balance = safeFloat(coin.marginBalance);
    } else if (account === "futures") {
      balance = safeFloat(coin.futuresBalance);
    } else {
      // Overall: sum all wallets
      balance =
        safeFloat(coin.spotBalance) +
        safeFloat(coin.marginBalance) +
        safeFloat(coin.futuresBalance) +
        safeFloat(coin.fundingBalance);
    }

    if (!balance) continue;

    // Stablecoins: 1:1 USD, no price movement
    if (STABLECOINS.has(sym)) {
      currTotal += balance;
      prevTotal += balance;
      continue;
    }

    // ✅ Also try currencyPrice from WS data as the "current price"
    const wsPrice = safeFloat(coin.currencyPrice);

    const ticker = tickerMap[sym];
    if (ticker && ticker.lastPrice) {
      currTotal += balance * ticker.lastPrice;
      prevTotal += balance * ticker.prevPrice;
    } else if (wsPrice > 0) {
      // We have the current price from WS but no 24h prev price — can't compute change
      currTotal += balance * wsPrice;
      prevTotal += balance * wsPrice; // neutral: shows 0 change for this coin
    }
  }

  const pnl = currTotal - prevTotal;
  const pnlPct = prevTotal > 0 ? (pnl / prevTotal) * 100 : 0;

  return { pnl, pnlPct, isLoading: portfolioLoading };
}
