import { describe, expect, it } from "vitest";
import { formatTransactionAmount, formatTransactionAsset } from "./transaction";

describe("formatTransactionAmount", () => {
  it("drops trailing zeros", () => {
    expect(formatTransactionAmount("0.01999500")).toBe("0.019995");
  });

  it("keeps significant fractional digits up to 8", () => {
    expect(formatTransactionAmount("123.123456789")).toBe("123.12345679");
  });

  it("groups integers", () => {
    expect(formatTransactionAmount("1200")).toBe("1,200");
  });

  it("returns non-numeric values as-is", () => {
    expect(formatTransactionAmount("--")).toBe("--");
  });

  it("returns empty for nullish", () => {
    expect(formatTransactionAmount(null)).toBe("");
    expect(formatTransactionAmount(undefined)).toBe("");
  });
});

describe("formatTransactionAsset", () => {
  it("passes through real symbols untouched", () => {
    expect(formatTransactionAsset("USDT")).toBe("USDT");
    expect(formatTransactionAsset("BTC")).toBe("BTC");
  });

  it("turns an all-zero native address into the chain ticker", () => {
    expect(formatTransactionAsset("0x0000000000000000000000000000000000000000", "bsc")).toBe("BNB");
    expect(formatTransactionAsset("0x0000000000000000000000000000000000000000", "ethereum")).toBe("ETH");
  });

  it("falls back to a truncated address for unknown chains", () => {
    expect(formatTransactionAsset("0x0000000000000000000000000000000000000000", "weirdchain")).toBe("0x00...0000");
  });

  it("truncates non-zero contract addresses", () => {
    expect(formatTransactionAsset("0x55d398326f99059ff775485246999027b3197955")).toBe("0x55...7955");
  });

  it("returns empty for nullish", () => {
    expect(formatTransactionAsset(null)).toBe("");
    expect(formatTransactionAsset(undefined, "bsc")).toBe("");
  });
});