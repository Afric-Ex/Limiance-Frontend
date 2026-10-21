/**
 * Centralized status constants for the application.
 * These should match the backend API status values exactly.
 * When the backend adds new statuses, they should be added here.
 */

export const ORDER_STATUSES = {
  OPEN: "OPEN",
  FILLED: "FILLED",
  PARTIALLY_FILLED: "PARTIALLY_FILLED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
  PENDING: "PENDING",
  EXPIRED: "EXPIRED",
} as const;

export const P2P_ORDER_STATUSES = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID: "PAID",
  RELEASED: "RELEASED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  DISPUTED: "DISPUTED",
  APPEALING: "APPEALING",
} as const;

/** Statuses a P2P trade participant can set on a match via p2p_update_match_status. */
export enum P2PMatchStatus {
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED",
  FULFILLED = "FULFILLED",
}

export const TRANSACTION_STATUSES = {
  COMPLETED: "completed",
  PENDING: "pending",
  PROCESSING: "processing",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
  CONFIRMING: "confirming",
} as const;

export const KYC_STATUSES = {
  APPROVED: "approved",
  VERIFIED: "verified",
  PENDING: "pending",
  REJECTED: "rejected",
  NOT_SUBMITTED: "not_submitted",
  EXPIRED: "expired",
} as const;

export const CONVERSION_STATUSES = {
  CREDITED: "credited",
  PENDING: "pending",
  PROCESSING: "processing",
  FAILED: "failed",
  COMPLETED: "completed",
} as const;

export const REWARD_STATUSES = {
  PENDING: "pending",
  CREDITED: "credited",
  FAILED: "failed",
  EXPIRED: "expired",
  REVERSED: "reversed",
} as const;

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];
export type P2POrderStatus = typeof P2P_ORDER_STATUSES[keyof typeof P2P_ORDER_STATUSES];
export type TransactionStatus = typeof TRANSACTION_STATUSES[keyof typeof TRANSACTION_STATUSES];
export type KycStatus = typeof KYC_STATUSES[keyof typeof KYC_STATUSES];
export type ConversionStatus = typeof CONVERSION_STATUSES[keyof typeof CONVERSION_STATUSES];
export type RewardStatus = typeof REWARD_STATUSES[keyof typeof REWARD_STATUSES];

/**
 * Normalizes a status string to a known enum value, or returns "unknown"
 * if the status is not recognized.
 */
export function normalizeStatus<T extends string>(
  status: string | undefined | null,
  knownStatuses: Record<string, T>
): T | "unknown" {
  if (!status) return "unknown";
  const normalized = status.toLowerCase().replace(/[\s-]+/g, "_");
  return knownStatuses[normalized] ?? "unknown";
}