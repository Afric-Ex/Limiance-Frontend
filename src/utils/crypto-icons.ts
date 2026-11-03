export const CRYPTO_ICONS: Record<string, string> = {};

export const getCryptoIcon = (symbol: string): string | undefined => {
  const ticker = symbol.trim().toLowerCase();
  if (!ticker) return undefined;
  return `https://assets.coincap.io/assets/icons/${encodeURIComponent(ticker)}@2x.png`;
};
