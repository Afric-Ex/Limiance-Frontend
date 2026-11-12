"use client";

import { Modal } from "@mantine/core";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  MdOutlineArrowDownward,
  MdOutlineArrowUpward,
  MdOutlineReceiptLong,
  MdOutlineSwapHoriz,
} from "react-icons/md";
import { Copy } from "@/src/components/shared/copy";
import { parseDate } from "@/src/lib/parse-date";
import {
  isZeroAddress,
  truncateCryptoAddress,
} from "@/src/utils/truncate-address";
import { formatTransactionAmount } from "@/src/utils/transaction";

/** Raw transaction record as returned by the history endpoints. */
export type TransactionRecord = Record<string, any>;

interface TransactionDetailsModalProps {
  /** The selected transaction; `null` keeps the modal closed. */
  transaction: TransactionRecord | null;
  onClose: () => void;
}

const STATUS_TONES: Record<string, string> = {
  completed: "border-success-6/25 bg-success-6/10 text-success-6",
  success: "border-success-6/25 bg-success-6/10 text-success-6",
  successful: "border-success-6/25 bg-success-6/10 text-success-6",
  credited: "border-success-6/25 bg-success-6/10 text-success-6",
  paid: "border-success-6/25 bg-success-6/10 text-success-6",
  pending: "border-warning-1/25 bg-warning-1/10 text-warning-1",
  processing: "border-warning-1/25 bg-warning-1/10 text-warning-1",
  confirming: "border-warning-1/25 bg-warning-1/10 text-warning-1",
  failed: "border-error-1/25 bg-error-1/10 text-error-1",
  rejected: "border-error-1/25 bg-error-1/10 text-error-1",
  cancelled: "border-error-1/25 bg-error-1/10 text-error-1",
  canceled: "border-error-1/25 bg-error-1/10 text-error-1",
};

type Translate = (key: string) => string;

const STATUS_LABEL_KEYS: Record<string, string> = {
  completed: "statusCompleted",
  success: "statusSuccessful",
  successful: "statusSuccessful",
  credited: "statusCredited",
  paid: "statusPaid",
  pending: "statusPending",
  processing: "statusProcessing",
  confirming: "statusConfirming",
  failed: "statusFailed",
  rejected: "statusRejected",
  cancelled: "statusCancelled",
  canceled: "statusCanceled",
};

const TYPE_LABEL_KEYS: Record<string, string> = {
  p2p: "typeP2pTrade",
  p2p_trade: "typeP2pTrade",
  deposit: "typeDeposit",
  withdrawal: "typeWithdrawal",
  withdraw: "typeWithdrawal",
  internal: "typeInternalTransfer",
  internal_transfer: "typeInternalTransfer",
  transfer: "typeTransfer",
  conversion: "typeConversion",
  convert: "typeConversion",
  swap: "typeSwap",
  fiat_deposit: "typeFiatDeposit",
  fiat_withdrawal: "typeFiatWithdrawal",
  reward: "typeReward",
  commission: "typeCommission",
};

const BALANCE_LABEL_KEYS: Record<string, string> = {
  spot_balance: "balanceSpot",
  funding_balance: "balanceFunding",
  locked_balance: "balanceLocked",
  futures_balance: "balanceFutures",
  margin_balance: "balanceMargin",
  p2p_balance: "balanceP2p",
  main_balance: "balanceMain",
};

const statusLabelFor = (t: Translate, status: string): string => {
  const key = STATUS_LABEL_KEYS[status.toLowerCase()];
  return key ? t(key) : status;
};

const balanceLabelFor = (t: Translate, value: string): string => {
  const key = BALANCE_LABEL_KEYS[value.toLowerCase()];
  return key ? t(key) : value;
};

const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    // Go zero-time means "not set" — treat it as empty.
    if (text && !text.startsWith("0001-01-01")) return text;
  }
  return "";
};

// The all-zero address is the backend's "not set" placeholder.
const firstAddress = (...values: unknown[]): string => {
  for (const value of values) {
    const text = firstText(value);
    if (text && !isZeroAddress(text)) return text;
  }
  return "";
};

const amountText = (value: unknown): string => {
  const text = firstText(value);
  return text ? formatTransactionAmount(text) : "";
};

const humanize = (value: string): string => {
  const text = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!text) return "";
  return text
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === "id") return "ID";
      if (lower === "p2p") return "P2P";
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

