"use client";

import React from "react";
import { Button, NumberInput } from "@mantine/core";
import { FiCreditCard } from "react-icons/fi";
import { MdOutlineContentCopy, MdOutlineTimer } from "react-icons/md";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { IoChevronDownOutline } from "react-icons/io5";
import { Copy } from "../shared/copy";
import { useFiatBankDeposit } from "@/src/hooks/use-fiat-deposit";
import { FiatAssetSelector } from "./fiat-asset-selector";

const inputClass =
  "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[56px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20";

const formatCountdown = (seconds: number) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

export const FiatBankDeposit = () => {
  const {
    banks,
    banksLoading,
    coinSymbols,
    coinSymbolsLoading,
    hasMoreCoins,
    isLoadingMoreCoins,
    isCoinsError,
    loadMoreCoins,
    retryCoins,
    form,
    account,
    expirySeconds,
    creatingAccount,
    createAccount,
    confirming,
    confirmDeposit,
    rate,
    rateLoading,
  } = useFiatBankDeposit();

  const selectedBank = banks?.find((b) => b.code === form.values.bankCode);
  const amountValid = Number(form.values.amount) > 0;
  const canRequest = amountValid && !!form.values.bankCode && !!form.values.symbol;
  const receivedAmount = amountValid && rate > 0 ? Number(form.values.amount) / rate : 0;

  if (account) {
    return (
      <div className="bg-[#181a20] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-6">
        {/* success header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-success-5/10 border border-success-5/20 flex items-center justify-center text-success-5">
            <FiCreditCard size={18} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base font-bold text-white">Transfer to your virtual account</h3>
            <p className="text-xs text-white/40">
              Credit will be settled as {form.values.symbol} automatically on confirmation
            </p>
          </div>
        </div>

        {/* expiry + amount bar */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-warning-1/20 bg-warning-1/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <MdOutlineTimer size={18} className="text-warning-1" />
            <span className="text-xs font-semibold text-warning-1">
              Account expires in <span className="font-black">{formatCountdown(expirySeconds)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/40">Total payable</span>
            <span className="font-bold text-white">
              ₦{Number(account.totalPayable ?? account.amount ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* account details list */}
        <div className="flex flex-col gap-0 rounded-xl border border-white/[0.04] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04]">
            <span className="text-sm text-white/50">Bank</span>
            <span className="text-sm font-bold text-white">{account.bankName || selectedBank?.name || "—"}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04]">
            <span className="text-sm text-white/50">Account Name</span>
            <span className="text-sm font-bold text-white">{account.accountName || "—"}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04]">
            <span className="text-sm text-white/50">Account Number</span>
            <span className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">{account.accountNumber || "—"}</span>
              {account.accountNumber && <Copy text={account.accountNumber} color="var(--primary)" />}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04]">
            <span className="text-sm text-white/50">Amount to transfer</span>
            <span className="text-sm font-bold text-white">
              ₦{Number(account.amount ?? 0).toLocaleString()}
            </span>
          </div>
          {account.fee != null && Number(account.fee) > 0 && (
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04]">
              <span className="text-sm text-white/50">Fee</span>
              <span className="text-sm font-bold text-white/70">₦{Number(account.fee).toLocaleString()}</span>
            </div>
          )}
          {account.ussdPayment && (
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04]">
              <span className="text-sm text-white/50">USSD Payment</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white/80">{account.ussdPayment}</span>
                <Copy text={account.ussdPayment} color="var(--primary)" />
              </span>
            </div>
          )}
          {account.transactionReference && (
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-white/50">Transaction Reference</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs text-white/60">{account.transactionReference}</span>
                <Copy text={account.transactionReference} color="var(--primary)" />
              </span>
            </div>
          )}
        </div>

        {/* confirm CTA */}
        <Button
          onClick={() => confirmDeposit()}
          loading={confirming}
          className="!h-[56px] !rounded-xl !bg-primary hover:!bg-primary/90 !text-white !font-bold !transition-all active:!scale-[0.98]"
        >
          I&apos;ve completed the transfer — Confirm Deposit
        </Button>
        <p className="text-xs text-white/30 text-center -mt-2">
          Verify with Monnify that your transfer settled before crediting {form.values.symbol} to your account.
        </p>
        <div className="flex items-start gap-2 rounded-xl border border-warning-1/20 bg-warning-1/[0.06] p-3">
          <IoMdInformationCircleOutline size={16} className="text-warning-1 shrink-0 mt-0.5" />
          <span className="text-xs font-medium text-warning-1/80 leading-relaxed">
            Only transfer the exact amount above. Transfers below or above the settlement amount may not be credited.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#181a20] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold text-white">Bank Transfer Deposit</h3>
        <p className="text-xs text-white/40">
          Get a one-time NGN virtual account, transfer via your bank, and receive crypto instantly.
        </p>
      </div>

      {/* Amount + Asset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">You pay (NGN)</label>
          <NumberInput
            thousandSeparator=","
            hideControls
            autoComplete="off"
            name="fiat-deposit-amount"
            id="fiat-deposit-amount"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            classNames={{ input: inputClass, section: "!w-fit !right-3" }}
            placeholder="0.00"
            min={0}
            rightSection={
              <span className="pr-1 text-sm font-bold text-white">₦</span>
            }
            {...form.getInputProps("amount")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">You receive</label>
          <FiatAssetSelector
            value={form.values.symbol}
            onChange={(value) => form.setFieldValue("symbol", value)}
            assets={coinSymbols}
            isLoading={coinSymbolsLoading}
            isLoadingMore={isLoadingMoreCoins}
            hasMore={hasMoreCoins}
            onLoadMore={loadMoreCoins}
            isError={isCoinsError}
            onRetry={retryCoins}
            placeholder="Select an asset"
            name="fiat-receive-asset"
            id="fiat-receive-asset"
          />
        </div>
      </div>

      {/* Bank */}
      <div className="flex flex-col gap-2">
        <label className="text-xs pl-1 font-semibold text-white/40 uppercase tracking-wider">Preferred settlement bank</label>
        <div className="relative">
          <select
            {...form.getInputProps("bankCode")}
            name="settlement-bank"
            id="settlement-bank"
            autoComplete="off"
            className={`${inputClass} px-2 w-full !appearance-none !cursor-pointer !pr-10 [&>option]:!bg-[#181a20] [&>option]:!text-white [&>option]:!text-sm`}
          >
            <option value="">
              {banksLoading ? "Loading banks…" : "Select a bank"}
            </option>
            {banks?.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
            <IoChevronDownOutline size={18} />
          </span>
        </div>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-3 max-[630px]:flex max-[630px]:flex-col gap-3">
        <div className="flex flex-col gap-1 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
          <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">You pay</span>
          <span className="text-sm font-bold text-white tabular-nums">
            {amountValid ? `₦${Number(form.values.amount).toLocaleString()}` : "—"}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
          <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Rate</span>
          <span className="text-sm font-bold text-white tabular-nums">
            {rate > 0 ? `₦${Number(rate).toLocaleString()}` : rateLoading ? "…" : "—"}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
          <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">You receive</span>
          <span className="text-sm font-bold text-primary tabular-nums">
            {!amountValid
              ? "—"
              : receivedAmount > 0
                ? `${receivedAmount.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${form.values.symbol}`
                : rateLoading
                  ? "≈ …"
                  : `${form.values.symbol} ${Number(form.values.amount).toLocaleString()} NGN`}
          </span>
        </div>
      </div>

      <Button
        onClick={() => createAccount()}
        loading={creatingAccount}
        disabled={!canRequest}
        className="!h-[56px] !rounded-xl !bg-primary hover:!bg-primary/90 !text-white !font-bold !transition-all active:!scale-[0.98] disabled:!opacity-40"
      >
        Get Virtual Account
      </Button>

      <p className="text-xs text-white/30 text-center -mt-2 flex items-center justify-center gap-1.5">
        <MdOutlineContentCopy size={12} className="text-primary/60" />
        One-time account expires automatically — a new one is created for each deposit.
      </p>
    </div>
  );
};