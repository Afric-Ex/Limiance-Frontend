"use client";

import { Modal } from "@mantine/core";
import type { ReactNode } from "react";
import {
  MdOutlineArrowDownward,
  MdOutlineArrowUpward,
  MdSwapHoriz,
} from "react-icons/md";
import { Copy } from "@/src/components/shared/copy";
import { isZeroAddress } from "@/src/utils/truncate-address";
import { fmtDateTime } from "@/src/components/orders/orders-shared";

/** Raw transaction record as returned by the history endpoints. */
export type TransactionRecord = Record<string, any>;

interface TransactionDetailsModalProps {
  /** The selected transaction; `null` keeps the modal closed. */
  transaction: TransactionRecord | null;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  completed: "text-success-6 bg-success-6/10",
  success: "text-success-6 bg-success-6/10",
  successful: "text-success-6 bg-success-6/10",
  credited: "text-success-6 bg-success-6/10",
  paid: "text-success-6 bg-success-6/10",
  pending: "text-warning-1 bg-warning-1/10",
  processing: "text-warning-1 bg-warning-1/10",
  confirming: "text-warning-1 bg-warning-1/10",
  failed: "text-error-1 bg-error-1/10",
  rejected: "text-error-1 bg-error-1/10",
  cancelled: "text-error-1 bg-error-1/10",
  canceled: "text-error-1 bg-error-1/10",
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

const formatFiatAmount = (value: string): string => {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : value;
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`px-2.5 py-1 w-fit text-xs font-bold rounded-md uppercase tracking-wider ${
      STATUS_STYLES[status.toLowerCase()] ?? "text-white/50 bg-white/[0.04]"
    }`}
  >
    {status}
  </span>
);

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-start justify-between gap-6 border-b border-white/[0.04] py-3.5 last:border-b-0">
    <span className="shrink-0 pt-0.5 text-xs font-medium text-white/40">
      {label}
    </span>
    <span className="flex min-w-0 items-center justify-end gap-2 text-right text-sm font-semibold text-white/90">
      {children}
    </span>
  </div>
);

