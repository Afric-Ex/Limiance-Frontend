export interface MarketPrecisionRules {
  pricePrecision: number;
  tickSize: number;
  quantityPrecision: number;
  lotSize: number;
  minOrderQty: number;
  minNotional: number;
}

export const DEFAULT_MARKET_PRECISION: MarketPrecisionRules = {
  pricePrecision: 6,
  tickSize: 0,
  quantityPrecision: 6,
  lotSize: 0,
  minOrderQty: 0,
  minNotional: 0,
};

interface ScaledDecimal {
  digits: bigint;
  scale: number;
}

const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);
const BIGINT_TWO = BigInt(2);
const BIGINT_TEN = BigInt(10);

function toFinitePositiveOrZero(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function toFiniteIntegerInRange(raw: unknown, min: number, max: number): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  const truncated = Math.trunc(n);
  if (truncated < min || truncated > max) return null;
  return truncated;
}

/**
 * Extracts market precision and step rules from a market item or listed pair payload.
 */
export function extractMarketPrecision(
  raw: Record<string, unknown> | null | undefined,
  fallback: MarketPrecisionRules = DEFAULT_MARKET_PRECISION
): MarketPrecisionRules {
  if (!raw) return { ...fallback };

  const pricePrecision =
    toFiniteIntegerInRange(
      raw.price_precision ?? raw.pricePrecision ?? raw.price_decimals ?? raw.priceDecimals,
      0,
      12
    ) ?? fallback.pricePrecision;

  const quantityPrecision =
    toFiniteIntegerInRange(
      raw.quantity_precision ?? raw.quantityPrecision ?? raw.quantity_decimals ?? raw.quantityDecimals,
      0,
      12
    ) ?? fallback.quantityPrecision;

  const tickSize =
    toFinitePositiveOrZero(raw.tick_size ?? raw.tickSize) ?? fallback.tickSize;

  const lotSize =
    toFinitePositiveOrZero(raw.lot_size ?? raw.lotSize ?? raw.step_size ?? raw.stepSize) ??
    fallback.lotSize;

  const minOrderQty =
    toFinitePositiveOrZero(raw.min_order_qty ?? raw.minOrderQty ?? raw.min_qty ?? raw.minQty) ??
    fallback.minOrderQty;

  const minNotional =
    toFinitePositiveOrZero(raw.min_notional ?? raw.minNotional) ?? fallback.minNotional;

  return {
    pricePrecision,
    tickSize,
    quantityPrecision,
    lotSize,
    minOrderQty,
    minNotional,
  };
}

function parseScaledDecimal(input: string | number): ScaledDecimal | null {
  let text = typeof input === "number" ? input.toString() : String(input).trim();
  if (!text) return null;
  if (text.startsWith("+")) text = text.slice(1);
  if (text.startsWith("-")) return null;
  if (text === "NaN" || text === "Infinity") return null;

  const expMatch = /^(\d+(?:\.\d*)?|\.\d+)[eE]([+-]?\d+)$/.exec(text);
  let mantissa = text;
  let exponent = 0;

  if (expMatch) {
    mantissa = expMatch[1];
    exponent = Number.parseInt(expMatch[2], 10);
    if (!Number.isFinite(exponent)) return null;
  } else if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(mantissa)) {
    return null;
  }

  const dotIdx = mantissa.indexOf(".");
  const intPart = dotIdx === -1 ? mantissa : mantissa.slice(0, dotIdx);
  const fracPart = dotIdx === -1 ? "" : mantissa.slice(dotIdx + 1);
  const combined = `${intPart || "0"}${fracPart}`;
  if (!/^\d+$/.test(combined)) return null;

  let digits = BigInt(combined);
  let scale = fracPart.length - exponent;

  if (scale < 0) {
    digits = digits * pow10(-scale);
    scale = 0;
  }

  while (scale > 0 && digits % BIGINT_TEN === BIGINT_ZERO) {
    digits /= BIGINT_TEN;
    scale -= 1;
  }
  if (digits === BIGINT_ZERO) scale = 0;

  return { digits, scale };
}

function pow10(n: number): bigint {
  return BigInt(`1${"0".repeat(Math.max(0, n))}`);
}

function formatScaledDecimal(digits: bigint, scale: number, trimTrailingZeros = true): string {
  if (digits === BIGINT_ZERO) return "0";
  if (scale <= 0) {
    return `${digits.toString()}${"0".repeat(-scale)}`;
  }

  const raw = digits.toString().padStart(scale + 1, "0");
  const intPart = raw.slice(0, raw.length - scale);
  let fracPart = raw.slice(raw.length - scale);
  if (trimTrailingZeros) {
    fracPart = fracPart.replace(/0+$/, "");
  }
  return fracPart.length > 0 ? `${intPart}.${fracPart}` : intPart;
}

