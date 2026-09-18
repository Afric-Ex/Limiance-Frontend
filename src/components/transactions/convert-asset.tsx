"use client";

import { useState, useEffect } from "react";
import { modals } from "@mantine/modals";
import { NumberInput } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Select } from "@mantine/core";
import { asset } from "@/src/services/asset";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { tradingService } from "@/src/services/trading";
import { MdOutlineClose, MdSwapVert } from "react-icons/md";
import { SuccessModal } from "../login/verify-email-success";
import { InlineLoading } from "../shared/inline-loading";
import { SupportedListingsDropdown } from "../assets/supported-pairs-dropdown";
import { SelectedCoin } from "@/src/hooks/use-deposit";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";

interface ConvertAssetProps {
  defaultFromAsset?: string;
}

export const ConvertAsset = ({ defaultFromAsset }: ConvertAssetProps) => {
  useQueryClient();
  const [fromCoin, setFromCoin] = useState<SelectedCoin>({
    name: "",
    image: "",
    symbol: defaultFromAsset ?? "",
    contractAddress: "",
  });

  const [toCoin, setToCoin] = useState<SelectedCoin>({
    name: "",
    image: "",
    symbol: "",
    contractAddress: "",
  });

  const [amount, setAmount] = useState("");
  const [sourceWallet, setSourceWallet] = useState<string>("funding");

  const rateEnabled =
    !!fromCoin.symbol && !!toCoin.symbol && !!amount && +amount > 0;

  const { coins: portfolio, refreshBalances } = usePortfolioWs();

  // hydrate name + image when modal opens with a pre-set symbol
  useEffect(() => {
    if (defaultFromAsset && !fromCoin.name && portfolio) {
      const entry = portfolio.find((p: any) => p.symbol.toUpperCase() === defaultFromAsset.toUpperCase());
      if (entry) {
        setFromCoin({
          name: entry.name,
          symbol: entry.symbol,
          image: entry.image,
          contractAddress: "",
        });
      }
    }
  }, [portfolio, defaultFromAsset, fromCoin.name]);

  const fromEntry = portfolio?.find((p: any) => p.symbol.toUpperCase() === fromCoin.symbol.toUpperCase());
  
  // Calculate balance based on selected source wallet
  const getSelectedBalance = () => {
    if (!fromEntry) return "0";
    switch (sourceWallet) {
      case "spot": return fromEntry.spotBalance;
      case "margin": return fromEntry.marginBalance;
      case "futures": return fromEntry.futuresBalance;
      case "funding":
      default: return fromEntry.fundingBalance;
    }
  };
  
  const fromBalance = getSelectedBalance();

  const { data: rate, isFetching: rateFetching, isError: rateError } = useQuery({
    queryKey: ["conversion-rate-preview", fromCoin.symbol, toCoin.symbol, amount],
    queryFn: () =>
      tradingService.conversionRate({
        fromAsset: fromCoin.symbol,
        toAsset: toCoin.symbol,
        quantity: amount,
      }),
    select: (res: any) => res?.data as {
      baseRate: string;
      amountUSD: string;
      amountNGN: string;
      baseUSDPrice: string;
      baseNGNPrice: string;
      baseInQuote: string;
      baseInQuoteNGN: string;
      baseInQuoteUSD: string;
    } | undefined,
    enabled: rateEnabled,
    staleTime: 10000,
    retry: false,
    throwOnError: false,
  });

  const { mutate: convert, isPending } = useMutation({
    mutationFn: () =>
      asset.convertAsset({
        fromAsset: fromCoin.symbol,
        toAsset: toCoin.symbol,
        amount,
        sourceWallet,
      }),
    onSuccess: () => {
      // WebSocket auto-refreshes balances
      refreshBalances();

      modals.open({
        children: (
          <SuccessModal
            title="Conversion Successful"
            description={`Your ${fromCoin.symbol} has been converted to ${toCoin.symbol}`}
            onProceed={modals.closeAll}
            onClose={modals.closeAll}
          />
        ),
        ...DEFAULT_MODAL_SETTINGS,
        onClose: modals.closeAll,
      });
    },
    onError(e) {
      errorMessageHandler(e);
    },
  });

  const canSubmit =
    !!fromCoin.symbol && !!toCoin.symbol && fromCoin.symbol !== toCoin.symbol && !!amount && +amount > 0 && !isPending;

  const handleSwap = () => {
    setFromCoin(toCoin);
    setToCoin(fromCoin);
  };

  return (
    <div className="w-full max-w-[540px] max-[600px]:max-w-[calc(100vw-2rem)] bg-[#181a20] rounded-2xl max-[600px]:rounded-xl flex flex-col p-8 max-[600px]:p-5 gap-6 max-[600px]:gap-5 border border-white/[0.06] relative animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-white">Convert</h4>
          <p className="text-sm text-white/40 mt-1">Swap one asset for another instantly</p>
        </div>
        <button
          onClick={() => modals.closeAll()}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-95 text-white/60 hover:text-white"
        >
          <MdOutlineClose size={16} />
        </button>
      </div>

      {/* From */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">From</label>
          {fromCoin.symbol && (
            <span className="text-xs text-white/40">
              Available:{" "}
              <span className="font-bold text-primary">
                {(+fromBalance).toLocaleString("en-US", { maximumFractionDigits: 6 })}{" "}
                {fromCoin.symbol}
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SupportedListingsDropdown
              selectedCoin={fromCoin}
              setSelectedCoin={setFromCoin}
            />
          </div>
        </div>
      </div>

      {/* Account Selector */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Source Account</label>
        <Select
          data={[
            { value: "funding", label: "Funding Account" },
            { value: "spot", label: "Spot Account" },
            { value: "margin", label: "Margin Account" },
            { value: "futures", label: "Futures Account" },
          ]}
          value={sourceWallet}
          onChange={(val) => setSourceWallet(val || "funding")}
          classNames={{
            input:
              "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[48px] !text-white !text-sm !transition-all !duration-200",
            dropdown: "!bg-elevated !border-white/[0.08]",
            option: "!text-white/80 hover:!bg-white/[0.04]",
          }}
        />
        <span className="text-[11px] text-white/35">
          Conversion currently runs against your selected balance.
        </span>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-2">
        <button
          onClick={handleSwap}
          className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-primary hover:bg-primary/10 hover:border-primary/30 transition-all active:scale-90"
        >
          <MdSwapVert size={20} />
        </button>
      </div>

      {/* To */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">To</label>
        <SupportedListingsDropdown
          selectedCoin={toCoin}
          setSelectedCoin={setToCoin}
        />
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Amount</label>
        <NumberInput
          hideControls
          classNames={{
            section: "!w-fit !right-3",
            input:
              "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[56px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20",
          }}
          placeholder="0.00"
          rightSection={
            <span className="flex items-center gap-2">
              {fromCoin.symbol && (
                <span className="flex items-center gap-1.5">
                  {fromCoin.image && (
                    <img src={fromCoin.image} alt={fromCoin.symbol} width={16} height={16} className="rounded-full" />
                  )}
                  <span className="text-xs font-bold text-white">{fromCoin.symbol}</span>
                </span>
              )}
              <button
                onClick={() => setAmount(fromBalance)}
                className="px-2 py-1 bg-primary/15 hover:bg-primary/30 rounded-md text-xs text-primary font-bold transition-colors"
              >
                MAX
              </button>
            </span>
          }
          thousandSeparator=","
          max={+fromBalance}
          clampBehavior="strict"
          value={amount}
          onChange={(val) => setAmount(`${val}`)}
        />
      </div>

      {/* Rate Preview */}
      {rateEnabled && (
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
          <span className="text-xs text-white/40">Rate</span>
          {rateFetching ? (
            <InlineLoading />
          ) : rateError ? (
            <span className="text-xs text-error-1 font-medium">Price unavailable for this pair</span>
          ) : rate?.baseInQuote !== undefined && rate.baseInQuote !== "" ? (
            <span className="text-xs font-semibold text-white/80">
              1 {fromCoin.symbol} ≈{" "}
              {(+rate.baseInQuote).toLocaleString("en-US", { maximumFractionDigits: 8 })}{" "}
              {toCoin.symbol}
            </span>
          ) : (
            <span className="text-xs text-white/30">—</span>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={() => convert()}
        disabled={!canSubmit}
        className="h-[56px] rounded-xl bg-primary hover:bg-primary/90 hover:shadow-[0_0_16px_rgba(77,119,240,0.3)] text-white font-bold transition-all active:scale-[0.98] disabled:bg-white/[0.04] disabled:text-white/30 disabled:shadow-none flex items-center justify-center gap-2"
      >
        {isPending ? <InlineLoading /> : "Convert"}
      </button>
    </div>
  );
};
