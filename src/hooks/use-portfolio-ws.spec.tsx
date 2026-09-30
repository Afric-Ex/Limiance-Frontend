import { describe, expect, it } from "vitest";
import { deriveAccountBalances } from "./use-portfolio-ws";

const coin = (over: Record<string, unknown> = {}) => ({
  symbol: "USDC",
  name: "USDC",
  currencyPrice: "1",
  spotBalance: "0",
  fundingBalance: "0",
  futuresBalance: "0",
  marginBalance: "0",
  pnlBalance: "0",
  ...over,
});

describe("deriveAccountBalances pnl source field", () => {
  it("reads pnlBalance, the field the API actually sends", () => {
    const balances = deriveAccountBalances([
      coin({ spotBalance: "100", pnlBalance: "5" }),
    ]);
    expect(Number(balances.spot.pnl)).toBeCloseTo(5, 6);
  });

  it("still accepts the snake_case spelling", () => {
    const balances = deriveAccountBalances([
      coin({ spotBalance: "100", pnlBalance: undefined, pnl_balance: "7" }),
    ]);
    expect(Number(balances.spot.pnl)).toBeCloseTo(7, 6);
  });

  it("treats a missing pnl field as no server pnl, not NaN", () => {
    const { pnlBalance: _dropped, ...withoutPnl } = coin({ spotBalance: "100" });
    const balances = deriveAccountBalances([withoutPnl]);
    expect(balances.spot.pnl).toBe("0");
    expect(balances.spot.pnlPercentage).toBe("0");
  });

  it("keeps summing to zero when every coin lacks pnl", () => {
    const { pnlBalance: _dropped, ...withoutPnl } = coin({
      symbol: "BTC",
      spotBalance: "1",
      currencyPrice: "60000",
    });
    const balances = deriveAccountBalances([withoutPnl, coin({ symbol: "USDC", spotBalance: "50" })]);
    expect(Number(balances.spot.pnl)).toBe(0);
  });

  it("reports a real zero pnl as server-provided", () => {
    const balances = deriveAccountBalances([coin({ spotBalance: "100", pnlBalance: "0" })]);
    expect(balances.spot.pnl).toBe("0.00000000");
  });
});

describe("deriveAccountBalances pnl units", () => {
  it("converts a coin-denominated pnlBalance to USD", () => {
    // 2 BTC of profit at 60k is 120k USD, not 2 USD.
    const balances = deriveAccountBalances([
      coin({ symbol: "BTC", currencyPrice: "60000", spotBalance: "1", pnlBalance: "2" }),
    ]);
    expect(Number(balances.spot.pnl)).toBeCloseTo(120000, 4);
  });

  it("leaves a USD-priced coin unscaled", () => {
    const balances = deriveAccountBalances([
      coin({ spotBalance: "100", pnlBalance: "5" }),
    ]);
    expect(Number(balances.spot.pnl)).toBeCloseTo(5, 6);
  });

  it("signs a negative pnlBalance correctly", () => {
    const balances = deriveAccountBalances([
      coin({ symbol: "ETH", currencyPrice: "3000", spotBalance: "10", pnlBalance: "-1.5" }),
    ]);
    expect(Number(balances.spot.pnl)).toBeCloseTo(-4500, 4);
  });
});

describe("deriveAccountBalances pnl allocation", () => {
  it("splits a coin pnl across wallets by balance share", () => {
    const balances = deriveAccountBalances([
      coin({ spotBalance: "75", fundingBalance: "25", pnlBalance: "100" }),
    ]);
    expect(Number(balances.spot.pnl)).toBeCloseTo(75, 6);
    expect(Number(balances.funding.pnl)).toBeCloseTo(25, 6);
  });

  it("ignores wallets with a zero balance", () => {
    const balances = deriveAccountBalances([
      coin({ spotBalance: "100", futuresBalance: "0", pnlBalance: "50" }),
    ]);
    expect(Number(balances.spot.pnl)).toBeCloseTo(50, 6);
    expect(balances.futures.pnl).toBe("0");
  });
});