/**
 * Counts significant fractional decimal places (supports scientific notation cleanly).
 */
export function countDecimalPlaces(value: string | number): number {
  const parsed = parseScaledDecimal(value);
  return parsed ? parsed.scale : 0;
}

/**
 * Validates partial/complete decimal text typed into an input constrained to `maxDecimals`.
 */
export function isValidDecimalInput(value: string, maxDecimals: number): boolean {
  if (value === "") return true;
  const clamped = Math.max(0, Math.min(12, Math.trunc(maxDecimals)));
  if (clamped === 0) {
    return /^\d+$/.test(value);
  }
  const regex = new RegExp(`^\\d*(?:\\.\\d{0,${clamped}})?$`);
  return regex.test(value);
}

/**
 * Checks whether `value` is an exact integer multiple of `step` without float modulo inaccuracy.
 */
export function isMultipleOfStep(value: string | number, step: number): boolean {
  if (!Number.isFinite(step) || step <= 0) return true;
  const parsedVal = parseScaledDecimal(value);
  const parsedStep = parseScaledDecimal(step);
  if (!parsedVal || !parsedStep || parsedStep.digits === BIGINT_ZERO) return false;

  const commonScale = Math.max(parsedVal.scale, parsedStep.scale);
  const valScaled = parsedVal.digits * pow10(commonScale - parsedVal.scale);
  const stepScaled = parsedStep.digits * pow10(commonScale - parsedStep.scale);
  if (stepScaled === BIGINT_ZERO) return true;
  return valScaled % stepScaled === BIGINT_ZERO;
}

/**
 * Snaps a positive numeric value to `step` (if > 0) and clamps fractional digits to `precision`.
 * Returns a plain decimal string (never scientific notation) suitable for controlled inputs.
 */
export function snapToStep(
  value: string | number,
  step: number,
  precision: number,
  mode: "floor" | "round" | "ceil" = "round"
): string {
  const parsedVal = parseScaledDecimal(value);
  if (!parsedVal) return "";
  if (parsedVal.digits === BIGINT_ZERO) return "0";

  const clampedPrecision = Math.max(0, Math.min(12, Math.trunc(precision)));

  if (!Number.isFinite(step) || step <= 0) {
    if (parsedVal.scale <= clampedPrecision) {
      return formatScaledDecimal(parsedVal.digits, parsedVal.scale, true);
    }
    const drop = pow10(parsedVal.scale - clampedPrecision);
    let q = parsedVal.digits / drop;
    const rem = parsedVal.digits % drop;
    if (mode === "ceil" && rem > BIGINT_ZERO) q += BIGINT_ONE;
    else if (mode === "round" && rem * BIGINT_TWO >= drop) q += BIGINT_ONE;
    return formatScaledDecimal(q, clampedPrecision, true);
  }

  const parsedStep = parseScaledDecimal(step);
  if (!parsedStep || parsedStep.digits === BIGINT_ZERO) {
    return formatScaledDecimal(parsedVal.digits, parsedVal.scale, true);
  }

  const commonScale = Math.max(parsedVal.scale, parsedStep.scale);
  const valScaled = parsedVal.digits * pow10(commonScale - parsedVal.scale);
  const stepScaled = parsedStep.digits * pow10(commonScale - parsedStep.scale);

  let q = valScaled / stepScaled;
  const rem = valScaled % stepScaled;
  if (mode === "ceil" && rem > BIGINT_ZERO) q += BIGINT_ONE;
  else if (mode === "round" && rem * BIGINT_TWO >= stepScaled) q += BIGINT_ONE;

  const snappedDigits = q * parsedStep.digits;
  const snappedScale = parsedStep.scale;
  if (snappedScale <= clampedPrecision) {
    return formatScaledDecimal(snappedDigits, snappedScale, true);
  }
  const drop = pow10(snappedScale - clampedPrecision);
  return formatScaledDecimal(snappedDigits / drop, clampedPrecision, true);
}

/**
 * Builds 4 orderbook grouping increments starting at `tickSize` (when > 0).
 */
