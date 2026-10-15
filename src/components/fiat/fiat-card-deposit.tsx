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
  } = useFiatCardDeposit();

  const expiryValid =
    /^(0[1-9]|1[0-2])$/.test(form.values.cardExpiryMonth) &&
    /^\d{2}$/.test(form.values.cardExpiryYear);

  const cardValid =
    form.values.cardNumber.replace(/\s/g, "").length === 16 &&
    expiryValid &&
    form.values.cardCvv.length === 3 &&
    Number(form.values.amount) > 0;

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

        <Button
          onClick={() => pay()}
          loading={paying}
          disabled={!cardValid}
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