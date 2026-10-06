export interface WhitelistedAddress {
  address: string;
  name?: string;
  chain?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  activatesAt?: string;
}

export function validateWhitelistAddress(address: string, networkSymbol: string): string | null {
  if (!address) return null;
  const symbol = networkSymbol.toUpperCase();
  if (["ETH", "BSC", "MATIC", "AVAX", "ARB", "OP", "EVM"].some((item) => symbol.includes(item))) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return "Invalid EVM address — must start with 0x and be 42 characters";
    }
  } else if (symbol === "BTC" || symbol === "BITCOIN") {
    if (!/^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(address)) {
      return "Invalid Bitcoin address — must start with 1, 3, or bc1";
    }
  } else if (symbol === "SOL" || symbol === "SOLANA") {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      return "Invalid Solana address — must be 32–44 base58 characters";
    }
  } else if (symbol === "TRX" || symbol === "TRON") {
    if (!/^T[a-zA-Z0-9]{33}$/.test(address)) {
      return "Invalid Tron address — must start with T and be 34 characters";
    }
  }
  return null;
}

function findWhitelistEntries(value: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object" || depth > 3) return null;

  const record = value as Record<string, unknown>;
  if (typeof record.address === "string" || typeof record.wallet_address === "string") {
    return [record];
  }

  for (const key of ["data", "addresses", "whitelist", "items", "results"]) {
    if (key in record) {
      const entries = findWhitelistEntries(record[key], depth + 1);
      if (entries) return entries;
    }
  }
  return null;
}

export function parseWhitelistAddresses(response: unknown): WhitelistedAddress[] {
  const entries = findWhitelistEntries(response) ?? [];
  return entries.flatMap((entry) => {
    if (typeof entry === "string" && entry.trim()) {
      return [{ address: entry.trim() }];
    }
    if (!entry || typeof entry !== "object") return [];

    const record = entry as Record<string, unknown>;
    const address = record.address ?? record.wallet_address;
    if (typeof address !== "string" || !address.trim()) return [];

    const name = record.name ?? record.label;
    const chain = record.chain ?? record.network ?? record.blockchain;
    const createdAt = record.createdAt ?? record.created_at ?? record.addedAt ?? record.added_at;
    const updatedAt = record.updatedAt ?? record.updated_at;
    const isActive = record.isActive ?? record.is_active;
    const activatesAt = record.activatesAt ?? record.activates_at;
    return [{
      address: address.trim(),
      ...(typeof name === "string" ? { name } : {}),
      ...(typeof chain === "string" ? { chain } : {}),
      ...(typeof createdAt === "string" ? { createdAt } : {}),
      ...(typeof updatedAt === "string" ? { updatedAt } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(typeof activatesAt === "string" ? { activatesAt } : {}),
    }];
  });
}

export function truncateWhitelistAddress(address: string): string {
  if (address.length <= 20) return address;
  return `${address.slice(0, 8)}...${address.slice(-9)}`;
}
