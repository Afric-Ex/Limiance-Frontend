/**
 * Classification helpers for the unified wallet-flow history surface
 * (`GET wallet/user/transactions_history`, which returns deposits, withdrawals,
 * internal transfers, P2P trades and conversions in one paginated list).
 *
 * The backend's `type` / `method` wording is not a documented closed set, so
 * every check here is substring-based and falls back to the row's structural
 * fields (an address for an on-chain leg, wallet buckets for an internal one)
 * before giving up. That keeps the withdrawal filters working even if the
 * backend renames a value or adds a new one.
 */

export type WithdrawalMethod = "onchain" | "internal";

/** The all-zero address is the backend's "not set" placeholder for hashes. */
const ZERO_ADDRESS = /^0x0{6,}$/i;

const text = (value: unknown): string => String(value ?? "").trim().toLowerCase();

const joinLabels = (...values: unknown[]): string =>
  values.map(text).filter(Boolean).join(" ");

/** Human-readable transaction label, e.g. `internal_transfer` → `internal transfer`. */
export function rowTypeLabel(row: Record<string, any>): string {
  const raw =
    row.type ??
    row.transactionType ??
    row.transaction_type ??
    row.operation ??
    row.method ??
    "";
  return String(raw).replace(/[_-]+/g, " ").trim();
}

/**
 * On-chain vs internal for a row already classified as a withdrawal. Internal
 * legs are explicitly named by the backend across its API (`internal_transfer`,
 * `external_transfer`, `/wallet/internal_transfer`), so their label is trusted
 * first; everything else counts as on-chain, which is the default withdrawal
 * kind and avoids silently hiding rows whose label we do not recognise.
 */
export function withdrawalMethodKind(row: Record<string, any>): WithdrawalMethod {
  const label = joinLabels(
    row.type,
    row.transactionType,
    row.transaction_type,
    row.operation,
    row.method,
    row.direction,
    row.withdrawalType
  );
  if (label.includes("internal")) return "internal";

  // Structural fallback: on-chain legs settle to an address on a network,
  // internal ones only move between wallet buckets on the account.
  const hash = text(row.hash ?? row.txHash ?? row.transactionHash);
  const chain = text(row.chain ?? row.network);
  if ((hash && !ZERO_ADDRESS.test(hash)) || chain) return "onchain";
  if (row.fromBalance || row.toBalance || row.recipientAccount || row.toUserId) {
    return "internal";
  }

  return "onchain";
}
