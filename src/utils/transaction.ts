import { truncateCryptoAddress } from "./truncate-address";

/**
 * Transaction history rows from `wallet/user/transactions_history` sometimes put a
 * token's *contract address* in the `asset` field instead of a symbol — most
 * commonly the all-zero native-coin address on deposits. This turns such values
 * into a short, screen-safe label.
 */

const ADDRESS_LIKE = /^0x[a-fA-F0-9]{6,}$/;
const ZERO_ADDRESS = /^0x0{6,}$/;

// Network names → native-coin ticker. Zero-address deposits are the native coin
// of whatever chain the deposit landed on.
const CHAIN_TICKERS: Record<string, string> = {
  bitcoin: "BTC",
  btc: "BTC",
  bsc: "BNB",
  "bnb smart chain": "BNB",
  bnbsmartchain: "BNB",
  ethereum: "ETH",
  eth: "ETH",
  evm: "ETH",
  base: "ETH",
  arb: "ETH",
  arbitrum: "ETH",
  op: "ETH",
  optimistic: "ETH",
  pol: "ETH",
  polygon: "ETH",
  tron: "TRX",
  trx: "TRX",
  solana: "SOL",
  sol: "SOL",
  apt: "APT",
  aptos: "APT",
  ton: "TON",
  dot: "DOT",
  polkadot: "DOT",
  avax: "AVAX",
  avalanche: "AVAX",
  xrp: "XRP",
  ada: "ADA",
  cardano: "ADA",
  near: "NEAR",
  kava: "KAVA",
  doge: "DOGE",
  tezos: "XTZ",
  xtz: "XTZ",
};

export function formatTransactionAmount(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

export function formatTransactionAsset(
  asset: string | null | undefined,
  chain?: string | null
): string {
  const a = (asset ?? "").trim();
  if (!a) return "";

  // Not an address → assume it is already a readable symbol.
  if (a.length <= 20 || !ADDRESS_LIKE.test(a)) return a;

  // Native-coin deposit: the address is all zeros, so the meaningful label is
  // the chain's own token. Falls back to a truncated address when the chain is
  // not one we recognise, so it can still never overflow the row.
  if (ZERO_ADDRESS.test(a)) {
    const key = (chain ?? "").trim().toLowerCase().replace(/\s+/g, "");
    return CHAIN_TICKERS[key] ?? truncateCryptoAddress(a);
  }

  return truncateCryptoAddress(a);
}