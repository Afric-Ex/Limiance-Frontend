import { sanitizeText } from "../snapshot/redact";

/**
 * Only these fields are ever allowed in a P2P snapshot.
 * Anything else on the source order (payment details, chat, proofs, contact
 * info, dispute content) must never reach the card.
 */
export interface P2PShareData {
  asset: string;
  fiat: string;
  amount: number;
  unitPrice: number;
  total: number;
  status: string;
  maskedOrderNumber: string;
  counterparty: string;
  time: Date;
}

/** Primitive-only overrides for values the page derives instead of reading raw. */
export interface P2PShareContext {
  counterparty?: string;
  orderNumber?: string;
  unitPrice?: number;
  total?: number;
  fiat?: string;
  status?: string;
  time?: Date | string | number;
}

const ORDER_NUMBER_MASK = "******";

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return "";
}

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : parseFloat(toText(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? fallback : value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

export function maskOrderNumber(value: unknown): string {
  const raw = toText(value).replace(/^#/, "");
  // Never expose a short id in full; only ids longer than the mask reveal a tail.
  if (raw.length <= 6) return ORDER_NUMBER_MASK;
  return `${ORDER_NUMBER_MASK}${raw.slice(-6).toUpperCase()}`;
}

export function toP2PShareData(order: any, context: P2PShareContext = {}): P2PShareData {
  const now = new Date();

  const asset = toText(order?.asset).toUpperCase();
  const rawFiat =
    context.fiat ?? (toText(order?.fiatCurrency) || toText(order?.currency) || toText(order?.fiat));
  const fiat = rawFiat.toUpperCase();
  const amount = toNumber(order?.quantity ?? order?.amount);
  const rawUnitPrice =
    context.unitPrice ?? toNumber(order?.price ?? order?.unitPrice ?? order?.fixedPrice);
  const unitPrice = toNumber(rawUnitPrice);
  const rawTotal = context.total ?? toNumber(order?.fiatAmount);
  const total = toNumber(rawTotal) || amount * unitPrice;
  const status = (context.status ?? toText(order?.status)).toUpperCase();
  const orderNumber =
    context.orderNumber ?? (toText(order?.orderId) || toText(order?.id));
  const counterparty = sanitizeText(toText(context.counterparty ?? order?.counterpartyName)).trim();
  const time = toDate(context.time ?? order?.createdAt ?? order?.matchedAt, now);

  return {
    asset,
    fiat,
    amount,
    unitPrice,
    total,
    status,
    maskedOrderNumber: maskOrderNumber(orderNumber),
    counterparty,
    time,
  };
}
