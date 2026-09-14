export const CRYPTO_ICONS: Record<string, string> = {
  USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white.png",
  ADA: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  AVAX: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  DOT: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  MATIC: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  TRX: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  LTC: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  LINK: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  BCH: "https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png",
  APT: "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png",
  UNI: "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png",
  ATOM: "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png",
  NEAR: "https://assets.coingecko.com/coins/images/10365/small/near.png",
  XLM: "https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png",
  TON: "https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png",
  WETH: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
  DAI: "https://assets.coingecko.com/coins/images/9956/small/4943.png",
  PEPE: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg",
  SHIB: "https://assets.coingecko.com/coins/images/11939/small/shiba.png",
  ARB: "https://assets.coingecko.com/coins/images/28206/small/arbitrum.png",
  OP: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  FTM: "https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png",
  SUI: "https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png",
};

export const getCryptoIcon = (symbol: string, fallback?: string): string | undefined => {
  if (!symbol) return fallback;
  const cleanSymbol = symbol.toUpperCase().trim();
  return CRYPTO_ICONS[cleanSymbol] || fallback;
};