export function buildOrderBookSteps(tickSize: number, pricePrecision: number): number[] {
  if (!Number.isFinite(tickSize) || tickSize <= 0) {
    const clamped = Math.max(0, Math.min(12, Math.trunc(pricePrecision)));
    return Array.from({ length: 4 }, (_, i) => {
      const exp = i - clamped;
      return exp >= 0 ? 10 ** exp : Number((10 ** exp).toFixed(Math.abs(exp)));
    });
  }

  const parsedTick = parseScaledDecimal(tickSize);
  if (!parsedTick || parsedTick.digits === BIGINT_ZERO) {
    return [0.01, 0.1, 1, 10];
  }

  return Array.from({ length: 4 }, (_, i) => {
    const newScale = parsedTick.scale - i;
    const text = formatScaledDecimal(parsedTick.digits, newScale, true);
    return Number(text);
  });
}

/**
 * Formats a price with fixed fractional digits derived from `pricePrecision`.
 */
export function formatPrecisionPrice(value: number | null | undefined, pricePrecision: number): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "--";
  const clamped = Math.max(0, Math.min(12, Math.trunc(pricePrecision)));
  return value.toLocaleString("en-US", {
    minimumFractionDigits: clamped,
    maximumFractionDigits: clamped,
  });
}

export interface ValidateOrderPrecisionParams {
  rules: MarketPrecisionRules;
  price?: string | number | null;
  stopPrice?: string | number | null;
  quantity?: string | number | null;
  takeProfit?: string | number | null;
  stopLoss?: string | number | null;
  isQuoteMarketBuy?: boolean;
  skipPriceCheck?: boolean;
  effectiveMarketPrice?: number | null;
  priceLabel?: string;
}

function validatePriceField(
  raw: string | number | null | undefined,
  label: string,
  rules: MarketPrecisionRules
): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return `${label} must be greater than 0`;

  const dp = countDecimalPlaces(raw);
  if (dp > rules.pricePrecision) {
    return `${label} allows at most ${rules.pricePrecision} decimal place(s)`;
  }
  if (rules.tickSize > 0 && !isMultipleOfStep(raw, rules.tickSize)) {
    return `${label} must be a multiple of tick size ${rules.tickSize}`;
  }
  return null;
}

/**
 * Validates order prices, quantity, lot size, min order qty, and min notional against market rules.
 */
export function validateOrderPrecision(params: ValidateOrderPrecisionParams): string | null {
  const {
    rules,
    price,
    stopPrice,
    quantity,
    takeProfit,
    stopLoss,
    isQuoteMarketBuy = false,
    skipPriceCheck = false,
    effectiveMarketPrice = null,
    priceLabel = "Price",
  } = params;

  if (!skipPriceCheck && price !== null && price !== undefined && price !== "") {
    const err = validatePriceField(price, priceLabel, rules);
    if (err) return err;
  }

  if (stopPrice !== null && stopPrice !== undefined && stopPrice !== "") {
    const err = validatePriceField(stopPrice, "Trigger price", rules);
    if (err) return err;
  }

  if (takeProfit !== null && takeProfit !== undefined && takeProfit !== "") {
    const err = validatePriceField(takeProfit, "Take profit price", rules);
    if (err) return err;
  }

  if (stopLoss !== null && stopLoss !== undefined && stopLoss !== "") {
    const err = validatePriceField(stopLoss, "Stop loss price", rules);
    if (err) return err;
  }

  if (quantity !== null && quantity !== undefined && quantity !== "") {
    const qtyNum = typeof quantity === "number" ? quantity : Number(quantity);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      return "Quantity must be greater than 0";
    }

    if (isQuoteMarketBuy) {
      if (rules.minNotional > 0 && qtyNum < rules.minNotional) {
        return `Order total must be at least ${rules.minNotional}`;
      }
      return null;
    }

    const qtyDp = countDecimalPlaces(quantity);
    if (qtyDp > rules.quantityPrecision) {
      return `Quantity allows at most ${rules.quantityPrecision} decimal place(s)`;
    }
    if (rules.lotSize > 0 && !isMultipleOfStep(quantity, rules.lotSize)) {
      return `Quantity must be a multiple of lot size ${rules.lotSize}`;
    }
    if (rules.minOrderQty > 0 && qtyNum < rules.minOrderQty) {
      return `Quantity must be at least ${rules.minOrderQty}`;
    }

    const refPrice =
      !skipPriceCheck && price !== null && price !== undefined && price !== ""
        ? Number(price)
        : effectiveMarketPrice;

    if (rules.minNotional > 0 && refPrice !== null && Number.isFinite(refPrice) && refPrice > 0) {
      const notional = qtyNum * refPrice;
      if (notional + 1e-12 < rules.minNotional) {
        return `Order value must be at least ${rules.minNotional}`;
      }
    }
  }

  return null;
}