const normalizeSide = (value: string): "Buy" | "Sell" | "" => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "buy" || normalized.startsWith("buy")) return "Buy";
  if (normalized === "sell" || normalized.startsWith("sell")) return "Sell";
  return "";
};

type MetadataFields = Record<string, unknown>;

const metaValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return firstText(value);
};

const parseMetadata = (value: unknown): MetadataFields | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as MetadataFields;
  }
  const text = String(value).trim();
  if (!text || text === "{}" || text === "null") return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as MetadataFields;
    }
  } catch {
    // Not JSON — keep the raw value visible as a note below.
  }
  return { note: text };
};

const formatTimestamp = (value: unknown): string => {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const StatusBadge = ({ status }: { status: string }) => {
  const t = useTranslations("Transactions");
  const key = status.toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.12em] ${
        STATUS_TONES[key] ?? "border-white/[0.08] bg-white/[0.04] text-white/50"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabelFor(t, status)}
    </span>
  );
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-t border-white/[0.06] px-4 py-4">
    <h3 className="mb-1.5 flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.16em] text-white/30">
      <span className="h-3 w-0.5 rounded-full bg-primary/70" />
      {title}
    </h3>
    <div className="flex flex-col divide-y divide-white/[0.04]">
      {children}
    </div>
  </section>
);

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 py-2.5">
    <span className="shrink-0 pt-px text-xs font-medium text-white/40">
      {label}
    </span>
    <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right text-caption font-semibold text-white/85 [overflow-wrap:anywhere]">
      {children}
    </div>
  </div>
);

const IdValue = ({ value }: { value: string }) => (
  <span className="flex min-w-0 items-center justify-end gap-1.5">
    <span className="break-all font-mono text-micro font-medium text-white/75">
      {value}
    </span>
    <Copy text={value} color="var(--primary)" />
  </span>
);

const PartyValue = ({
  id,
  role,
  isYou,
}: {
  id: string;
  role?: string;
  isYou: boolean;
}) => {
  const t = useTranslations("Transactions");
  return (
    <span className="flex min-w-0 items-center justify-end gap-1.5">
      {role && (
        <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-white/45">
          {role}
        </span>
      )}
      {isYou && (
        <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-primary">
          {t("you")}
        </span>
      )}
    <span className="break-all font-mono text-micro font-medium text-white/75">
      {id}
    </span>
    <Copy text={id} color="var(--primary)" />
  </span>
  );
};

const accountLabel = (t: Translate, value: string): string => {
  if (!value || isZeroAddress(value)) return "";
  const known = BALANCE_LABEL_KEYS[value.toLowerCase()];
  if (known) return balanceLabelFor(t, value);
  if (value.startsWith("0x") || value.length > 32) return truncateCryptoAddress(value);
  return humanize(value);
};

const AccountValue = ({ raw, label }: { raw: string; label: string }) =>
  raw.startsWith("0x") ? <IdValue value={raw} /> : <span>{label}</span>;

/**
 * Transaction details modal shared by every history surface (crypto deposits
 * and withdrawals, fiat deposits and withdrawals, funding records, and the
 * recent-activity widgets). It renders tolerantly: any field the backend did
 * not return is simply omitted, so one modal covers every record shape.
 */
