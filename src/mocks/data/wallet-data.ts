// wallet balances, fees, minimums

export const MOCK_BALANCE = {
  inBtc: "0.14523",
  inUsd: "9,761.45",
  inNgn: "15,234,567.80",
  pnl: "+245.32",
  pnlPercentage: "+2.58",
};

export const MOCK_PORTFOLIO = [
  {
    userId: "usr_001",
    symbol: "USDT",
    name: "Tether",
    currencyPrice: "1.00",
    image: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    spotBalance: "5,432.10",
    futuresBalance: "1,200.00",
    fundingBalance: "500.00",
    marginBalance: "0.00",
    lockedBalance: "0.00",
    suspensionReason: "",
    suspendedAt: "",
    lastActivityAt: new Date().toISOString(),
  },
  {
    userId: "usr_001",
    symbol: "BTC",
    name: "Bitcoin",
    currencyPrice: "67234.50",
    image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    spotBalance: "0.04521",
    futuresBalance: "0.00000",
    fundingBalance: "0.00000",
    marginBalance: "0.00000",
    lockedBalance: "0.00000",
    suspensionReason: "",
    suspendedAt: "",
    lastActivityAt: new Date().toISOString(),
  },
  {
    userId: "usr_001",
    symbol: "ETH",
    name: "Ethereum",
    currencyPrice: "3521.82",
    image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    spotBalance: "0.8500",
    futuresBalance: "0.0000",
    fundingBalance: "0.0000",
    marginBalance: "0.0000",
    lockedBalance: "0.0000",
    suspensionReason: "",
    suspendedAt: "",
    lastActivityAt: new Date().toISOString(),
  },
];

// chain → token → fee
export const MOCK_NETWORK_FEE: Record<string, Record<string, string>> = {
  Ethereum: { USDT: "5.00", ETH: "0.001", BTC: "0.0001" },
  "BNB Smart Chain": { USDT: "0.80", BNB: "0.0005", ETH: "0.0001" },
  Polygon: { USDT: "0.50", MATIC: "0.1" },
  Arbitrum: { USDT: "0.40", ETH: "0.0001" },
  Optimism: { USDT: "0.40", ETH: "0.0001" },
  Avalanche: { USDT: "0.50", AVAX: "0.01" },
  Fantom: { USDT: "0.30" },
  Cronos: { USDT: "0.50" },
  CELO: { USDT: "0.30" },
  Base: { USDT: "0.30", ETH: "0.0001" },
  Tron: { USDT: "1.00", TRX: "1.00" },
  Solana: { USDT: "0.50", SOL: "0.01" },
  Bitcoin: { BTC: "0.0002" },
};

export const MOCK_MINIMUM_DEPOSIT: Record<string, string> = {
  USDT: "10.00",
  BTC: "0.0005",
  ETH: "0.005",
  BNB: "0.01",
  SOL: "0.1",
  XRP: "10.00",
  ADA: "10.00",
  DOGE: "50.00",
  MATIC: "10.00",
  AVAX: "0.5",
  TRX: "50.00",
};

export const MOCK_MINIMUM_WITHDRAWAL: Record<string, string> = {
  USDT: "5.00",
  BTC: "0.001",
  ETH: "0.01",
  BNB: "0.02",
  SOL: "0.2",
  XRP: "20.00",
  ADA: "20.00",
  DOGE: "100.00",
  MATIC: "20.00",
  AVAX: "1.0",
  TRX: "100.00",
};
