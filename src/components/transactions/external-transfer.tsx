"use client";

import React, { useState } from "react";
import { modals } from "@mantine/modals";
import { MdOutlineClose } from "react-icons/md";
import { NumberInput, Popover, PopoverDropdown, PopoverTarget, TextInput } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { asset } from "@/src/services/asset";
import { SupportedListingsDropdown } from "../assets/supported-pairs-dropdown";
import { SelectedCoin } from "@/src/hooks/use-deposit";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { successNotification } from "@/src/lib/notification-handler";
import { InlineLoading } from "../shared/inline-loading";
import { useDisclosure } from "@mantine/hooks";
import { IoChevronDown } from "react-icons/io5";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

export const ExternalTransfer = ({ embedded = false }: { embedded?: boolean }) => {
  const { coins: portfolio, refreshBalances } = usePortfolioWs({ coins: true });
  const [activeStep, setActiveStep] = useState<"request" | "transfer">("request");
  const [selectedCoin, setSelectedCoin] = useState<SelectedCoin>({
    name: "",
    image: "",
    symbol: "",
    contractAddress: "",
  });
  const [amount, setAmount] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [releaseCode, setReleaseCode] = useState("");
  const [fromBalance, setFromBalance] = useState("spot_balance");
  const [toBalance, setToBalance] = useState("spot_balance");
  const [fromOpen, fromHandlers] = useDisclosure(false);
  const [toOpen, toHandlers] = useDisclosure(false);
  const [requestedCode, setRequestedCode] = useState("");

  const balanceOptions = [
    { label: "Spot", value: "spot_balance" },
    { label: "Funding", value: "funding_balance" },
  ];

  const selectedFromLabel =
    balanceOptions.find((item) => item.value === fromBalance)?.label ?? fromBalance;
  const selectedToLabel =
    balanceOptions.find((item) => item.value === toBalance)?.label ?? toBalance;
  const assetSymbol = selectedCoin.symbol.split(":")[0];

  const trimmedRecipient = toUserId.trim();
  const recipientLooksLikeEmail = trimmedRecipient.includes("@");
  const recipientError =
    recipientLooksLikeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedRecipient)
      ? "Enter a valid email address"
      : null;

  const walletBalanceKey = fromBalance === "spot_balance" ? "spotBalance" : "fundingBalance";
  const coinEntry = portfolio?.find(
    (p: any) =>
      p.symbol?.toLowerCase() === assetSymbol?.toLowerCase() ||
      p.symbol?.toLowerCase() === selectedCoin?.symbol?.toLowerCase()
  );
  const availableBalance = coinEntry
    ? String(coinEntry[walletBalanceKey as keyof typeof coinEntry] ?? "0")
    : "0";

  const { mutate: requestCode, isPending: requestingCode } = useMutation({
    mutationFn: () => asset.getExternalTransferCode(assetSymbol),
    onSuccess: (response) => {
      const code =
        response?.data ??
        response?.message?.match(/\b\d{4,8}\b/)?.[0] ??
        "";

      setRequestedCode(code ? String(code) : "");
      if (code) {
        setReleaseCode(String(code));
      }
      successNotification(response?.message || "Release code requested");
      setActiveStep("transfer");
    },
    onError: (e) => errorMessageHandler(e),
  });

  const { mutate: transfer, isPending: transferring } = useMutation({
    mutationFn: () =>
      asset.externalTransfer({
        toUserId: trimmedRecipient,
        symbol: assetSymbol,
        fromBalance,
        toBalance,
        amount,
        releaseCode,
      }),
    onSuccess: () => {
      // WebSocket auto-refreshes balances
      refreshBalances();
      successNotification("Transfer successful");
      if (!embedded) modals.closeAll();
    },
    onError: (e) => errorMessageHandler(e),
  });

  const inputClass =
    "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[56px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20";

  const sectionClass =
    "flex flex-col gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4";

  const BalanceSelector = ({
    label,
    value,
    opened,
    toggle,
    close,
    onSelect,
  }: {
    label: string;
    value: string;
    opened: boolean;
    toggle: () => void;
    close: () => void;
    onSelect: (value: string) => void;
  }) => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</label>
      <Popover opened={opened} onChange={close} width="target" classNames={{ dropdown: "!border !border-white/[0.08] !bg-elevated !rounded-xl !p-0 !overflow-hidden" }}>
        <PopoverTarget>
          <button onClick={toggle} className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.18] cursor-pointer rounded-xl h-[56px] px-4 flex items-center justify-between transition-all">
            <span className="font-semibold text-sm text-white/90">
              {balanceOptions.find((item) => item.value === value)?.label}
            </span>
            <IoChevronDown size={16} className={`text-white/40 transition-transform duration-200 ${opened ? "rotate-180" : ""}`} />
          </button>
        </PopoverTarget>
        <PopoverDropdown>
          <div className="flex flex-col">
            {balanceOptions.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  onSelect(item.value);
                  close();
                }}
                className={`px-4 py-3 text-left text-sm font-medium transition-colors border-b border-white/[0.04] last:border-b-0 ${
                  item.value === value ? "text-primary bg-primary/[0.06]" : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </PopoverDropdown>
      </Popover>
    </div>
  );

  return (
    <div className="w-full max-w-[540px] max-[600px]:max-w-[calc(100vw-2rem)] bg-[#181a20] rounded-2xl max-[600px]:rounded-xl flex flex-col p-8 max-[600px]:p-5 gap-6 max-[600px]:gap-5 border border-white/[0.06] relative animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-white">External Transfer</h4>
          <p className="text-sm text-white/40 mt-1">
            Request a one-time release code, then review and confirm the transfer
          </p>
        </div>
        {!embedded && (
          <button
            onClick={() => modals.closeAll()}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-95 text-white/60 hover:text-white"
          >
            <MdOutlineClose size={16} />
          </button>
        )}
      </div>

      {/* Step switcher */}
      <div className="grid grid-cols-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        <button
          type="button"
          onClick={() => setActiveStep("request")}
          className={`h-10 rounded-lg text-sm font-semibold transition-all ${
            activeStep === "request"
              ? "bg-primary text-white"
              : "text-white/50 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          Request Code
        </button>
        <button
          type="button"
          onClick={() => setActiveStep("transfer")}
          className={`h-10 rounded-lg text-sm font-semibold transition-all ${
            activeStep === "transfer"
              ? "bg-primary text-white"
              : "text-white/50 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          Transfer
        </button>
      </div>

      {/* From / Recipient Wallets */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BalanceSelector
            label="From Wallet"
            value={fromBalance}
            opened={fromOpen}
            toggle={fromHandlers.toggle}
            close={fromHandlers.close}
            onSelect={setFromBalance}
          />
          <BalanceSelector
            label="Recipient Wallet"
            value={toBalance}
            opened={toOpen}
            toggle={toHandlers.toggle}
            close={toHandlers.close}
            onSelect={setToBalance}
          />
        </div>
      </div>

      {/* Asset */}
      <div className={sectionClass}>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Asset
        </label>
        <SupportedListingsDropdown
          selectedCoin={selectedCoin}
          setSelectedCoin={setSelectedCoin}
        />
      </div>

      {/* Amount */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Amount</label>
          {assetSymbol && (
            <span className="text-xs text-white/40">
              Available:{" "}
              <span className="font-bold text-primary">
                {(+availableBalance).toLocaleString("en-US", { maximumFractionDigits: 8 })}{" "}
                {assetSymbol}
              </span>
            </span>
          )}
        </div>
        <NumberInput
          hideControls
          classNames={{
            section: "!w-fit !right-3",
            input: inputClass,
          }}
          placeholder="0.00"
          rightSection={
            <span className="flex items-center gap-2 pr-2">
              {selectedCoin.symbol && (
                <span className="flex items-center gap-1.5">
                  {selectedCoin.image && (
                    <img
                      src={selectedCoin.image}
                      alt={selectedCoin.symbol}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-xs font-bold text-white">
                    {selectedCoin.symbol}
                  </span>
                </span>
              )}
              <button
                type="button"
                onClick={() => setAmount(availableBalance)}
                className="px-2 py-1 bg-primary/15 hover:bg-primary/30 rounded-md text-xs text-primary font-bold transition-colors"
              >
                MAX
              </button>
            </span>
          }
          thousandSeparator=","
          value={amount}
          onChange={(val) => setAmount(`${val}`)}
        />
      </div>

      {/* Recipient User ID or Email */}
      <div className={sectionClass}>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Recipient User ID or Email
        </label>
        <TextInput
          placeholder="User ID or email address"
          value={toUserId}
          onChange={(e) => setToUserId(e.target.value)}
          classNames={{ input: inputClass }}
          error={recipientError}
        />
        <p className="text-xs text-white/30">
          Enter the recipient&apos;s Limiance user ID or their account email address.
        </p>
      </div>

      {activeStep === "request" && (
        <div className={sectionClass}>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-white">Code Request</span>
            <span className="text-xs text-white/40">
              Request a one-time code for {selectedCoin.symbol || "the selected asset"} before confirming transfer.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-white/35">Asset</span>
              <div className="mt-1 font-semibold text-white/90">{selectedCoin.symbol || "—"}</div>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-white/35">Amount</span>
              <div className="mt-1 font-semibold text-white/90">{amount || "—"}</div>
            </div>
          </div>

          {requestedCode && (
            <div className="rounded-lg border border-primary/20 bg-primary/[0.08] px-3 py-3">
              <span className="text-xs text-white/40">Requested code</span>
              <div className="mt-1 text-lg font-bold tracking-[0.2em] text-primary">{requestedCode}</div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => requestCode()}
              disabled={!selectedCoin.symbol || !amount || +amount <= 0 || requestingCode}
              className="h-[52px] flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all active:scale-[0.98] disabled:bg-white/[0.04] disabled:text-white/30"
            >
              {requestingCode ? <InlineLoading /> : requestedCode ? "Request Again" : "Request Code"}
            </button>
            <button
              type="button"
              onClick={() => setActiveStep("transfer")}
              disabled={!selectedCoin.symbol || !amount || +amount <= 0}
              className="h-[52px] flex-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold transition-all active:scale-[0.98] disabled:text-white/30"
            >
              <span className="sm:hidden">Transfer</span>
              <span className="hidden sm:inline">Continue to Transfer</span>
            </button>
          </div>
        </div>
      )}

      {/* Release Code */}
      <div className={sectionClass}>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Release Code
        </label>
        <TextInput
          placeholder="6-digit release code"
          value={releaseCode}
          onChange={(e) => setReleaseCode(e.target.value)}
          classNames={{ input: inputClass }}
        />
        <p className="text-xs text-white/30">
          Required to authorize the transfer for this asset.
        </p>
        <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <span className="text-xs text-white/40">
            {requestedCode
              ? "Requested code ready. Review the receipt below before submitting."
              : "Request the asset release code first, then enter it here."}
          </span>
          {!!requestedCode && (
            <button
              type="button"
              onClick={() => setReleaseCode(requestedCode)}
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Use code
            </button>
          )}
        </div>
      </div>

      {activeStep === "transfer" && (
        <div className={sectionClass}>
          <span className="text-sm font-semibold text-white">Transfer Receipt</span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-white/35">Recipient</span>
              <div className="mt-1 font-semibold text-white/90">{toUserId || "—"}</div>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-white/35">Asset</span>
              <div className="mt-1 font-semibold text-white/90">{selectedCoin.symbol || "—"}</div>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-white/35">Amount</span>
              <div className="mt-1 font-semibold text-white/90">{amount || "—"}</div>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-white/35">Release Code</span>
              <div className="mt-1 font-semibold text-white/90">{releaseCode || "—"}</div>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-white/35">From Wallet</span>
              <div className="mt-1 font-semibold text-white/90">{selectedFromLabel}</div>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-white/35">Recipient Wallet</span>
              <div className="mt-1 font-semibold text-white/90">{selectedToLabel}</div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => transfer()}
        disabled={
          activeStep !== "transfer" ||
          !selectedCoin.symbol ||
          !amount ||
          +amount <= 0 ||
          !trimmedRecipient ||
          !!recipientError ||
          !releaseCode ||
          transferring
        }
        className="h-[56px] rounded-xl bg-primary hover:bg-primary/90 hover:shadow-[0_0_16px_rgba(77,119,240,0.3)] text-white font-bold transition-all active:scale-[0.98] disabled:bg-white/[0.04] disabled:text-white/30 disabled:shadow-none flex items-center justify-center gap-2"
      >
        {transferring ? <InlineLoading /> : "Confirm Transfer"}
      </button>
    </div>
  );
};