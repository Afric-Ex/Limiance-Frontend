import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader, NumberInput } from "@mantine/core";
import { asset } from "@/src/services/asset";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import clsx from "clsx";
import { MdSwapVert } from "react-icons/md";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

export const MarginTransferModal = ({ pair, onClose }: { pair: string; onClose: () => void }) => {
  const delimiter = pair.includes("/") ? "/" : "_";
  const [pairBase, pairQuote] = pair.split(delimiter);

  // Directions: true = Spot -> Margin, false = Margin -> Spot
  const [isSpotToMargin, setIsSpotToMargin] = useState(true);
  const [amount, setAmount] = useState<number | string>("");

  useQueryClient();

  const { coins: portfolioResponse, refreshBalances } = usePortfolioWs();

  const parseNum = (val: any) => {
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // Dynamic asset list — only tokens the user actually holds (spot or margin balance > 0)
  const availableAssets = (portfolioResponse ?? [])
    .map((c: any) => ({
      symbol: c.symbol,
      spot: parseNum(c.spotBalance),
      margin: parseNum(c.marginBalance),
    }))
    .filter((a: any) => a.spot > 0 || a.margin > 0)
    .sort((x: any, y: any) => y.spot + y.margin - (x.spot + x.margin));

  // Keep the previously-defaulted token if the user still holds it, otherwise pick the largest balance
  const defaultAsset =
    availableAssets.find((a: any) => a.symbol === pairQuote)?.symbol ||
    availableAssets.find((a: any) => a.symbol === pairBase)?.symbol ||
    availableAssets[0]?.symbol ||
    pairQuote ||
    pairBase ||
    "USDT";

  const [selectedAsset, setSelectedAsset] = useState<string>(defaultAsset);

  // Once balances load, steer the selection to an asset the user actually holds
  useEffect(() => {
    if (availableAssets.length === 0) return;
    setSelectedAsset((current) => {
      if (current && availableAssets.some((a: any) => a.symbol === current)) return current;
      return availableAssets[0].symbol;
    });
  }, [availableAssets]);

  const selectedAssetData = portfolioResponse?.find((a: any) => a.symbol === selectedAsset);

  const spotBalance = selectedAssetData ? parseNum(selectedAssetData.spotBalance) : 0;
  const marginBalance = selectedAssetData ? parseNum(selectedAssetData.marginBalance) : 0;

  const availableBalance = isSpotToMargin ? spotBalance : marginBalance;

  const fmtBalance = (v: number) =>
    v === 0 ? "0" : v.toLocaleString("en-US", { maximumFractionDigits: 6 });

  const { mutate: handleTransfer, isPending: transferLoading } = useMutation({
    mutationFn: () => asset.internalTransfer({
      symbol: selectedAsset,
      fromBalance: isSpotToMargin ? "spot" : "margin",
      toBalance: isSpotToMargin ? "margin" : "spot",
      amount: String(amount),
    }),
    onSuccess: () => {
      successNotification(`Successfully transferred ${amount} ${selectedAsset}`);
      refreshBalances();
      onClose();
    },
    onError: (e) => errorMessageHandler(e),
  });

  return (
    <div className="flex flex-col gap-4">

      {/* Direction Toggle */}
      <div className="flex flex-col items-center gap-2 relative">
        <div className="w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
          <span className="text-xs text-white/50">From</span>
          <span className="text-sm font-semibold text-white">
            {isSpotToMargin ? "Spot Wallet" : "Margin Wallet"}
          </span>
        </div>

        <button
          onClick={() => setIsSpotToMargin(!isSpotToMargin)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#181a20] border border-white/[0.08] flex items-center justify-center hover:bg-white/5 transition-colors z-10 text-primary"
        >
          <MdSwapVert size={18} />
        </button>

        <div className="w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
          <span className="text-xs text-white/50">To</span>
          <span className="text-sm font-semibold text-white">
            {!isSpotToMargin ? "Spot Wallet" : "Margin Wallet"}
          </span>
        </div>
      </div>

      {/* Asset Selection */}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs text-white/50">Asset</label>
        {availableAssets.length === 0 ? (
          <div className="py-6 flex items-center justify-center rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span className="text-xs text-white/30">No assets with a balance to transfer</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {availableAssets.map((a: any) => {
              const active = selectedAsset === a.symbol;
              return (
                <button
                  key={a.symbol}
                  onClick={() => { setSelectedAsset(a.symbol); setAmount(""); }}
                  className={clsx(
                    "px-3 py-2 rounded-lg text-sm font-semibold transition-all border flex flex-col items-start leading-tight",
                    active
                      ? "bg-primary/15 border-primary/40 text-white"
                      : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
                  )}
                >
                  {a.symbol}
                  <span className={clsx("text-[10px] font-medium", active ? "text-primary/80" : "text-white/30")}>
                    {fmtBalance(isSpotToMargin ? a.spot : a.margin)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Amount Input */}
      <div className="flex flex-col gap-1.5 mt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/50">Amount</label>
          <span className="text-xs text-white/50">
            Available: {availableBalance.toLocaleString("en-US", { maximumFractionDigits: 6 })} {selectedAsset}
          </span>
        </div>
        <div className="relative">
          <NumberInput
            value={amount}
            onChange={(v) => setAmount(v)}
            placeholder="0.00"
            hideControls
            min={0}
            classNames={{
              input: "!bg-white/[0.03] !border-white/[0.06] !text-white !font-mono !text-sm !h-12 !pr-16 focus:!border-primary/50",
            }}
          />
          <button
            onClick={() => setAmount(availableBalance)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
          >
            MAX
          </button>
        </div>
      </div>

      <button
        onClick={() => handleTransfer()}
        disabled={transferLoading || !amount || +amount <= 0 || +amount > availableBalance || availableBalance <= 0}
        className="mt-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all text-[#181a20] font-bold text-sm py-3 rounded-lg flex items-center justify-center gap-2"
      >
        {transferLoading && <Loader size={14} color="#181a20" />}
        Confirm Transfer
      </button>
    </div>
  );
};