const AddressValue = ({ value }: { value: string }) => (
  <span className="flex min-w-0 items-center justify-end gap-2">
    <span className="break-all font-mono text-xs text-white/80">{value}</span>
    <Copy text={value} color="var(--primary)" />
  </span>
);

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

  const type = firstText(tx.type, tx.transactionType, tx.operation);
  const status = firstText(tx.status, tx.state);

  const symbol = firstText(tx.coin, tx.asset, tx.symbol).toUpperCase();
  const amount = firstText(tx.amount, tx.quantity);
  const fiatAmount = firstText(tx.fiatAmount);
  const currency = firstText(tx.currency, tx.fiatCurrency).toUpperCase();
  const receivedAmount = firstText(tx.assetAmount);
  const receivedSymbol = firstText(tx.asset, tx.coin, tx.symbol).toUpperCase();

  const isFiat = !!(fiatAmount || currency);

  const createdAt = firstText(tx.createdAt, tx.created_at);
  const completedAt = firstText(tx.completedAt, tx.completed_at);

  const network = firstText(tx.chain, tx.network).toUpperCase();
  const wallet = firstAddress(tx.wallet, tx.fromWallet, tx.fromAddress);
  const address = firstAddress(tx.hash, tx.destination, tx.address, tx.toAddress);
  const transactionId = firstText(tx.id, tx.transactionId, tx.txId);
  const reference = firstText(tx.reference, tx.transactionReference, tx.txRef);
  const fee = firstText(tx.fee, tx.networkFee, tx.feeAmount);

  const bankName = firstText(tx.bankName, tx.bank);
  const accountName = firstText(tx.accountName);
  const accountNumber = firstText(tx.accountNumber);

  const normalizedType = type.toLowerCase();
  const isIncoming =
    normalizedType.includes("deposit") ||
    normalizedType.includes("buy") ||
    normalizedType.includes("received");
  const isOutgoing =
    normalizedType.includes("withdraw") ||
    normalizedType.includes("sell") ||
    normalizedType.includes("send");
  const direction: "in" | "out" | "neutral" = isOutgoing
    ? "out"
    : isIncoming
      ? "in"
      : "neutral";

  const heroTone =
    direction === "out"
      ? "border-error-1/20 bg-error-1/10 text-error-1"
      : direction === "in"
        ? "border-success-6/20 bg-success-6/10 text-success-6"
        : "border-primary/20 bg-primary/10 text-primary";

  const heroAmount = isFiat
    ? `${formatFiatAmount(fiatAmount)} ${currency}`.trim()
    : `${amount} ${symbol}`.trim();

  return (
    <Modal
      opened={!!transaction}
      onClose={onClose}
      centered
      title="Transaction Details"
      classNames={{
        content:
          "!bg-elevated !border !border-white/[0.06] !rounded-2xl !overflow-hidden",
        header: "!bg-elevated !border-b !border-white/[0.06] !px-6 !py-4",
        title: "!text-white !font-bold !text-base",
        close:
          "!text-white/40 hover:!text-white hover:!bg-white/[0.06] !rounded-lg",
        body: "!p-0",
      }}
    >
      {transaction && (
        <div className="flex flex-col px-6 pb-6">
          {/* Hero: direction, amount, status */}
          <div className="flex flex-col items-center gap-2.5 py-7">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full border ${heroTone}`}
            >
              {direction === "out" ? (
                <MdOutlineArrowUpward size={22} />
              ) : direction === "in" ? (
                <MdOutlineArrowDownward size={22} />
              ) : (
                <MdSwapHoriz size={22} />
              )}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
              {type || "Transaction"}
            </span>
            <span className="text-2xl font-bold tabular-nums text-white">
              {heroAmount || "—"}
            </span>
            {status && <StatusBadge status={status} />}
          </div>

          <div className="h-px bg-white/[0.06]" />

          {/* Details */}
          <div className="flex flex-col">
            {createdAt && (
              <DetailRow label={completedAt ? "Created" : "Date & Time"}>
                <span className="font-medium text-white/80">
                  {fmtDateTime(createdAt)}
                </span>
              </DetailRow>
            )}

            {completedAt && (
              <DetailRow label="Completed">
                <span className="font-medium text-white/80">
                  {fmtDateTime(completedAt)}
                </span>
              </DetailRow>
            )}

            {type && (
              <DetailRow label="Type">
                <span className="capitalize">{type}</span>
              </DetailRow>
            )}

            {isFiat
              ? receivedAmount && (
                  <DetailRow label="Received">
                    <span className="tabular-nums">
                      {formatFiatAmount(receivedAmount)}{" "}
                      <span className="text-white/50">{receivedSymbol}</span>
                    </span>
                  </DetailRow>
                )
              : symbol && (
                  <DetailRow label="Coin">
                    <span className="uppercase">{symbol}</span>
                  </DetailRow>
                )}

            {!isFiat && amount && symbol && (
              <DetailRow label="Amount">
                <span className="tabular-nums text-white">
                  {amount} <span className="text-white/50">{symbol}</span>
                </span>
              </DetailRow>
            )}

            {!isFiat && network && (
              <DetailRow label="Network">
                <span className="uppercase">{network}</span>
              </DetailRow>
            )}

            {!isFiat && fee && (
              <DetailRow label="Fee">
                <span className="tabular-nums">
                  {fee}{" "}
                  <span className="text-white/50">{symbol || ""}</span>
                </span>
              </DetailRow>
            )}

            {!isFiat && wallet && (
              <DetailRow label="Wallet">
                <AddressValue value={wallet} />
              </DetailRow>
            )}

            {!isFiat && address && address !== wallet && (
              <DetailRow label="Address">
                <AddressValue value={address} />
              </DetailRow>
            )}

            {transactionId && (
              <DetailRow label="Transaction ID">
                <AddressValue value={transactionId} />
              </DetailRow>
            )}

            {reference && reference !== transactionId && (
              <DetailRow label="Reference">
                <AddressValue value={reference} />
              </DetailRow>
            )}

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
          </div>
        </div>
      )}
    </Modal>
  );
};
