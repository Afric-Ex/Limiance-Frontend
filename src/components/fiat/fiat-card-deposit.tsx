"use client";

import React, { useState } from "react";
import { Button, NumberInput, PasswordInput, TextInput } from "@mantine/core";
import { FiCreditCard } from "react-icons/fi";
import { ModalClose } from "../icons/modal-close";
import { OtpInput } from "../settings/otp-input";
import { useFiatCardDeposit } from "@/src/hooks/use-fiat-deposit";
import { FiatAssetSelector } from "./fiat-asset-selector";

const inputClass =
  "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[56px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20";

const cardInputClass = {
  input: `${inputClass} !font-mono !tracking-wider`,
  section: "!text-white/40 hover:!text-white",
} as const;

/**
 * TEMPORARY test cards for fiat QA (Monnify sandbox). Shown only outside
 * production builds (or when NEXT_PUBLIC_TEST_CARDS=true), so this can never
 * leak into the production UI. Delete this block when testing is done.
 * Format from QA: card number, MM/YYYY expiry, PIN, CVV.
 */
const TEST_CARDS = [
  { label: "No OTP", number: "4111111111111111", month: "10", year: "25", pin: "1234", cvv: "123" },
  { label: "OTP", number: "5060995994247093", month: "12", year: "25", pin: "1234", cvv: "123" },
  { label: "3DS", number: "4000000000000002", month: "12", year: "25", pin: "1234", cvv: "123" },
  { label: "Fail", number: "4111111111111110", month: "10", year: "25", pin: "1234", cvv: "123" },
] as const;

const SHOW_TEST_CARDS =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_TEST_CARDS === "true";

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12131A] border border-white/[0.08] w-full max-w-md rounded-3xl p-6 sm:p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold text-white/90 tracking-tight">{title}</h4>
          <ModalClose className="cursor-pointer hover:bg-white/5 p-1 rounded-full transition-colors" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

