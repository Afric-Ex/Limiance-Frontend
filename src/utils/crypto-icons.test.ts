import { CRYPTO_ICONS, getCryptoIcon } from "./crypto-icons";

const KNOWN_SYMBOLS = [
  "USDT",
  "BTC",
  "ETH",
  "BNB",
  "USDC",
  "SOL",
  "XRP",
  "ADA",
  "DOGE",
  "AVAX",
  "DOT",
  "MATIC",
  "TRX",
  "LTC",
  "LINK",
  "BCH",
  "APT",
  "UNI",
  "ATOM",
  "NEAR",
  "XLM",
  "TON",
  "WETH",
  "DAI",
  "PEPE",
  "SHIB",
  "ARB",
  "OP",
  "FTM",
  "SUI",
];

describe("CRYPTO_ICONS", () => {
  it("maps a known symbol to a coingecko asset URL", () => {
    for (const symbol of KNOWN_SYMBOLS) {
      expect(CRYPTO_ICONS[symbol]).toMatch(
        /^https:\/\/assets\.coingecko\.com\/coins\/images\/.+\.(png|jpeg|webp)$/
      );
    }
  });

  it("contains exactly the supported symbols", () => {
    expect(Object.keys(CRYPTO_ICONS).sort()).toEqual([...KNOWN_SYMBOLS].sort());
  });
});

describe("getCryptoIcon", () => {
  it("returns the icon URL for an exact-match symbol", () => {
    expect(getCryptoIcon("BTC")).toBe(CRYPTO_ICONS.BTC);
    expect(getCryptoIcon("USDT")).toBe(CRYPTO_ICONS.USDT);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(getCryptoIcon("btc")).toBe(CRYPTO_ICONS.BTC);
    expect(getCryptoIcon(" Eth ")).toBe(CRYPTO_ICONS.ETH);
  });

  it("returns the fallback for an unknown symbol", () => {
    expect(getCryptoIcon("FOO", "/fallback.svg")).toBe("/fallback.svg");
  });

  it("returns undefined for an unknown symbol when no fallback is given", () => {
    expect(getCryptoIcon("FOO")).toBeUndefined();
  });

  it("returns the fallback for empty, null, or undefined symbol", () => {
    expect(getCryptoIcon("", "/fallback.svg")).toBe("/fallback.svg");
    expect(getCryptoIcon(null as unknown as string, "/fallback.svg")).toBe("/fallback.svg");
    expect(getCryptoIcon(undefined as unknown as string, "/fallback.svg")).toBe(
      "/fallback.svg"
    );
  });

  it("prefers a real icon over the fallback", () => {
    expect(getCryptoIcon("btc", "/fallback.svg")).toBe(CRYPTO_ICONS.BTC);
  });

  it("returns undefined for an empty symbol and no fallback", () => {
    expect(getCryptoIcon("")).toBeUndefined();
  });
});