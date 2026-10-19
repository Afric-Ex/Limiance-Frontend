/**
 * LIM token helpers — pure functions, no React and no network.
 *
 * The token metadata mirrors the backend token registry: LIM (Limiance) is a
 * listed token with a contract on Binance Smart Chain. Everything in this file
 * is deliberately pure so it can be unit-tested with `node --test` and shared
 * between the Earn hub and the Buy LIM flow without pulling in UI code.
 */

export const LIM_SYMBOL = "LIM";
export const LIM_NAME = "Limiance";

/** Display cap for LIM amounts. The token itself has 18 decimals, but no
 *  exchange surface needs to render more than 8 without lying about precision. */
export const LIM_DISPLAY_DECIMALS = 8;

export type AmountValidationError =
  | "empty"
  | "invalid"
  | "negative"
  | "zero"
  | "below_min"
  | "above_max"
  | "insufficient";

export interface AmountValidationResult {
  ok: boolean;
  error: AmountValidationError | null;
}

export interface AmountConstraints {
  /** Spendable balance of the pay asset. Undefined = balance not known yet. */
  balance?: number | null;
  min?: number | null;
  max?: number | null;
}

export const isLimSymbol = (symbol: unknown): boolean =>
  String(symbol ?? "").trim().toUpperCase() === LIM_SYMBOL;

/**
 * Parse a user-entered amount. Returns null for anything that is not a finite
 * non-negative number — callers distinguish "empty" from "invalid" themselves
 * so the inline error can be specific.
 */
export function parseAmount(input: unknown): number | null {
  if (input == null) return null;
  const raw = String(input).trim().replace(/,/g, "");
  if (!raw) return null;
  if (!/^-?\d*\.?\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * Validate a "you pay" amount against the quote constraints. Order matters:
 * malformed input first, then sign/zero, then policy limits, then balance, so
 * the user sees the most fundamental problem first.
 */
export function validateBuyAmount(
  input: unknown,
  constraints: AmountConstraints = {}
): AmountValidationResult {
  const raw = input == null ? "" : String(input).trim();
  if (!raw) return { ok: false, error: "empty" };
  if (raw === "-" || raw === "." || raw === "-.") {
    return { ok: false, error: "invalid" };
  }

  const value = parseAmount(raw);
  if (value == null) return { ok: false, error: "invalid" };
  if (value < 0) return { ok: false, error: "negative" };
  if (value === 0) return { ok: false, error: "zero" };

  const { min, max, balance } = constraints;
  if (min != null && Number.isFinite(min) && value < min) {
    return { ok: false, error: "below_min" };
  }
  if (max != null && Number.isFinite(max) && value > max) {
    return { ok: false, error: "above_max" };
  }
  // Balance is checked last: if the user typed 12 USDT with 10 available, the
  // specific "insufficient balance" message is more actionable than "invalid".
  if (
    balance != null &&
    Number.isFinite(balance) &&
    value > balance + Number.EPSILON
  ) {
    return { ok: false, error: "insufficient" };
  }

  return { ok: true, error: null };
}

/**
 * Estimated output for a conversion quote. `rate` is the server-provided
 * "to-asset units per one from-asset unit" (conversion_rate.baseInQuote).
 * Returns null when the rate or amount is unusable so the UI can show "—"
 * instead of a fabricated number.
 */
export function estimateReceived(
  amount: unknown,
  ratePerUnit: unknown
): number | null {
  const amountValue = parseAmount(amount);
  const rateValue = parseAmount(ratePerUnit);
  if (amountValue == null || rateValue == null) return null;
  if (amountValue <= 0 || rateValue <= 0) return null;
  const received = amountValue * rateValue;
  return Number.isFinite(received) && received > 0 ? received : null;
}

/** Human-readable amount with grouping and trimmed trailing zeros. */
export function formatAmount(
  value: unknown,
  maxDecimals = LIM_DISPLAY_DECIMALS
): string {
  const parsed = typeof value === "number" ? value : parseAmount(value);
  if (parsed == null || !Number.isFinite(parsed)) return "—";
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.max(0, maxDecimals),
  });
}

/**
 * Quick-select percentage of a balance (25/50/75/100 shortcuts). Quantizes
 * down to the pay asset's precision so the value can never exceed the balance
 * even after rounding (100% returns the balance string as-is).
 */
export function percentOfBalance(
  balance: unknown,
  percent: number,
  decimals = 6
): string {
  const parsed = typeof balance === "number" ? balance : parseAmount(balance);
  if (parsed == null || !Number.isFinite(parsed) || parsed <= 0) return "";
  const pct = Math.min(100, Math.max(0, percent));
  if (pct >= 100) return String(parsed);
  const factor = 10 ** decimals;
  const quantized = Math.floor((parsed * pct * factor) / 100) / factor;
  return quantized > 0 ? String(quantized) : "";
}

/**
 * Whether a revalidated rate moved beyond the tolerance the UI is willing to
 * execute without asking again. Default 0.5%.
 */
export function rateDeviationExceeded(
  previousRate: unknown,
  nextRate: unknown,
  tolerancePct = 0.5
): boolean {
  const previous = parseAmount(previousRate);
  const next = parseAmount(nextRate);
  if (previous == null || next == null) return true;
  if (previous <= 0 || next <= 0) return true;
  const deviation = Math.abs(next - previous) / previous;
  return deviation * 100 > tolerancePct;
}

/**
 * Pick the LIM logo from whatever token/portfolio records the app already has.
 * The backend's `listed_tokens` payload exposes one of logo/image/icon; the
 * portfolio coin payload carries `image`. Returns undefined when no real asset
 * exists — callers fall back to a locally rendered monogram, never a fake URL.
 */