function OtpAuthModal({
  tokenId,
  reference,
  pending,
  onConfirm,
  onClose,
}: {
  tokenId: string;
  reference: string;
  pending: boolean;
  onConfirm: (tokenId: string, otp: string) => void;
  onClose: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState(tokenId);

  return (
    <ModalShell title="Card Verification" onClose={onClose}>
      <div className="flex flex-col w-full self-center gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">
              <span className="text-[#3B82F6]">OTP</span> Verification
            </h2>
            <p className="text-sm font-medium text-white/60 leading-relaxed">
              A 6-digit verification code was sent by your card issuer.
              {reference ? <><br /><span className="text-white/40 text-xs">Ref: {reference}</span></> : null}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <input
              value={token}
              onChange={(e) => setToken(e.currentTarget.value)}
              placeholder="Token / payment reference"
              className={inputClass.replace("!font-mono", "")}
            />
            <div className="flex flex-col gap-4 items-center">
              <span className="font-bold text-xs text-white/50 uppercase tracking-wider">Enter Code</span>
              <OtpInput digits={6} value={otp} onChange={setOtp} />
            </div>
          </div>
        </div>
        <Button
          loading={pending}
          className="w-full h-[52px] rounded-xl text-sm font-bold"
          style={{
            backgroundColor: otp.length === 6 ? "#3B82F6" : "rgba(255,255,255,0.1)",
            color: otp.length === 6 ? "white" : "rgba(255,255,255,0.3)",
          }}
          onClick={() => otp.length === 6 && onConfirm(token.trim(), otp)}
          disabled={otp.length !== 6 || pending}
        >
          Verify & Complete Payment
        </Button>
      </div>
    </ModalShell>
  );
}

function ThreeDsAuthModal({
  reference,
  pending,
  onConfirm,
  onClose,
  onResend,
}: {
  reference: string;
  pending: boolean;
  onConfirm: (apiKey: string) => void;
  onClose: () => void;
  onResend: () => void;
}) {
  const [apiKey, setApiKey] = useState("");

  return (
    <ModalShell title="3-D Secure" onClose={onClose}>
      <div className="flex flex-col gap-3 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">
          <span className="text-[#3B82F6]">Secure</span> Checkout
        </h2>
        <p className="text-sm font-medium text-white/60 leading-relaxed">
          Your card issuer requires 3-D Secure authentication. Complete the challenge in your bank page,
          then paste the returned <span className="text-white font-semibold">API key</span> below to finalize.
          {reference ? <><br /><span className="text-white/40 text-xs">Ref: {reference}</span></> : null}
        </p>
      </div>
      <TextInput
        placeholder="3DS API key"
        value={apiKey}
        onChange={(e) => setApiKey(e.currentTarget.value)}
        classNames={{ input: inputClass }}
      />
      <div className="flex flex-col gap-3">
        <Button
          loading={pending}
          className="w-full h-[52px] rounded-xl text-sm font-bold"
          style={{
            backgroundColor: apiKey.trim() ? "#3B82F6" : "rgba(255,255,255,0.1)",
            color: apiKey.trim() ? "white" : "rgba(255,255,255,0.3)",
          }}
          onClick={() => apiKey.trim() && onConfirm(apiKey.trim())}
          disabled={!apiKey.trim() || pending}
        >
          Complete Payment
        </Button>
        <button
          onClick={onResend}
          className="text-xs font-semibold text-[#3B82F6] hover:text-blue-400 transition-colors"
        >
          Re-trigger the 3DS challenge
        </button>
      </div>
    </ModalShell>
  );
}

export const FiatCardDeposit = () => {
  const {
    form,
    paying,
    pay,
    authMode,
    setAuthMode,
    pendingReference,
    pendingTokenId,
    completeOtp,
    otpPending,
    complete3ds,
    threeDsPending,
    coinSymbols,
    coinImages,
    coinSymbolsLoading,
    hasMoreCoins,
    isLoadingMoreCoins,
    isCoinsError,
    loadMoreCoins,
    retryCoins,
    assetSearch,
    setAssetSearch,
    rate,
    quotedReceivedAmount,
    rateLoading,
    quoteFailed,
  } = useFiatCardDeposit();

  const amountValid = Number(form.values.amount) > 0;

  const expiryValid =
    /^(0[1-9]|1[0-2])$/.test(form.values.cardExpiryMonth) &&
    /^\d{2}$/.test(form.values.cardExpiryYear);

  const cardValid =
    form.values.cardNumber.replace(/\s/g, "").length === 16 &&
    expiryValid &&
    form.values.cardCvv.length === 3 &&
    amountValid;

  const cardPayload = {
    cardNumber: form.values.cardNumber.replace(/\s/g, ""),
    cardExpiryMonth: form.values.cardExpiryMonth,
    cardExpiryYear: form.values.cardExpiryYear,
    cardCvv: form.values.cardCvv,
    cardPin: form.values.cardPin || undefined,
  };

  return (
    <>
      <div className="bg-[#181a20] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-white">Card Deposit</h3>
          <p className="text-xs text-white/40">
            Charge a Visa / Mastercard and receive crypto instantly. OTP or 3-D Secure may be required.
          </p>
        </div>

        {/* Asset + Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">You receive</label>
            <FiatAssetSelector
              value={form.values.symbol}
              onChange={(value) => form.setFieldValue("symbol", value)}
              assets={coinSymbols}
              assetImages={coinImages}
              isLoading={coinSymbolsLoading}
              isLoadingMore={isLoadingMoreCoins}
              hasMore={hasMoreCoins}
              onLoadMore={loadMoreCoins}
              isError={isCoinsError}
              onRetry={retryCoins}
              placeholder="Select an asset"
              name="card-receive-asset"
              id="card-receive-asset"
              searchQuery={assetSearch}
              onSearchChange={setAssetSearch}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">You pay (NGN)</label>
            <NumberInput
              thousandSeparator=","
              hideControls
              classNames={{ input: inputClass, section: "!w-fit !right-3" }}
              placeholder="0.00"
              min={0}
              rightSection={<span className="pr-1 text-sm font-bold text-white">₦</span>}
              {...form.getInputProps("amount")}
            />
          </div>
        </div>

        {/* TEMPORARY test-card picker (dev only, see TEST_CARDS above) */}
        {SHOW_TEST_CARDS ? (
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-warning-1/30 bg-warning-1/[0.04] p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-warning-1/80">
              Test cards — tap to fill (dev only)
            </span>
            <div className="grid grid-cols-2 min-[420px]:grid-cols-4 gap-2">
              {TEST_CARDS.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  title={`${card.number} · ${card.month}/${card.year} · PIN ${card.pin} · CVV ${card.cvv}`}
                  onClick={() => {
                    form.setFieldValue("cardNumber", card.number);
                    form.setFieldValue("cardExpiryMonth", card.month);
                    form.setFieldValue("cardExpiryYear", card.year);
                    form.setFieldValue("cardPin", card.pin);
                    form.setFieldValue("cardCvv", card.cvv);
                  }}
                  className="flex flex-col items-start gap-0.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-left transition-colors hover:border-primary/60 hover:bg-primary/[0.08] active:scale-[0.98]"
                >
                  <span className="text-[11px] font-bold text-white">{card.label}</span>
                  <span className="font-mono text-[10px] text-white/50">•••• {card.number.slice(-4)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Card Number */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Card Number</label>
          <TextInput
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            maxLength={19}
            leftSection={<FiCreditCard size={16} className="text-white/30" />}
            value={form.values.cardNumber
              .replace(/\D/g, "")
              .replace(/(\d{4})(?=\d)/g, "$1 ")
              .slice(0, 19)}
            onChange={(e) => form.setFieldValue("cardNumber", e.currentTarget.value)}
            classNames={cardInputClass}
          />
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Expiry (MM / YY)</label>
            <TextInput
              placeholder="MM / YY"
              inputMode="numeric"
              maxLength={5}
              value={
                form.values.cardExpiryMonth || form.values.cardExpiryYear
                  ? `${form.values.cardExpiryMonth}/${form.values.cardExpiryYear}`
                  : ""
              }
              onChange={(e) => {
                const raw = e.currentTarget.value.replace(/\D/g, "").slice(0, 4);
                form.setFieldValue("cardExpiryMonth", raw.slice(0, 2));
                form.setFieldValue("cardExpiryYear", raw.slice(2));
              }}
              classNames={cardInputClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">CVV</label>
            <PasswordInput
              placeholder="•••"
              maxLength={3}
              inputMode="numeric"
              value={form.values.cardCvv}
              onChange={(e) => form.setFieldValue("cardCvv", e.currentTarget.value.replace(/\D/g, "").slice(0, 3))}
              classNames={cardInputClass}
            />
          </div>
        </div>

        {/* PIN (optional) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Card PIN (if required)</label>
          <PasswordInput
            placeholder="••••"
            maxLength={4}
            inputMode="numeric"
            value={form.values.cardPin}
            onChange={(e) => form.setFieldValue("cardPin", e.currentTarget.value.replace(/\D/g, "").slice(0, 4))}
            classNames={cardInputClass}
          />
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
                : rateLoading
                  ? "≈ …"
                  : quotedReceivedAmount
                    ? `${quotedReceivedAmount} ${form.values.symbol}`
                    : "—"}
            </span>
          </div>
        </div>

        <Button
          onClick={() => pay()}
          loading={paying}
          disabled={!cardValid || quoteFailed}
          className="!h-[56px] !rounded-xl !bg-primary hover:!bg-primary/90 !text-white !font-bold !transition-all active:!scale-[0.98] disabled:!opacity-40"
        >
          Pay {form.values.amount ? `₦${Number(form.values.amount).toLocaleString()}` : ""}
        </Button>
        <p className="text-xs text-white/30 text-center -mt-2">
          Cards are charged in NGN via Monnify. Transactions may trigger extra issuer verification.
        </p>
      </div>

      {/* Auth overlays */}
      {authMode === "otp" && (
        <OtpAuthModal
          tokenId={pendingTokenId}
          reference={pendingReference}
          pending={otpPending}
          onConfirm={(tokenId, otp) => completeOtp({ tokenId, otp })}
          onClose={() => setAuthMode(null)}
        />
      )}
      {authMode === "3ds" && (
        <ThreeDsAuthModal
          reference={pendingReference}
          pending={threeDsPending}
          onConfirm={(apiKey) => complete3ds({ apiKey, ...cardPayload })}
          onClose={() => setAuthMode(null)}
          onResend={() => pay()}
        />
      )}
    </>
  );
};