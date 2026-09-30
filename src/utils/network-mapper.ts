/**
 * Maps the network symbol coming from the "listed_networks" API (e.g. "BTC", "ETH", "BSC")
 * to the internal chain name stored in the wallet database (e.g. "bitcoin", "evm", "bsc").
 */
export function mapSymbolToWalletChain(symbol: string): string {
  if (!symbol) return "";
  switch (symbol.toLowerCase()) {
    case "btc":
      return "bitcoin";
    case "eth":
    case "pol":
    case "arb":
    case "op":
    case "base":
      return "evm";
    case "sol":
      return "solana";
    case "apt":
      return "apt";
    case "ton":
      return "ton";
    case "dot":
      return "dot";
    case "bsc":
      return "bsc";
    case "trx":
      return "tron";
    default:
      return symbol.toLowerCase();
  }
}

export function mapSymbolToWithdrawalChain(symbol: string): string {
  if (!symbol) return "";
  switch (symbol.toLowerCase()) {
    case "eth":
    case "pol":
    case "arb":
    case "op":
      return "ethereum";
    case "base":
      return "base";
    case "bsc":
      return "bsc";
    default:
      return mapSymbolToWalletChain(symbol);
  }
}