export function resolveLimLogo(
  ...sources: Array<unknown[] | null | undefined>
): string | undefined {
  for (const list of sources) {
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      if (!isLimSymbol(record.symbol)) continue;
      const candidate = [record.logo, record.image, record.icon].find(
        (value): value is string => typeof value === "string" && !!value.trim()
      );
      if (candidate) return candidate.trim();
    }
  }
  return undefined;
}

/** Truncate an id/hash for display without hiding that truncation happened. */
export function truncateMiddle(value: unknown, head = 8, tail = 6): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  if (raw.length <= head + tail + 3) return raw;
  return `${raw.slice(0, head)}…${raw.slice(-tail)}`;
}

/** Unwrap `{ data: { data: ... } }` style envelopes without assuming depth. */
function unwrapEnvelope(payload: unknown): any {
  let current: any = payload;
  let guard = 0;
  while (
    current &&
    typeof current === "object" &&
    !Array.isArray(current) &&
    "data" in current &&
    current.data != null &&
    typeof current.data === "object" &&
    guard < 4
  ) {
    current = current.data;
    guard += 1;
  }
  return current ?? payload;
}

export interface ConversionQuote {
  /** To-asset units per one from-asset unit (server-provided). */
  rate: number;
  /** Estimated output for the quoted amount; display-only, never executed. */
  received: number | null;
  amountUsd: number | null;
  amountNgn: number | null;
  /** Optional policy limits when the quote service reports them. */
  minAmount: number | null;
  maxAmount: number | null;
}

/**
 * Normalize a `trading/conversion_rate` response into the quote the Buy LIM
 * flow renders. Returns null when the payload carries an error or no usable
 * rate, so the caller shows "price unavailable" instead of a stale number.
 */
export function normalizeConversionQuote(
  payload: unknown,
  amount?: unknown
): ConversionQuote | null {
  if (!payload || typeof payload !== "object") return null;
  const envelopeError = (payload as any)?.error ?? (payload as any)?.data?.error;
  if (envelopeError) return null;

  const body = unwrapEnvelope(payload);
  const rateBlock = body?.rate ?? body?.Rate ?? body;
  const rateValue = parseAmount(
    rateBlock?.baseInQuote ??
      rateBlock?.base_in_quote ??
      rateBlock?.rate ??
      rateBlock
  );
  if (rateValue == null || rateValue <= 0) return null;

  const valuation = body?.valuation ?? body?.Valuation ?? {};
  const limits = body?.limits ?? body?.Limits ?? {};

  return {
    rate: rateValue,
    received: estimateReceived(amount, rateValue),
    amountUsd:
      parseAmount(valuation.amountUSD ?? valuation.amount_usd ?? valuation.usd),
    amountNgn:
      parseAmount(valuation.amountNGN ?? valuation.amount_ngn ?? valuation.ngn),
    minAmount: parseAmount(
      body?.minAmount ?? body?.min_amount ?? limits.min ?? limits.minimum
    ),
    maxAmount: parseAmount(
      body?.maxAmount ?? body?.max_amount ?? limits.max ?? limits.maximum
    ),
  };
}

export type ConversionOutcome = "credited" | "pending" | "unknown";

export interface ConversionResult {
  outcome: ConversionOutcome;
  /** Actual received amount when the server reports one. */
  received: number | null;
  paid: number | null;
  reference?: string;
  /** Server-reported status string, verbatim. */
  status?: string;
  message?: string;
}

const PENDING_STATUSES = [
  "pending",
  "processing",
  "in_progress",
  "confirming",
  "queued",
  "submitted",
  "open",
];
const SETTLED_STATUSES = ["credited", "completed", "success", "successful", "filled", "done"];

/**
 * Normalize a `wallet/convert_asset` execution response. The authoritative
 * outcome is whichever the server reports; when it reports neither a settled
 * status nor an amount, the outcome stays "unknown" and the UI shows a
 * reconcile-before-retry state rather than claiming success.
 */
export function normalizeConversionResult(payload: unknown): ConversionResult {
  const body = unwrapEnvelope(payload);
  const record = body && typeof body === "object" ? body : {};

  const received = parseAmount(
    record.toAmount ??
      record.to_amount ??
      record.receivedAmount ??
      record.received_amount ??
      record.amountReceived ??
      record.creditedAmount ??
      record.destinationAmount
  );
  const paid = parseAmount(
    record.fromAmount ?? record.from_amount ?? record.paidAmount ?? record.amount
  );
  const statusRaw =
    record.status ?? record.state ?? record.transactionStatus ?? record.transaction_status;
  const status = typeof statusRaw === "string" ? statusRaw.trim().toLowerCase() : undefined;
  const reference =
    (typeof record.id === "string" && record.id) ||
    (typeof record.transactionId === "string" && record.transactionId) ||
    (typeof record.transactionReference === "string" && record.transactionReference) ||
    (typeof record.reference === "string" && record.reference) ||
    undefined;
  const message =
    typeof record.message === "string" && record.message.trim()
      ? record.message.trim()
      : undefined;

  let outcome: ConversionOutcome = "unknown";
  if (received != null) {
    outcome = "credited";
  } else if (status && PENDING_STATUSES.some((s) => status.includes(s))) {
    outcome = "pending";
  } else if (status && SETTLED_STATUSES.some((s) => status.includes(s))) {
    // Settled without a reported amount: credit is certain, amount unknown.
    outcome = "credited";
  }

  return { outcome, received, paid, reference, status, message };
}
