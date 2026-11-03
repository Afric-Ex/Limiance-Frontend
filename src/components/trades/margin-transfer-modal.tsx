import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader, NumberInput } from "@mantine/core";
import { asset } from "@/src/services/asset";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import clsx from "clsx";
import { MdSwapVert } from "react-icons/md";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

export type WalletType = "funding" | "spot" | "margin" | "futures";

const WALLET_OPTIONS: { value: WalletType; label: string }[] = [
  { value: "funding", label: "Funding Wallet" },
  { value: "spot", label: "Spot Wallet" },
  { value: "margin", label: "Margin Wallet" },
  { value: "futures", label: "Futures Wallet" },
];

export const MarginTransferModal = ({
  pair,
  initialMode = "spot",
  onClose,
}: {
  pair: string;
  initialMode?: "spot" | "cross" | "isolated";
  onClose: () => void;
}) => {
  const delimiter = pair.includes("/") ? "/" : "_";
  const [pairBase, pairQuote] = pair.split(delimiter);

  const [fromWallet, setFromWallet] = useState<WalletType>(
    initialMode === "spot" ? "funding" : "spot"
  );
  const [toWallet, setToWallet] = useState<WalletType>(
    initialMode === "spot" ? "spot" : "margin"
  );
  const [amount, setAmount] = useState<number | string>("");

  useQueryClient();

  const { coins: portfolioResponse, refreshBalances } = usePortfolioWs({ coins: true });

  const parseNum = (val: any) => {
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/,/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const getWalletBalance = (coin: any, wallet: WalletType) => {
    if (!coin) return 0;
    if (wallet === "spot") return parseNum(coin.spotBalance);
    if (wallet === "margin") return parseNum(coin.marginBalance);
    if (wallet === "futures") return parseNum(coin.futuresBalance);
    return parseNum(coin.fundingBalance ?? coin.funding_balance ?? coin.mainBalance ?? 0);
  };

  // Dynamic asset list — tokens the user holds in source or destination wallet, plus current pair currencies
  const availableAssets = (portfolioResponse ?? [])
    .map((c: any) => ({
      symbol: c.symbol,
      fromBal: getWalletBalance(c, fromWallet),
      toBal: getWalletBalance(c, toWallet),
    }))
    .filter((a: any) => a.fromBal > 0 || a.toBal > 0 || a.symbol === pairQuote || a.symbol === pairBase)
    .sort((x: any, y: any) => y.fromBal - x.fromBal);

  const defaultAsset =
    availableAssets.find((a: any) => a.symbol === pairQuote)?.symbol ||
    availableAssets.find((a: any) => a.symbol === pairBase)?.symbol ||
    availableAssets[0]?.symbol ||
    pairQuote ||
    pairBase ||
    "USDT";

  const [selectedAsset, setSelectedAsset] = useState<string>(defaultAsset);

  useEffect(() => {
    if (availableAssets.length === 0) return;
    setSelectedAsset((current) => {
      if (current && availableAssets.some((a: any) => a.symbol === current)) return current;
      return availableAssets[0]?.symbol || defaultAsset;
    });
  }, [availableAssets]);

  const selectedAssetData = portfolioResponse?.find((a: any) => a.symbol === selectedAsset);
  const availableBalance = getWalletBalance(selectedAssetData, fromWallet);

  const fmtBalance = (v: number) =>
    v === 0 ? "0" : v.toLocaleString("en-US", { maximumFractionDigits: 6 });

  const handleSwapWallets = () => {
    const prevFrom = fromWallet;
    const prevTo = toWallet;
    setFromWallet(prevTo);
    setToWallet(prevFrom);
    setAmount("");
  };

  const { mutate: handleTransfer, isPending: transferLoading } = useMutation({
    mutationFn: () =>
      asset.internalTransfer({
        symbol: selectedAsset,
        fromBalance: fromWallet,
        toBalance: toWallet,
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
      {/* Direction Selectors with Swap Button */}
      <div className="flex flex-col items-center gap-2 relative">
        <div className="w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
          <span className="text-xs text-white/50 w-12 shrink-0">From</span>
          <select
            value={fromWallet}
            onChange={(e) => {
              const val = e.target.value as WalletType;
              if (val === toWallet) setToWallet(fromWallet);
              setFromWallet(val);
              setAmount("");
            }}
            className="bg-transparent text-sm font-semibold text-white outline-none cursor-pointer border-none text-right"
          >
            {WALLET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#181a20] text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSwapWallets}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#181a20] border border-white/[0.08] flex items-center justify-center hover:bg-white/5 transition-colors z-10 text-primary"
        >
          <MdSwapVert size={18} />
        </button>

        <div className="w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
          <span className="text-xs text-white/50 w-12 shrink-0">To</span>
          <select
            value={toWallet}
            onChange={(e) => {
              const val = e.target.value as WalletType;
              if (val === fromWallet) setFromWallet(toWallet);
              setToWallet(val);
              setAmount("");
            }}
            className="bg-transparent text-sm font-semibold text-white outline-none cursor-pointer border-none text-right"
          >
            {WALLET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#181a20] text-white">
                {opt.label}
              </option>
            ))}
          </select>
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
                  onClick={() => {
                    setSelectedAsset(a.symbol);
                    setAmount("");
                  }}
                  className={clsx(
                    "px-3 py-2 rounded-lg text-sm font-semibold transition-all border flex flex-col items-start leading-tight",
                    active
                      ? "bg-primary/15 border-primary/40 text-white"
                      : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
                  )}
                >
                  {a.symbol}
                  <span className={clsx("text-2xs font-medium", active ? "text-primary/80" : "text-white/30")}>
                    {fmtBalance(a.fromBal)}
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
              input:
                "!bg-white/[0.03] !border-white/[0.06] !text-white !font-mono !text-sm !h-12 !pr-16 focus:!border-primary/50",
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
