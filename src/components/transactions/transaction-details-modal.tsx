"use client";

import { Modal } from "@mantine/core";
import type { ReactNode } from "react";
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

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  success: "Successful",
  successful: "Successful",
  credited: "Credited",
  paid: "Paid",
  pending: "Pending",
  processing: "Processing",
  confirming: "Confirming",
  failed: "Failed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  canceled: "Canceled",
};

const TYPE_LABELS: Record<string, string> = {
  p2p: "P2P Trade",
  p2p_trade: "P2P Trade",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  withdraw: "Withdrawal",
  internal: "Internal Transfer",
  internal_transfer: "Internal Transfer",
  transfer: "Transfer",
  conversion: "Conversion",
  convert: "Conversion",
  swap: "Swap",
  fiat_deposit: "Fiat Deposit",
  fiat_withdrawal: "Fiat Withdrawal",
  reward: "Reward",
  commission: "Commission",
};

const BALANCE_LABELS: Record<string, string> = {
  spot_balance: "Spot Balance",
  funding_balance: "Funding Balance",
  locked_balance: "Locked Balance",
  futures_balance: "Futures Balance",
  margin_balance: "Margin Balance",
  p2p_balance: "P2P Balance",
  main_balance: "Main Balance",
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
  const key = status.toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
        STATUS_TONES[key] ?? "border-white/[0.08] bg-white/[0.04] text-white/50"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[key] ?? status}
    </span>
  );
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-t border-white/[0.06] px-6 py-4">
    <h3 className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
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
    <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right text-[13px] font-semibold text-white/85">
      {children}
    </div>
  </div>
);

const IdValue = ({ value }: { value: string }) => (
  <span className="flex min-w-0 items-center justify-end gap-1.5">
    <span className="break-all font-mono text-[11px] font-medium text-white/75">
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
}) => (
  <span className="flex min-w-0 items-center justify-end gap-1.5">
    {role && (
      <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/45">
        {role}
      </span>
    )}
    {isYou && (
      <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
        You
      </span>
    )}
    <span className="break-all font-mono text-[11px] font-medium text-white/75">
      {id}
    </span>
    <Copy text={id} color="var(--primary)" />
  </span>
);

