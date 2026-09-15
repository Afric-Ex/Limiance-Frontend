import {
  UNSUPPORTED_CHAIN_SYMBOLS,
  mapSymbolToWalletChain,
  mapSymbolToWithdrawalChain,
} from "./network-mapper";

describe("UNSUPPORTED_CHAIN_SYMBOLS", () => {
  it("contains every unsupported chain symbol", () => {
    for (const symbol of ["xrp", "xtz", "ada", "avax", "doge", "kava", "near"]) {
      expect(UNSUPPORTED_CHAIN_SYMBOLS.has(symbol)).toBe(true);
    }
  });

  it("does not contain supported chain symbols", () => {
    for (const symbol of ["btc", "eth", "sol", "trx", "bsc"]) {
      expect(UNSUPPORTED_CHAIN_SYMBOLS.has(symbol)).toBe(false);
    }
  });
});

describe("mapSymbolToWalletChain", () => {
  it("maps btc to bitcoin", () => {
    expect(mapSymbolToWalletChain("btc")).toBe("bitcoin");
  });

  it("is case-insensitive", () => {
    expect(mapSymbolToWalletChain("BTC")).toBe("bitcoin");
    expect(mapSymbolToWalletChain("Eth")).toBe("evm");
  });

  it("maps all evm networks to evm", () => {
    for (const symbol of ["eth", "pol", "arb", "op", "base"]) {
      expect(mapSymbolToWalletChain(symbol)).toBe("evm");
    }
  });

  it("maps remaining known networks to their wallet chain", () => {
    expect(mapSymbolToWalletChain("sol")).toBe("solana");
    expect(mapSymbolToWalletChain("apt")).toBe("apt");
    expect(mapSymbolToWalletChain("ton")).toBe("ton");
    expect(mapSymbolToWalletChain("dot")).toBe("dot");
    expect(mapSymbolToWalletChain("bsc")).toBe("bsc");
    expect(mapSymbolToWalletChain("trx")).toBe("tron");
  });

  it("returns an empty string for empty, null, or undefined input", () => {
    expect(mapSymbolToWalletChain("")).toBe("");
    expect(mapSymbolToWalletChain(null as unknown as string)).toBe("");
    expect(mapSymbolToWalletChain(undefined as unknown as string)).toBe("");
  });

  it("falls back to the lowercased symbol for unknown networks", () => {
    expect(mapSymbolToWalletChain("XYZ")).toBe("xyz");
    expect(mapSymbolToWalletChain("zec")).toBe("zec");
  });
});

describe("mapSymbolToWithdrawalChain", () => {
  it("maps evm networks to ethereum", () => {
    for (const symbol of ["eth", "pol", "arb", "op"]) {
      expect(mapSymbolToWithdrawalChain(symbol)).toBe("ethereum");
    }
  });

  it("maps base and bsc to themselves", () => {
    expect(mapSymbolToWithdrawalChain("base")).toBe("base");
    expect(mapSymbolToWithdrawalChain("bsc")).toBe("bsc");
  });

  it("is case-insensitive", () => {
    expect(mapSymbolToWithdrawalChain("ETH")).toBe("ethereum");
    expect(mapSymbolToWithdrawalChain("BSc")).toBe("bsc");
  });

  it("delegates everything else to the wallet-chain mapper", () => {
    expect(mapSymbolToWithdrawalChain("btc")).toBe("bitcoin");
    expect(mapSymbolToWithdrawalChain("sol")).toBe("solana");
    expect(mapSymbolToWithdrawalChain("trx")).toBe("tron");
  });

  it("returns an empty string for empty, null, or undefined input", () => {
    expect(mapSymbolToWithdrawalChain("")).toBe("");
    expect(mapSymbolToWithdrawalChain(null as unknown as string)).toBe("");
    expect(mapSymbolToWithdrawalChain(undefined as unknown as string)).toBe("");
  });
});