export const TransactionDetailsModal = ({
  transaction,
  onClose,
}: TransactionDetailsModalProps) => {
  const t = useTranslations("Transactions");
  const tx = transaction ?? {};
  const metadata = parseMetadata(tx.metadata);

  const readMeta = (key: string): string => {
    if (!metadata) return "";
    const entry = Object.entries(metadata).find(
      ([name]) => name.toLowerCase() === key
    );
    return entry ? metaValue(entry[1]) : "";
  };

  const type = firstText(tx.type, tx.transactionType, tx.operation);
  const status = firstText(tx.status, tx.state);
  const typeKey = TYPE_LABEL_KEYS[type.toLowerCase()];
  const typeLabel = typeKey ? t(typeKey) : type ? humanize(type) : "";

  const amount = firstText(
    tx.amount,
    tx.quantity,
    readMeta("quantity"),
    tx.toAmount,
    tx.fromAmount
  );
  const assetSymbol = firstText(
    tx.coin,
    tx.asset,
    tx.symbol,
    tx.toAsset,
    tx.fromAsset,
    tx.base,
    readMeta("asset")
  ).toUpperCase();
  const fiatAmount = firstText(tx.fiatAmount);
  const currency = firstText(tx.currency, tx.fiatCurrency).toUpperCase();
  const receivedAmount = firstText(tx.assetAmount);
  const receivedSymbol = firstText(
    tx.asset,
    tx.coin,
    tx.symbol,
    tx.toAsset,
    readMeta("asset")
  ).toUpperCase();
  const displayAssetSymbol =
    assetSymbol.length > 16 ? truncateCryptoAddress(assetSymbol) : assetSymbol;
  const displayReceivedSymbol =
    receivedSymbol.length > 16
      ? truncateCryptoAddress(receivedSymbol)
      : receivedSymbol;
  const isFiat = !!(fiatAmount || currency);

  const metaRole = readMeta("role");
  const metaType = readMeta("type");
  const metaNote = readMeta("note");
  const side = normalizeSide(metaRole || metaType || metaNote);
  const description = readMeta("description");

  const normalizedType = type.toLowerCase();
  const isIncoming =
    side === "Buy" ||
    normalizedType.includes("deposit") ||
    normalizedType.includes("buy") ||
    normalizedType.includes("received");
  const isOutgoing =
    side === "Sell" ||
    normalizedType.includes("withdraw") ||
    normalizedType.includes("sell") ||
    normalizedType.includes("send");
  const direction: "in" | "out" | "neutral" = isOutgoing
    ? "out"
    : isIncoming
      ? "in"
      : "neutral";
  const directionKey =
    direction === "in" ? "incoming" : direction === "out" ? "outgoing" : "";
  const directionLabel = directionKey ? t(directionKey) : "";

  const heroTone =
    direction === "out"
      ? "border-error-1/25 bg-error-1/10 text-error-1"
      : direction === "in"
        ? "border-success-6/25 bg-success-6/10 text-success-6"
        : "border-primary/25 bg-primary/10 text-primary";

  const primaryAmount = isFiat ? amountText(fiatAmount) : amountText(amount);
  const primarySymbol = isFiat ? currency : displayAssetSymbol;

  const createdAt = formatTimestamp(firstText(tx.createdAt, tx.created_at));
  const completedAt = formatTimestamp(
    firstText(tx.completedAt, tx.completed_at)
  );
  const updatedAt = formatTimestamp(firstText(tx.updatedAt, tx.updated_at));
  const failedAt = formatTimestamp(firstText(tx.failedAt, tx.failed_at));
  const failureReason = firstText(tx.failureReason, tx.failure_reason);
  const rate = firstText(tx.rate);
  const fee = firstText(tx.fee, tx.networkFee, tx.feeAmount);
  const feeSymbol = firstText(
    tx.feeAsset,
    tx.feeCurrency,
    primarySymbol
  ).toUpperCase();

  const transactionId = firstText(tx.id, tx.transactionId, tx.txId);
  const walletId = firstText(tx.walletId, tx.wallet_id);
  const reference = firstText(
    tx.reference,
    tx.transactionReference,
    tx.txRef
  );
  const orderId = readMeta("order_id");
  const orderMatchId = readMeta("order_match_id");
  const network = firstText(tx.chain, tx.network).toUpperCase();
  const wallet = firstAddress(
    tx.wallet,
    tx.walletAddress,
    tx.wallet_address,
    readMeta("depositAddress"),
    readMeta("withdrawalAddress"),
    tx.toBalance,
    tx.fromBalance,
    tx.fromWallet,
    tx.fromAddress
  );
  const hash = firstAddress(tx.hash, tx.transactionHash, tx.txHash);
  const address = firstAddress(
    tx.destination,
    tx.address,
    tx.toAddress,
    readMeta("destination"),
    readMeta("withdrawalAddress"),
    tx.toBalance,
    readMeta("depositAddress")
  );

  const bankName = firstText(tx.bankName, tx.bank);
  const accountName = firstText(tx.accountName);
  const accountNumber = firstText(tx.accountNumber);

  const advertiserId = readMeta("advertiser_id");
  const matcherId = readMeta("matcher_id");
  const ownerId = firstText(tx.userId);
  const fromUser = firstText(tx.fromUserId, advertiserId);
  const toUser = firstText(tx.toUserId, matcherId);
  const fromRole =
    fromUser && advertiserId && fromUser === advertiserId
      ? t("advertiser")
      : undefined;
  const toRole =
    toUser && matcherId && toUser === matcherId ? t("matcher") : undefined;

  const fromAccountRaw = firstText(tx.fromBalance, tx.from);
  const toAccountRaw = firstText(tx.toBalance, tx.to);
  const fromAccount = accountLabel(t, fromAccountRaw);
  const toAccount = accountLabel(t, toAccountRaw);
  const fromAsset = firstText(
    tx.fromAsset,
    tx.asset,
    readMeta("asset")
  ).toUpperCase();
  const toAsset = firstText(tx.toAsset, tx.asset, readMeta("asset")).toUpperCase();
  const fromAmount = firstText(tx.fromAmount);
  const toAmount = firstText(tx.toAmount);
  const orderType = firstText(tx.orderType, tx.order_type);
  const orderMarket = firstText(tx.marketType, tx.market_type, tx.market);
  const orderSide = firstText(tx.side);
  const orderPrice = firstText(tx.price);
  const averagePrice = firstText(tx.avgPrice, tx.averagePrice, tx.avg_price);
  const filledQuantity = firstText(
    tx.cumExecQty,
    tx.filledQuantity,
    tx.executedQty,
    tx.fillQty
  );
  const remainingQuantity = firstText(tx.leavesQty, tx.remainingQty);
  const executionValue = firstText(tx.cumExecValue, tx.executedValue);
  const executionFee = firstText(tx.cumExecFee, tx.fillFee);
  const executionFeeCurrency = firstText(tx.feeCurrency, tx.feeAsset, tx.quote);
  const closedPnl = firstText(tx.closedPnl);
  const orderStatus = firstText(tx.orderStatus, tx.status);
  const clientOrderId = firstText(tx.clientOrderId, tx.client_order_id);
  const timeInForce = firstText(tx.timeInForce, tx.time_in_force);
  const pair = firstText(tx.pair, tx.symbol) ||
    [firstText(tx.base), firstText(tx.quote)].filter(Boolean).join("/");
  const hasOrderDetails = Boolean(
    orderType || orderMarket || orderSide || orderPrice || averagePrice || amount ||
    filledQuantity || remainingQuantity || executionValue || executionFee || closedPnl ||
    orderStatus || clientOrderId || timeInForce || tx.postOnly !== undefined ||
    tx.reduceOnly !== undefined || tx.stopLoss || tx.takeProfit
  );
  const showFromAmount = Boolean(fromAmount);
  const showToAmount = Boolean(toAmount);
  const hasTransfer = Boolean(
    fromAccount ||
      toAccount ||
      fromUser ||
      toUser ||
      showFromAmount ||
      showToAmount
  );

  const quantity = readMeta("quantity");
  const metadataEntries = metadata
    ? Object.entries(metadata).filter(([key, value]) => {
        const normalized = key.toLowerCase();
        if (
          normalized === "quantity" ||
          normalized === "role" ||
          normalized === "type" ||
          normalized === "note"
        ) {
          return false;
        }
        return metaValue(value) !== "";
      })
    : [];
  const showNote = !!metaNote && !normalizeSide(metaNote);
  const hasAdditional =
    !!quantity ||
    !!metaRole ||
    !!metaType ||
    showNote ||
    metadataEntries.length > 0;

  // Any top-level field we do not render explicitly is still surfaced so no
  // part of the API response is silently dropped.
  const renderedKeys = new Set([
    "amount",
    "quantity",
    "coin",
    "asset",
    "symbol",
    "fiatamount",
    "currency",
    "fiatcurrency",
    "assetamount",
    "type",
    "transactiontype",
    "operation",
    "status",
    "state",
    "createdat",
    "created_at",
    "completedat",
    "completed_at",
    "updatedat",
    "updated_at",
    "failedat",
    "failed_at",
    "failurereason",
    "failure_reason",
    "rate",
    "fee",
    "networkfee",
    "feeamount",
    "feeasset",
    "feecurrency",
    "id",
    "transactionid",
    "txid",
    "reference",
    "transactionreference",
    "txref",
    "chain",
    "network",
    "wallet",
    "fromwallet",
    "fromaddress",
    "hash",
    "transactionhash",
    "txhash",
    "destination",
    "address",
    "toaddress",
    "bankname",
    "bank",
    "accountname",
    "accountnumber",
    "fromuserid",
    "touserid",
    "userid",
    "frombalance",
    "from",
    "tobalance",
    "to",
    "fromamount",
    "toamount",
    "fromasset",
    "toasset",
    "metadata",
    "pair",
    "base",
    "quote",
    "walletid",
    "wallet_id",
    "ordertype",
    "order_type",
    "markettype",
    "market_type",
    "market",
    "side",
    "price",
    "avgprice",
    "averageprice",
    "avg_price",
    "filledquantity",
    "executedqty",
    "fillqty",
    "leavesqty",
    "remainingqty",
    "cumexecqty",
    "cumexecvalue",
    "executedvalue",
    "cumexecfee",
    "fillfee",
    "closedpnl",
    "orderstatus",
    "clientorderid",
    "client_order_id",
    "timeinforce",
    "time_in_force",
    "postonly",
    "reduceonly",
    "stoploss",
    "takeprofit",
  ]);
  const otherEntries = Object.entries(tx).filter(([key, value]) => {
    if (renderedKeys.has(key.toLowerCase())) return false;
    if (value === null || value === undefined || value === "") return false;
    return true;
  });
  const showOther = otherEntries.length > 0;

  const showOverview = Boolean(
    typeLabel ||
      status ||
      assetSymbol ||
      amountText(amount) ||
      directionLabel ||
      fee ||
      createdAt ||
      completedAt ||
      updatedAt ||
      failedAt ||
      failureReason ||
      rate ||
      (isFiat && primaryAmount)
  );
  const showReferences = Boolean(
    transactionId ||
      orderId ||
      orderMatchId ||
      advertiserId ||
      matcherId ||
      reference ||
      network ||
      hash ||
      wallet ||
      address
  );
  const showBank = Boolean(bankName || accountName || accountNumber);

  return (
    <Modal
      opened={!!transaction}
      onClose={onClose}
      centered
      size={520}
      overlayProps={{ backgroundOpacity: 0.72, blur: 4 }}
      title={
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <MdOutlineReceiptLong size={16} />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-bold leading-tight text-white">
              {t("detailsTitle")}
            </span>
            <span className="text-2xs font-medium leading-tight text-white/35">
              {t("detailsSubtitle")}
            </span>
          </span>
        </span>
      }
      classNames={{
        content:
          "!bg-[#181a20] !border !border-white/[0.08] !rounded-2xl !overflow-hidden !shadow-[0_24px_64px_-24px_rgba(0,0,0,0.9)]",
        header:
          "!bg-[#181a20] !border-b !border-white/[0.06] !px-4 !py-4",
        title: "!text-white !font-bold",
        close:
          "!text-white/40 hover:!text-white hover:!bg-white/[0.06] !rounded-lg",
        body:
          "!p-0 !bg-[#181a20] !overflow-y-auto custom-scrollbar !max-h-[calc(100dvh-140px)]",
      }}
    >
      {transaction && (
        <div className="flex flex-col">
          {/* Hero: direction, type, amount, status */}
          <div className="relative overflow-hidden px-4 pb-6 pt-6">
            <div className="pointer-events-none absolute -top-28 left-1/2 h-56 w-64 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative flex flex-col items-center text-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${heroTone}`}
              >
                {direction === "out" ? (
                  <MdOutlineArrowUpward size={22} />
                ) : direction === "in" ? (
                  <MdOutlineArrowDownward size={22} />
                ) : (
                  <MdOutlineSwapHoriz size={22} />
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="text-micro font-bold uppercase tracking-[0.14em] text-white/45">
                  {typeLabel || t("transaction")}
                </span>
                {side && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.12em] ${
                      side === "Buy"
                        ? "border-success-6/25 bg-success-6/10 text-success-6"
                        : "border-error-1/25 bg-error-1/10 text-error-1"
                    }`}
                  >
                    {side === "Buy" ? t("sideBuy") : t("sideSell")}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline justify-center gap-1.5">
                <span className="text-3xl font-bold leading-none tracking-tight text-white tabular-nums">
                  {primaryAmount || "—"}
                </span>
                {primarySymbol && (
                  <span className="text-base font-semibold text-white/45">
                    {primarySymbol}
                  </span>
                )}
              </div>

              {description && (
                <p className="mt-2.5 max-w-[340px] text-xs font-medium leading-relaxed text-white/40">
                  {description}
                </p>
              )}

              {status && (
                <div className="mt-3">
                  <StatusBadge status={status} />
                </div>
              )}
            </div>
          </div>

          {showOverview && (
            <Section title={t("sectionOverview")}>
              {typeLabel && (
                <DetailRow label={t("labelType")}>
                  <span>{typeLabel}</span>
                </DetailRow>
              )}

              {status && (
                <DetailRow label={t("labelStatus")}>
                  <span className="capitalize">
                    {statusLabelFor(t, status)}
                  </span>
                </DetailRow>
              )}

              {assetSymbol && (
                <DetailRow label={t("asset")}>
                  <span className="uppercase">{displayAssetSymbol}</span>
                </DetailRow>
              )}

              {pair && (
                <DetailRow label={t("labelPair")}>
                  <span>{pair}</span>
                </DetailRow>
              )}

              {!isFiat && amountText(amount) && (
                <DetailRow label={t("amount")}>
                  <span className="tabular-nums">
                    {amountText(amount)}
                    {assetSymbol && (
                      <span className="ml-1 text-white/45">{displayAssetSymbol}</span>
                    )}
                  </span>
                </DetailRow>
              )}

              {directionLabel && (
                <DetailRow label={t("labelDirection")}>
                  <span
                    className={
                      direction === "in" ? "text-success-6" : "text-error-1"
                    }
                  >
                    {directionLabel}
                  </span>
                </DetailRow>
              )}

              {isFiat && primaryAmount && (
                <DetailRow label={t("labelFiatAmount")}>
                  <span className="tabular-nums">
                    {primaryAmount}{" "}
                    <span className="text-white/45">{primarySymbol}</span>
                  </span>
                </DetailRow>
              )}

              {isFiat && receivedAmount && (
                <DetailRow label={t("labelReceived")}>
                  <span className="tabular-nums">
                    {amountText(receivedAmount)}{" "}
                    <span className="text-white/45">{displayReceivedSymbol}</span>
                  </span>
                </DetailRow>
              )}

              {fee && (
                <DetailRow label={t("labelFee")}>
                  <span className="tabular-nums">
                    {amountText(fee)}
                    {feeSymbol && (
                      <span className="ml-1 text-white/45">{feeSymbol}</span>
                    )}
                  </span>
                </DetailRow>
              )}

              {rate && (
                <DetailRow label={t("rate")}>
                  <span className="tabular-nums">{rate}</span>
                </DetailRow>
              )}

              {createdAt && (
                <DetailRow label={t("labelCreated")}>
                  <span className="font-medium text-white/75">{createdAt}</span>
                </DetailRow>
              )}

              {completedAt && (
                <DetailRow label={t("statusCompleted")}>
                  <span className="font-medium text-white/75">{completedAt}</span>
                </DetailRow>
              )}

              {updatedAt && (
                <DetailRow label={t("labelUpdated")}>
                  <span className="font-medium text-white/75">{updatedAt}</span>
                </DetailRow>
              )}

              {failedAt && (
                <DetailRow label={t("statusFailed")}>
                  <span className="font-medium text-error-1/90">{failedAt}</span>
                </DetailRow>
              )}

              {failureReason && (
                <DetailRow label={t("labelFailureReason")}>
                  <span className="font-medium text-error-1/90">
                    {failureReason}
                  </span>
                </DetailRow>
              )}
            </Section>
          )}

          {hasOrderDetails && (
            <Section title={t("sectionOrderDetails")}>
              {orderMarket && <DetailRow label={t("labelMarket")}><span className="capitalize">{orderMarket}</span></DetailRow>}
              {orderType && <DetailRow label={t("labelOrderType")}><span className="capitalize">{orderType}</span></DetailRow>}
              {orderSide && <DetailRow label={t("labelSide")}><span className="uppercase">{orderSide}</span></DetailRow>}
              {orderStatus && <DetailRow label={t("labelOrderStatus")}><span className="capitalize">{orderStatus}</span></DetailRow>}
              {orderPrice && <DetailRow label={t("labelOrderPrice")}><span className="tabular-nums">{amountText(orderPrice)} {firstText(tx.quote).toUpperCase()}</span></DetailRow>}
              {averagePrice && <DetailRow label={t("labelAveragePrice")}><span className="tabular-nums">{amountText(averagePrice)} {firstText(tx.quote).toUpperCase()}</span></DetailRow>}
              {amount && <DetailRow label={t("labelOrderQuantity")}><span className="tabular-nums">{amountText(amount)} {firstText(tx.base).toUpperCase()}</span></DetailRow>}
              {filledQuantity && <DetailRow label={t("labelFilledQuantity")}><span className="tabular-nums">{amountText(filledQuantity)} {firstText(tx.base).toUpperCase()}</span></DetailRow>}
              {remainingQuantity && <DetailRow label={t("labelRemainingQuantity")}><span className="tabular-nums">{amountText(remainingQuantity)} {firstText(tx.base).toUpperCase()}</span></DetailRow>}
              {executionValue && <DetailRow label={t("labelExecutionValue")}><span className="tabular-nums">{amountText(executionValue)} {firstText(tx.quote).toUpperCase()}</span></DetailRow>}
              {executionFee && <DetailRow label={t("labelExecutionFee")}><span className="tabular-nums">{amountText(executionFee)} {executionFeeCurrency.toUpperCase()}</span></DetailRow>}
              {closedPnl && <DetailRow label={t("labelClosedPnl")}><span className="tabular-nums">{amountText(closedPnl)} {firstText(tx.quote).toUpperCase()}</span></DetailRow>}
              {timeInForce && <DetailRow label={t("labelTimeInForce")}><span>{timeInForce}</span></DetailRow>}
              {clientOrderId && <DetailRow label={t("labelClientOrderId")}><IdValue value={clientOrderId} /></DetailRow>}
              {tx.postOnly !== undefined && <DetailRow label={t("labelPostOnly")}><span>{tx.postOnly ? t("yes") : t("no")}</span></DetailRow>}
              {tx.reduceOnly !== undefined && <DetailRow label={t("labelReduceOnly")}><span>{tx.reduceOnly ? t("yes") : t("no")}</span></DetailRow>}
              {tx.stopLoss && <DetailRow label={t("labelStopLoss")}><span className="tabular-nums">{amountText(tx.stopLoss)} {firstText(tx.quote).toUpperCase()}</span></DetailRow>}
              {tx.takeProfit && <DetailRow label={t("labelTakeProfit")}><span className="tabular-nums">{amountText(tx.takeProfit)} {firstText(tx.quote).toUpperCase()}</span></DetailRow>}
            </Section>
          )}

          {hasTransfer && (
            <Section title={t("sectionTransfer")}>
              {fromAccount && (
                <DetailRow label={t("labelFromBalance")}>
                  <AccountValue raw={fromAccountRaw} label={fromAccount} />
                </DetailRow>
              )}

              {fromUser && (
                <DetailRow label={t("labelFromUser")}>
                  <PartyValue
                    id={fromUser}
                    role={fromRole}
                    isYou={!!ownerId && fromUser === ownerId}
                  />
                </DetailRow>
              )}

              {showFromAmount && (
                <DetailRow label={t("labelFromAmount")}>
                  <span className="tabular-nums">
                    {amountText(fromAmount)}
                    {fromAsset && (
                      <span className="ml-1 text-white/45">{fromAsset}</span>
                    )}
                  </span>
                </DetailRow>
              )}

              {toAccount && (
                <DetailRow label={t("labelToBalance")}>
                  <AccountValue raw={toAccountRaw} label={toAccount} />
                </DetailRow>
              )}

              {toUser && (
                <DetailRow label={t("labelToUser")}>
                  <PartyValue
                    id={toUser}
                    role={toRole}
                    isYou={!!ownerId && toUser === ownerId}
                  />
                </DetailRow>
              )}

              {showToAmount && (
                <DetailRow label={t("labelToAmount")}>
                  <span className="tabular-nums">
                    {amountText(toAmount)}
                    {toAsset && (
                      <span className="ml-1 text-white/45">{toAsset}</span>
                    )}
                  </span>
                </DetailRow>
              )}

              {ownerId && (
                <DetailRow label={t("labelUserId")}>
                  <PartyValue id={ownerId} isYou />
                </DetailRow>
              )}
            </Section>
          )}

          {showReferences && (
            <Section title={t("sectionReferenceDetails")}>
              {transactionId && (
                <DetailRow label={t("labelTransactionId")}>
                  <IdValue value={transactionId} />
                </DetailRow>
              )}

              {orderId && orderId !== transactionId && (
                <DetailRow label={t("labelOrderId")}>
                  <IdValue value={orderId} />
                </DetailRow>
              )}

              {orderMatchId && (
                <DetailRow label={t("labelOrderMatchId")}>
                  <IdValue value={orderMatchId} />
                </DetailRow>
              )}

              {advertiserId && (
                <DetailRow label={t("labelAdvertiserId")}>
                  <IdValue value={advertiserId} />
                </DetailRow>
              )}

              {matcherId && (
                <DetailRow label={t("labelMatcherId")}>
                  <IdValue value={matcherId} />
                </DetailRow>
              )}

              {reference && reference !== transactionId && (
                <DetailRow label={t("labelReference")}>
                  <IdValue value={reference} />
                </DetailRow>
              )}

              {network && (
                <DetailRow label={t("labelNetwork")}>
                  <span className="uppercase">{network}</span>
                </DetailRow>
              )}

              {hash && (
                <DetailRow label={t("labelTransactionHash")}>
                  <IdValue value={hash} />
                </DetailRow>
              )}

              {wallet && (
                <DetailRow label={t("labelWallet")}>
                  <IdValue value={wallet} />
                </DetailRow>
              )}

              {walletId && (
                <DetailRow label={t("labelWalletId")}>
                  <IdValue value={walletId} />
                </DetailRow>
              )}

              {address && address !== wallet && (
                <DetailRow label={t("labelAddress")}>
                  <IdValue value={address} />
                </DetailRow>
              )}
            </Section>
          )}

          {showBank && (
            <Section title={t("sectionBankDetails")}>
              {bankName && (
                <DetailRow label={t("labelBank")}>
                  <span>{bankName}</span>
                </DetailRow>
              )}

              {accountName && (
                <DetailRow label={t("labelAccountName")}>
                  <span>{accountName}</span>
                </DetailRow>
              )}

              {accountNumber && (
                <DetailRow label={t("labelAccountNumber")}>
                  <span className="tabular-nums">{accountNumber}</span>
                </DetailRow>
              )}
            </Section>
          )}

          {hasAdditional && (
            <Section title={t("sectionMetadata")}>
              {quantity && (
                <DetailRow label={t("labelQuantity")}>
                  <span className="tabular-nums">
                    {amountText(quantity)}
                    {assetSymbol && (
                      <span className="ml-1 text-white/45">{assetSymbol}</span>
                    )}
                  </span>
                </DetailRow>
              )}

              {metaRole && (
                <DetailRow label={t("labelRole")}>
                  <span className="uppercase">{metaRole}</span>
                </DetailRow>
              )}

              {metaType && (
                <DetailRow
                  label={normalizeSide(metaType) ? t("labelSide") : t("labelMetadataType")}
                >
                  <span className="uppercase">{metaType}</span>
                </DetailRow>
              )}

              {showNote && (
                <DetailRow label={t("labelNote")}>
                  <span className="break-words font-medium text-white/75">
                    {metaNote}
                  </span>
                </DetailRow>
              )}

              {metadataEntries.map(([key, value]) => {
                const text = metaValue(value);
                const isId = /(^|_)id$/i.test(key);
                return (
                  <DetailRow key={key} label={humanize(key)}>
                    {isId ? (
                      <IdValue value={text} />
                    ) : (
                      <span className="break-words" title={text}>
                        {/address|token|hash|wallet/i.test(key) && text.length > 32
                          ? truncateCryptoAddress(text)
                          : text}
                      </span>
                    )}
                  </DetailRow>
                );
              })}
            </Section>
          )}

          {showOther && (
            <Section title={t("sectionOtherDetails")}>
              {otherEntries.map(([key, value]) => {
                const text = metaValue(value);
                const isId = /(^|_)id$/i.test(key);
                return (
                  <DetailRow key={key} label={humanize(key)}>
                    {isId ? (
                      <IdValue value={text} />
                    ) : (
                      <span className="break-words">{text}</span>
                    )}
                  </DetailRow>
                );
              })}
            </Section>
          )}
        </div>
      )}
    </Modal>
  );
};
