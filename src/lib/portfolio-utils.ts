/**
 * Pure portfolio data helpers — no React, no WebSocket, no network.
 *
 * Kept separate from the store so the store can import them without a cycle,
 * and so they stay trivially unit-testable (see use-portfolio-ws.spec.tsx).
 */

export interface PortfolioCoin {
  userId: string;
  symbol: string;
  name: string;
  currencyPrice: string;
  image: string;
  usdPrice?: string;
  price?: string;
  logo?: string;
  icon?: string;
  spotBalance: string;
  futuresBalance: string;
  fundingBalance: string;
  marginBalance: string;
  lockedBalance: string;
  pnlBalance: string;
  pnl?: string;
  pnlPercentage?: string;
}

export interface AllocationItem {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  percentage: string;
}

export interface PortfolioAllocations {
  totalValue: string;
  allocations: AllocationItem[];
}

export interface AccountBalance {
  inUsd: string;
  inBtc: string;
  inNgn: string;
  pnl: string;
  pnlPercentage: string;
}

export interface MarginAsset {
  asset: string;
  borrowed: string;
  free: string;
  interest: string;
  locked: string;
  net_balance: string;
  total_liability: string;
}

export interface MarginAccountData {
  assets: MarginAsset[];
  auto_borrow: boolean;
  auto_repay: boolean;
  equity_usd: string;
  margin_level: string;
  max_leverage: string;
  mode: string;
  total_assets_usd: string;
  total_liability_usd: string;
  user_id: string;
  // Optional camelCase fallbacks in case backend responds with camelCase
  totalAssetsUsd?: string;
  totalLiabilitiesUsd?: string;
  totalLiabilityUsd?: string;
  equityUsd?: string;
  equity?: string;
  marginLevel?: string;
  maxLeverage?: string;
}

const numericValue = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function deriveFundingBalance(
  total: AccountBalance | undefined,
  spot: AccountBalance | undefined,
  futures: AccountBalance | undefined,
  margin: AccountBalance | undefined
): { inUsd: number; inBtc: number } | null {
  if (!total || !spot || !futures || !margin) return null;

  return {
    inUsd: Math.max(
      0,
      numericValue(total.inUsd) -
        numericValue(spot.inUsd) -
        numericValue(futures.inUsd) -
        numericValue(margin.inUsd)
    ),
    inBtc: Math.max(
      0,
      numericValue(total.inBtc) -
        numericValue(spot.inBtc) -
        numericValue(futures.inBtc) -
        numericValue(margin.inBtc)
    ),
  };
}

/** Merge duplicate API rows so consumers always receive one row per asset. */
export function normalizePortfolioCoins(coins: any[]): PortfolioCoin[] {
  const merged = new Map<string, PortfolioCoin>();

  coins.forEach((coin) => {
    const symbol = String(coin?.symbol ?? "").trim();
    if (!symbol) return;

    const key = symbol.toUpperCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, {
        ...coin,
        symbol,
        spotBalance: String(coin.spotBalance ?? coin.spot_balance ?? "0"),
        futuresBalance: String(coin.futuresBalance ?? coin.futures_balance ?? "0"),
        fundingBalance: String(coin.fundingBalance ?? coin.funding_balance ?? "0"),
        marginBalance: String(coin.marginBalance ?? coin.margin_balance ?? "0"),
      });
      return;
    }

    existing.spotBalance = String(numericValue(existing.spotBalance) + numericValue(coin.spotBalance ?? coin.spot_balance));
    existing.futuresBalance = String(numericValue(existing.futuresBalance) + numericValue(coin.futuresBalance ?? coin.futures_balance));
    existing.fundingBalance = String(numericValue(existing.fundingBalance) + numericValue(coin.fundingBalance ?? coin.funding_balance));
    existing.marginBalance = String(numericValue(existing.marginBalance) + numericValue(coin.marginBalance ?? coin.margin_balance));
    existing.lockedBalance = String(numericValue(existing.lockedBalance) + numericValue(coin.lockedBalance ?? coin.locked_balance));
    existing.pnlBalance = String(numericValue(existing.pnlBalance) + numericValue(coin.pnlBalance ?? coin.pnl_balance));
  });

  return Array.from(merged.values());
}

