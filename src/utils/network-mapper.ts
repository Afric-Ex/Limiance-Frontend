/**
 * Maps the network symbol coming from the "listed_networks" API (e.g. "BTC", "ETH", "BSC")
 * to the internal chain name stored in the wallet database (e.g. "bitcoin", "evm", "bsc").
 * 
 * NOTE: This is a minimal fallback. The backend should provide the correct mapping via
 * the listed_networks endpoint. This function returns the symbol as-is (lowercased)
 * to avoid hardcoded mappings.
 */
export function mapSymbolToWalletChain(symbol: string): string {
  if (!symbol) return "";
  return symbol.toLowerCase();
}

export function mapSymbolToWithdrawalChain(symbol: string): string {
  if (!symbol) return "";
  return symbol.toLowerCase();
}
