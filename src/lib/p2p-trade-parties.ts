/**
 * Utility for deriving counterparty and role information from P2P trades.
 * 
 * The key insight: use matchedAs (matcher's role relative to the ad) and 
 * advertiserId (ad creator) to reliably determine roles and counterparties,
 * rather than relying on type, buyerName, or sellerName.
 */

export interface P2PTrade {
  advertiserId: string;
  matcherId: string;
  buyerName?: string;
  sellerName?: string;
  matchedAs?: "BUY" | "SELL";
}

export interface TradeParties {
  /** Role of the authenticated user in this trade */
  myRole: "BUY" | "SELL";
  /** Role of the counterparty */
  counterpartyRole: "BUY" | "SELL";
  /** Name of the counterparty */
  counterpartyName: string;
  /** Whether the authenticated user is the advertiser */
  isAdvertiser: boolean;
  /** ID of the counterparty */
  counterpartyId: string;
}

/**
 * Derives trade parties (role and counterparty info) for the authenticated user.
 * 
 * @param trade - The P2P trade object
 * @param currentUserId - ID of the authenticated user
 * @returns Object with myRole, counterpartyRole, counterpartyName, and isAdvertiser
 * 
 * @example
 * const trade = {
 *   advertiserId: "0e7bc6a8",
 *   matcherId: "0e6cadc6",
 *   buyerName: "Alice",
 *   sellerName: "Donald Trump",
 *   matchedAs: "SELL"
 * };
 * 
 * const parties = getTradeParties(trade, "0e7bc6a8");
 * // Result:
 * // {
 * //   myRole: "SELL",
 * //   counterpartyRole: "BUY",
 * //   counterpartyName: "Alice",
 * //   isAdvertiser: true,
 * //   counterpartyId: "0e6cadc6"
 * // }
 */
export function getTradeParties(
  trade: P2PTrade,
  currentUserId: string
): TradeParties {
  const isAdvertiser = trade.advertiserId === currentUserId;
  
  // Derive the authenticated user's role:
  // - If they're the advertiser, their role is opposite of matchedAs
  // - If they're the matcher, their role is matchedAs
  const myRole: "BUY" | "SELL" = isAdvertiser
    ? (trade.matchedAs === "BUY" ? "SELL" : "BUY")
    : trade.matchedAs || "BUY"; // Default to BUY if matchedAs is undefined
  
  // Counterparty role is always opposite
  const counterpartyRole: "BUY" | "SELL" = myRole === "BUY" ? "SELL" : "BUY";
  
  // Get counterparty name based on their role
  const counterpartyName = counterpartyRole === "BUY" 
    ? (trade.buyerName || "Buyer")
    : (trade.sellerName || "Seller");
  
  // Counterparty ID is always the other party
  const counterpartyId = isAdvertiser ? trade.matcherId : trade.advertiserId;
  
  return {
    myRole,
    counterpartyRole,
    counterpartyName,
    isAdvertiser,
    counterpartyId,
  };
}

/**
 * Normalizes multiple possible field names to extract a single value.
 * Used for handling API responses that may return fields in different formats.
 */
function extractField<T>(
  sources: (T | null | undefined)[],
  extractor?: (value: T) => string | undefined
): string {
  for (const source of sources) {
    if (!source) continue;
    
    if (typeof source === "string") {
      return source.trim();
    }
    
    if (typeof source === "object" && extractor) {
      const extracted = extractor(source);
      if (extracted) return extracted.trim();
    }
  }
  return "";
}

/**
 * Extracts ID from nested or flat structures commonly returned by the API.
 * Handles fields like: id, userId, user_id, _id, or nested object.id
 */
export function extractId(value: any): string {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    return String(
      value.id ?? 
      value.userId ?? 
      value.user_id ?? 
      value._id ?? 
      ""
    ).trim();
  }
  return "";
}

/**
 * Extracts name from nested or flat structures commonly returned by the API.
 * Handles fields like: name, fullName, firstName + lastName, username, email
 */
export function extractName(value: any): string {
  if (!value) return "";
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "object") {
    const full = [value.firstName, value.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return (
      full ||
      value.fullName ||
      value.name ||
      value.username ||
      value.email ||
      ""
    ).trim();
  }
  return "";
}

/**
 * Compares two IDs for equality, handling both string and object formats.
 */
export function sameId(value1: any, value2: any): boolean {
  const id1 = extractId(value1);
  const id2 = extractId(value2);
  return Boolean(id1 && id2 && id1.toLowerCase() === id2.toLowerCase());
}
