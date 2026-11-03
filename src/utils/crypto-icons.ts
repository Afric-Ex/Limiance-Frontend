export const CRYPTO_ICONS: Record<string, string> = {};

// Simple CDN-based crypto icon getter
export const getCryptoIcon = (symbol: string): string | undefined => {
  if (!symbol) return undefined;
  // Use Trust Wallet CDN for token logos
  // Returns logo.png for ERC-20 tokens and other blockchain assets
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${symbol.toUpperCase()}/logo.png`;
};