/** Derive per-account USD totals + server 24h P&L from per-coin portfolio data */
export function deriveAccountBalances(coins: any[]): Record<string, AccountBalance> {
  const totals: Record<string, number> = { spot: 0, funding: 0, futures: 0, margin: 0 };
  const pnl: Record<string, number> = { spot: 0, funding: 0, futures: 0, margin: 0 };
  const pnlPctWeighted: Record<string, number> = { spot: 0, funding: 0, futures: 0, margin: 0 };
  const hasServerPnl: Record<string, boolean> = { spot: false, funding: false, futures: false, margin: false };

  coins.forEach((c) => {
    const price = parseFloat(c.currencyPrice || c.usdPrice || c.price || "0");
    const spot = parseFloat(c.spotBalance || c.spot_balance || c.balance || c.free || "0");
    const funding = parseFloat(c.fundingBalance || c.funding_balance || "0");
    const futures = parseFloat(c.futuresBalance || c.futures_balance || "0");
    const margin = parseFloat(c.marginBalance || c.margin_balance || "0");

    totals.spot    += spot    * price;
    totals.funding += funding * price;
    totals.futures += futures * price;
    totals.margin  += margin  * price;

    // Server 24h P&L per coin (from get_portfolio). The payload field is
    // `pnlBalance`, and like the other balance fields it is denominated in the
    // coin, not USD, so it needs the same conversion the balances above use.
    const rawPnl = c.pnlBalance ?? c.pnl_balance;
    const coinPnlCoin = rawPnl != null && rawPnl !== "" ? parseFloat(rawPnl) : NaN;
    if (!Number.isFinite(coinPnlCoin)) return;
    const coinPnl = coinPnlCoin * price;
    if (!Number.isFinite(coinPnl)) return;

    const rawPct = c.pnlPercentage ?? c.pnl_percentage;
    const coinPct = rawPct != null && rawPct !== "" ? parseFloat(rawPct) : NaN;

    const totalBal = funding + futures + margin + spot;
    const wallets: Array<[string, number]> = [
      ["spot", spot],
      ["funding", funding],
      ["futures", futures],
      ["margin", margin],
    ];

    for (const [key, bal] of wallets) {
      if (bal <= 0) continue;
      hasServerPnl[key] = true;
      const share = totalBal > 0 ? bal / totalBal : 1;
      const scaled = coinPnl * share;
      pnl[key] += scaled;
      // Aggregate the server pnlPercentage (fraction, e.g. 0.00496626) weighted
      // by each coin's P&L contribution — no frontend price math.
      if (Number.isFinite(coinPct) && scaled !== 0) {
        pnlPctWeighted[key] += scaled * coinPct;
      }
    }
  });

  const btcCoin = coins.find((c) => c.symbol === "BTC");
  const btcPrice = parseFloat(btcCoin?.currencyPrice || btcCoin?.price || "1") || 1;

  const makeBalance = (usd: number, key: string): AccountBalance => ({
    inUsd: usd.toFixed(8),
    inBtc: (usd / btcPrice).toFixed(8),
    inNgn: (usd * 1600).toFixed(2),
    pnl: hasServerPnl[key] ? pnl[key].toFixed(8) : "0",
    pnlPercentage:
      hasServerPnl[key] && pnl[key] !== 0 ? (pnlPctWeighted[key] / pnl[key]).toFixed(8) : "0",
  });

  return {
    spot:    makeBalance(totals.spot, "spot"),
    funding: makeBalance(totals.funding, "funding"),
    futures: makeBalance(totals.futures, "futures"),
    margin:  makeBalance(totals.margin, "margin"),
  };
}