const accountLabel = (value: string): string => {
  if (!value || isZeroAddress(value)) return "";
  const known = BALANCE_LABELS[value.toLowerCase()];
  if (known) return known;
  if (value.startsWith("0x")) return truncateCryptoAddress(value);
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
  const typeLabel =
    TYPE_LABELS[type.toLowerCase()] ?? (type ? humanize(type) : "");

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
  const directionLabel =
    direction === "in" ? "Incoming" : direction === "out" ? "Outgoing" : "";

  const heroTone =
    direction === "out"
      ? "border-error-1/25 bg-error-1/10 text-error-1"
      : direction === "in"
        ? "border-success-6/25 bg-success-6/10 text-success-6"
        : "border-primary/25 bg-primary/10 text-primary";

  const primaryAmount = isFiat ? amountText(fiatAmount) : amountText(amount);
  const primarySymbol = isFiat ? currency : assetSymbol;

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
  const reference = firstText(
    tx.reference,
    tx.transactionReference,
    tx.txRef
  );
  const orderId = readMeta("order_id");
  const orderMatchId = readMeta("order_match_id");
  const network = firstText(tx.chain, tx.network).toUpperCase();
  const wallet = firstAddress(tx.wallet, tx.fromWallet, tx.fromAddress);
  const hash = firstAddress(tx.hash, tx.transactionHash, tx.txHash);
  const address = firstAddress(tx.destination, tx.address, tx.toAddress);

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
      ? "Advertiser"
      : undefined;
  const toRole =
    toUser && matcherId && toUser === matcherId ? "Matcher" : undefined;

  const fromAccountRaw = firstText(tx.fromBalance, tx.from);
  const toAccountRaw = firstText(tx.toBalance, tx.to);
  const fromAccount = accountLabel(fromAccountRaw);
  const toAccount = accountLabel(toAccountRaw);
  const fromAsset = firstText(
    tx.fromAsset,
    tx.asset,
    readMeta("asset")
  ).toUpperCase();
  const toAsset = firstText(tx.toAsset, tx.asset, readMeta("asset")).toUpperCase();
  const fromAmount = firstText(tx.fromAmount);
  const toAmount = firstText(tx.toAmount);
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
              Transaction Details
            </span>
            <span className="text-[10px] font-medium leading-tight text-white/35">
              Receipt and movement details
            </span>
          </span>
        </span>
      }
      classNames={{
        content:
          "!bg-[#181a20] !border !border-white/[0.08] !rounded-2xl !overflow-hidden !shadow-[0_24px_64px_-24px_rgba(0,0,0,0.9)]",
        header:
          "!bg-[#181a20] !border-b !border-white/[0.06] !px-5 !py-4",
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
          <div className="relative overflow-hidden px-6 pb-6 pt-6">
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
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                  {typeLabel || "Transaction"}
                </span>
                {side && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${
                      side === "Buy"
                        ? "border-success-6/25 bg-success-6/10 text-success-6"
                        : "border-error-1/25 bg-error-1/10 text-error-1"
                    }`}
                  >
                    {side}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline justify-center gap-1.5">
                <span className="text-[28px] font-bold leading-none tracking-tight text-white tabular-nums">
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
            <Section title="Overview">
              {typeLabel && (
                <DetailRow label="Type">
                  <span>{typeLabel}</span>
                </DetailRow>
              )}

              {status && (
                <DetailRow label="Status">
                  <span className="capitalize">
                    {STATUS_LABELS[status.toLowerCase()] ?? status}
                  </span>
                </DetailRow>
              )}

              {assetSymbol && (
                <DetailRow label="Asset">
                  <span className="uppercase">{assetSymbol}</span>
                </DetailRow>
              )}

              {!isFiat && amountText(amount) && (
                <DetailRow label="Amount">
                  <span className="tabular-nums">
                    {amountText(amount)}
                    {assetSymbol && (
                      <span className="ml-1 text-white/45">{assetSymbol}</span>
                    )}
                  </span>
                </DetailRow>
              )}

              {directionLabel && (
                <DetailRow label="Direction">
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
                <DetailRow label="Fiat Amount">
                  <span className="tabular-nums">
                    {primaryAmount}{" "}
                    <span className="text-white/45">{primarySymbol}</span>
                  </span>
                </DetailRow>
              )}

              {isFiat && receivedAmount && (
                <DetailRow label="Received">
                  <span className="tabular-nums">
                    {amountText(receivedAmount)}{" "}
                    <span className="text-white/45">{receivedSymbol}</span>
                  </span>
                </DetailRow>
              )}

              {fee && (
                <DetailRow label="Fee">
                  <span className="tabular-nums">
                    {amountText(fee)}
                    {feeSymbol && (
                      <span className="ml-1 text-white/45">{feeSymbol}</span>
                    )}
                  </span>
                </DetailRow>
              )}

              {rate && (
                <DetailRow label="Rate">
                  <span className="tabular-nums">{rate}</span>
                </DetailRow>
              )}

              {createdAt && (
                <DetailRow label="Created">
                  <span className="font-medium text-white/75">{createdAt}</span>
                </DetailRow>
              )}

              {completedAt && (
                <DetailRow label="Completed">
                  <span className="font-medium text-white/75">{completedAt}</span>
                </DetailRow>
              )}

              {updatedAt && (
                <DetailRow label="Updated">
                  <span className="font-medium text-white/75">{updatedAt}</span>
                </DetailRow>
              )}

              {failedAt && (
                <DetailRow label="Failed">
                  <span className="font-medium text-error-1/90">{failedAt}</span>
                </DetailRow>
              )}

              {failureReason && (
                <DetailRow label="Failure Reason">
                  <span className="font-medium text-error-1/90">
                    {failureReason}
                  </span>
                </DetailRow>
              )}
            </Section>
          )}

          {hasTransfer && (
            <Section title="Transfer">
              {fromAccount && (
                <DetailRow label="From Balance">
                  <AccountValue raw={fromAccountRaw} label={fromAccount} />
                </DetailRow>
              )}

              {fromUser && (
                <DetailRow label="From User">
                  <PartyValue
                    id={fromUser}
                    role={fromRole}
                    isYou={!!ownerId && fromUser === ownerId}
                  />
                </DetailRow>
              )}

              {showFromAmount && (
                <DetailRow label="From Amount">
                  <span className="tabular-nums">
                    {amountText(fromAmount)}
                    {fromAsset && (
                      <span className="ml-1 text-white/45">{fromAsset}</span>
                    )}
                  </span>
                </DetailRow>
              )}

              {toAccount && (
                <DetailRow label="To Balance">
                  <AccountValue raw={toAccountRaw} label={toAccount} />
                </DetailRow>
              )}

              {toUser && (
                <DetailRow label="To User">
                  <PartyValue
                    id={toUser}
                    role={toRole}
                    isYou={!!ownerId && toUser === ownerId}
                  />
                </DetailRow>
              )}

              {showToAmount && (
                <DetailRow label="To Amount">
                  <span className="tabular-nums">
                    {amountText(toAmount)}
                    {toAsset && (
                      <span className="ml-1 text-white/45">{toAsset}</span>
                    )}
                  </span>
                </DetailRow>
              )}

              {ownerId && (
                <DetailRow label="User ID">
                  <PartyValue id={ownerId} isYou />
                </DetailRow>
              )}
            </Section>
          )}

          {showReferences && (
            <Section title="Reference Details">
              {transactionId && (
                <DetailRow label="Transaction ID">
                  <IdValue value={transactionId} />
                </DetailRow>
              )}

              {orderId && orderId !== transactionId && (
                <DetailRow label="Order ID">
                  <IdValue value={orderId} />
                </DetailRow>
              )}

              {orderMatchId && (
                <DetailRow label="Order Match ID">
                  <IdValue value={orderMatchId} />
                </DetailRow>
              )}

              {advertiserId && (
                <DetailRow label="Advertiser ID">
                  <IdValue value={advertiserId} />
                </DetailRow>
              )}

              {matcherId && (
                <DetailRow label="Matcher ID">
                  <IdValue value={matcherId} />
                </DetailRow>
              )}

              {reference && reference !== transactionId && (
                <DetailRow label="Reference">
                  <IdValue value={reference} />
                </DetailRow>
              )}

              {network && (
                <DetailRow label="Network">
                  <span className="uppercase">{network}</span>
                </DetailRow>
              )}

              {hash && (
                <DetailRow label="Transaction Hash">
                  <IdValue value={hash} />
                </DetailRow>
              )}

              {wallet && (
                <DetailRow label="Wallet">
                  <IdValue value={wallet} />
                </DetailRow>
              )}

              {address && address !== wallet && (
                <DetailRow label="Address">
                  <IdValue value={address} />
                </DetailRow>
              )}
            </Section>
          )}

          {showBank && (
            <Section title="Bank Details">
              {bankName && (
                <DetailRow label="Bank">
                  <span>{bankName}</span>
                </DetailRow>
              )}

              {accountName && (
                <DetailRow label="Account Name">
                  <span>{accountName}</span>
                </DetailRow>
              )}

              {accountNumber && (
                <DetailRow label="Account Number">
                  <span className="tabular-nums">{accountNumber}</span>
                </DetailRow>
              )}
            </Section>
          )}

          {hasAdditional && (
            <Section title="Metadata">
              {quantity && (
                <DetailRow label="Quantity">
                  <span className="tabular-nums">
                    {amountText(quantity)}
                    {assetSymbol && (
                      <span className="ml-1 text-white/45">{assetSymbol}</span>
                    )}
                  </span>
                </DetailRow>
              )}

              {metaRole && (
                <DetailRow label="Role">
                  <span className="uppercase">{metaRole}</span>
                </DetailRow>
              )}

              {metaType && (
                <DetailRow
                  label={normalizeSide(metaType) ? "Side" : "Metadata Type"}
                >
                  <span className="uppercase">{metaType}</span>
                </DetailRow>
              )}

              {showNote && (
                <DetailRow label="Note">
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
                      <span className="break-words">{text}</span>
                    )}
                  </DetailRow>
                );
              })}
            </Section>
          )}

          {showOther && (
            <Section title="Other Details">
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
