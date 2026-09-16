import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTab, Button, Select } from "@mantine/core";
import { tradingService } from "@/src/services/trading";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { MdWarning, MdInfoOutline } from "react-icons/md";
import clsx from "clsx";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

// Mirror of the backend constant: minBorrowMarginLevel = 1.3
const MIN_MARGIN_LEVEL = 1.3;

export const MarginBorrowRepayModal = ({ pair, tradeMode = "isolated", onClose, initialTab = "borrow" }: { pair: string; tradeMode?: "cross" | "isolated"; onClose: () => void; initialTab?: "borrow" | "repay" }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [amount, setAmount] = useState<string>("");
  
  // Handle both "BTC/USDT" and "BTC_USDT" formats
  const delimiter = pair.includes("/") ? "/" : "_";
  const [base, quote] = pair.split(delimiter);
  
  const [selectedAsset, setSelectedAsset] = useState<string>(quote);

  const queryClient = useQueryClient();

  const { coins: portfolioResponse, refreshBalances, marginAccount, balances } = usePortfolioWs();

  const parseNum = (val: any) => {
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/,/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const selectedAssetData = portfolioResponse?.find((a: any) => a.symbol === selectedAsset);
  const assetPrice = selectedAssetData ? parseNum(selectedAssetData.currencyPrice) || 1 : 1;
  const marginBalance = selectedAssetData ? parseNum(selectedAssetData.marginBalance) : 0;

  const marginAssetData = marginAccount?.assets?.find((a) => a.asset === selectedAsset);
  const currentBorrowed = marginAssetData ? parseNum(marginAssetData.borrowed) + parseNum(marginAssetData.interest) : 0;
  
  // Real-time backend constraints
  const fallbackTotalUsd = parseNum(balances?.margin?.inUsd ?? "0");
  const totalAssetsUsd = marginAccount && parseNum(marginAccount.total_assets_usd ?? marginAccount.totalAssetsUsd) > 0 ? parseNum(marginAccount.total_assets_usd ?? marginAccount.totalAssetsUsd) : fallbackTotalUsd;
  const totalLiabilitiesUsd = marginAccount ? parseNum(marginAccount.total_liability_usd ?? marginAccount.totalLiabilitiesUsd ?? marginAccount.totalLiabilityUsd) : 0;
  const equityUsd = marginAccount && parseNum(marginAccount.equity_usd ?? marginAccount.equityUsd ?? marginAccount.equity) > 0 ? parseNum(marginAccount.equity_usd ?? marginAccount.equityUsd ?? marginAccount.equity) : fallbackTotalUsd;
  const maxLeverage = marginAccount && parseNum(marginAccount.max_leverage ?? marginAccount.maxLeverage) > 0 ? parseNum(marginAccount.max_leverage ?? marginAccount.maxLeverage) : 3;

  // 1. Margin Level Floor Cap (1.3)
  // Projected Level = (TotalAssets + borrow) / (TotalLiabilities + borrow) >= 1.3
  // borrow <= (TotalAssets - 1.3 * TotalLiabilities) / 0.3
  const maxBorrowUsdMarginFloor = Math.max(0, (totalAssetsUsd - MIN_MARGIN_LEVEL * totalLiabilitiesUsd) / (MIN_MARGIN_LEVEL - 1));

  // 2. Leverage Cap
  // maxBorrow = equity * (maxLeverage - 1)
  // borrow <= maxBorrow - TotalLiabilities
  const maxBorrowUsdLeverage = Math.max(0, equityUsd * (maxLeverage - 1) - totalLiabilitiesUsd);

  // Take the most restrictive cap in USD, convert back to Asset
  const maxBorrowUsd = Math.min(maxBorrowUsdMarginFloor, maxBorrowUsdLeverage);
  const maxBorrowable = Math.floor((maxBorrowUsd / assetPrice) * 1e6) / 1e6;

  // Max repayable is the smaller of: free balance vs total debt for this asset
  const maxRepayable = Math.floor(Math.min(marginBalance, currentBorrowed) * 1e6) / 1e6;

  const enteredAmount = parseNum(amount);

  // Projected margin level after borrow
  const borrowValueUSD = enteredAmount * assetPrice;
  const projectedAssets = totalAssetsUsd + borrowValueUSD;
  const projectedLiabilities = totalLiabilitiesUsd + borrowValueUSD;
  const projectedMarginLevel = projectedLiabilities > 0 ? projectedAssets / projectedLiabilities : null;

  const isBorrowTab = activeTab === "borrow";

  // Check if we have no collateral, or if margin level is below minimum
  const noCollateral = isBorrowTab && totalAssetsUsd === 0 && marginBalance === 0;
  const exceedsMax    = isBorrowTab ? enteredAmount > maxBorrowable : enteredAmount > maxRepayable;
  const borrowInvalid = noCollateral || exceedsMax || !enteredAmount || enteredAmount <= 0;
  const repayInvalid  = !isBorrowTab && (!enteredAmount || enteredAmount <= 0 || enteredAmount > maxRepayable);

  const { mutate: handleBorrow, isPending: borrowLoading } = useMutation({
    mutationFn: async () => {
      const res = await tradingService.borrowMargin({ asset: selectedAsset, amount: enteredAmount });
      console.log("Borrow response:", res); // Debug log
      // Some backends return 200 but with a non-success status/message in the body
      if (res?.status === false || res?.success === false) {
        const errorMsg = res?.error || res?.message || res?.data?.message || res?.data?.error || "Borrow failed";
        throw new Error(errorMsg);
      }
      return res;
    },
    onSuccess: (_res) => {
      successNotification(`Successfully borrowed ${amount} ${selectedAsset}`);
      // Immediate refresh
      refreshBalances();
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["margin-balance"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      // Delayed refresh to catch async backend processing
      setTimeout(() => {
        refreshBalances();
        queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      }, 2000);
      setAmount("");
      onClose();
    },
    onError: (e) => errorMessageHandler(e),
  });

  const { mutate: handleRepay, isPending: repayLoading } = useMutation({
    mutationFn: async () => {
      const res = await tradingService.repayMargin({ asset: selectedAsset, amount: enteredAmount });
      console.log("Repay response:", res); // Debug log
      if (res?.status === false || res?.success === false) {
        const errorMsg = res?.error || res?.message || res?.data?.message || res?.data?.error || "Repay failed";
        throw new Error(errorMsg);
      }
      return res;
    },
    onSuccess: (_res) => {
      successNotification(`Successfully repaid ${amount} ${selectedAsset}`);
      refreshBalances();
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["margin-balance"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      setTimeout(() => {
        refreshBalances();
        queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      }, 2000);
      setAmount("");
      onClose();
    },
    onError: (e) => errorMessageHandler(e),
  });

  const isPending = borrowLoading || repayLoading;

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={activeTab}
        onChange={(v) => { setActiveTab((v as "borrow" | "repay") ?? "borrow"); setAmount(""); }}
        classNames={{
          tab: "text-sm font-semibold !text-white/40 data-[active]:!text-primary !border-0",
          list: "flex items-center gap-4 border-b border-white/[0.06] mb-2 pb-2",
        }}
      >
        <TabsList>
          <TabsTab value="borrow">Borrow</TabsTab>
          <TabsTab value="repay">Repay</TabsTab>
        </TabsList>
      </Tabs>

      {/* Asset Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/50">Asset</label>
        {tradeMode === "isolated" ? (
          <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
            <button
              onClick={() => { setSelectedAsset(quote); setAmount(""); }}
              className={clsx(
                "flex-1 text-sm font-semibold py-2 rounded-md transition-all",
                selectedAsset === quote ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {quote}
            </button>
            <button
              onClick={() => { setSelectedAsset(base); setAmount(""); }}
              className={clsx(
                "flex-1 text-sm font-semibold py-2 rounded-md transition-all",
                selectedAsset === base ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {base}
            </button>
          </div>
        ) : (
          <Select
            data={Array.from(new Set(portfolioResponse?.map((c: any) => c.symbol) || [])).map((sym) => ({
              value: String(sym),
              label: String(sym),
            }))}
            value={selectedAsset}
            onChange={(val) => {
              if (val) {
                setSelectedAsset(val);
                setAmount("");
              }
            }}
            searchable
            classNames={{
              input: "bg-white/[0.03] border-white/[0.06] text-white hover:border-white/[0.12] focus:border-primary/50 text-sm font-semibold h-11",
              dropdown: "bg-[#13151c] border-white/[0.06]",
              option: "hover:bg-white/[0.04] text-white text-sm data-[checked]:bg-primary/20 data-[checked]:text-primary",
            }}
          />
        )}
      </div>

      {/* No-collateral warning (borrow tab only) */}
      {noCollateral && (
        <div className="flex items-start gap-2 bg-[#f3ba2f]/10 border border-[#f3ba2f]/20 rounded-lg px-3 py-2.5">
          <MdWarning className="text-[#f3ba2f] mt-0.5 shrink-0" size={15} />
          <p className="text-[11px] text-[#f3ba2f]/90 leading-relaxed">
            You have no collateral in your Margin wallet. Use{" "}
            <strong>Transfer</strong> first to move funds from your Spot wallet.
          </p>
        </div>
      )}

      {/* Info row: collateral & max borrow (borrow tab only, has collateral) */}
      {isBorrowTab && totalAssetsUsd > 0 && (
        <div className="flex flex-col gap-1 bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-white/40">Total Margin Collateral</span>
            <span className="font-mono text-white/80">${totalAssetsUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-white/40 flex items-center gap-1">
              Max Borrowable
              <MdInfoOutline size={11} className="opacity-50" title={`Limited by Margin Level floor (1.3) or Max Leverage (${maxLeverage}x)`} />
            </span>
            <span className="font-mono text-primary font-semibold">
              {maxBorrowable > 0 ? maxBorrowable.toLocaleString("en-US", { maximumFractionDigits: 6 }) : "0.00"} {selectedAsset}
            </span>
          </div>
        </div>
      )}

      {/* Info row: current debt & max repay (repay tab only) */}
      {!isBorrowTab && (
        <div className="flex flex-col gap-1 bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-white/40">Current Debt</span>
            <span className="font-mono text-white/80">{currentBorrowed.toLocaleString("en-US", { maximumFractionDigits: 6 })} {selectedAsset}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-white/40">Free Balance</span>
            <span className="font-mono text-white/80">{marginBalance.toLocaleString("en-US", { maximumFractionDigits: 6 })} {selectedAsset}</span>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/50">Amount</label>
          {!isBorrowTab && (
            <span className="text-[10px] text-white/40">
              Balance: {marginBalance.toLocaleString("en-US", { maximumFractionDigits: 6 })} {selectedAsset}
            </span>
          )}
        </div>
        <div className={clsx(
          "flex items-center bg-white/[0.03] border rounded-lg px-3 h-12 transition-colors",
          exceedsMax ? "border-red-500/50" : "border-white/[0.06] focus-within:border-primary/50"
        )}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min={0}
            max={isBorrowTab ? maxBorrowable : maxRepayable}
            disabled={noCollateral && isBorrowTab}
            className="flex-1 bg-transparent border-none outline-none text-white text-sm font-mono disabled:opacity-40"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAmount(String(isBorrowTab ? maxBorrowable : maxRepayable))}
              disabled={(isBorrowTab && noCollateral) || (isBorrowTab && maxBorrowable === 0) || (!isBorrowTab && maxRepayable === 0)}
              className="text-[10px] text-primary font-bold hover:text-primary/80 disabled:opacity-30"
            >
              MAX
            </button>
            <span className="text-xs text-white/40 font-semibold">{selectedAsset}</span>
          </div>
        </div>

        {/* Validation messages */}
        {exceedsMax && (
          <p className="text-[11px] text-red-400 px-1 flex items-center gap-1">
            <MdWarning size={12} />
            Exceeds max borrowable. Reduce to {maxBorrowable.toLocaleString("en-US", { maximumFractionDigits: 6 })} {selectedAsset}.
          </p>
        )}
      </div>

      {/* Projected Margin Level (borrow tab, valid amount, has collateral) */}
      {isBorrowTab && projectedMarginLevel !== null && enteredAmount > 0 && !exceedsMax && totalAssetsUsd > 0 && (
        <div className="flex justify-between items-center px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.05] text-[11px]">
          <span className="text-white/40">Projected Margin Level</span>
          <span className={clsx(
            "font-mono font-semibold",
            projectedMarginLevel >= 2 ? "text-green-400" :
            projectedMarginLevel >= 1.5 ? "text-[#f3ba2f]" : "text-red-400"
          )}>
            {projectedMarginLevel.toFixed(2)}x
            {projectedMarginLevel >= 2 ? " ✓ Safe" :
             projectedMarginLevel >= 1.5 ? " ⚠ Caution" : " ✗ Risky"}
          </span>
        </div>
      )}

        <div className="flex gap-3 pt-2">
        <Button variant="default" fullWidth onClick={onClose} size="md" className="border-white/10 hover:bg-white/5 font-semibold">
          Cancel
        </Button>
        <Button
          fullWidth
          size="md"
          className="bg-primary hover:bg-primary/90 text-black font-semibold"
          disabled={isBorrowTab ? borrowInvalid : repayInvalid}
          loading={isPending}
          onClick={() => {
            if (isBorrowTab) handleBorrow();
            else handleRepay();
          }}
        >
          {isBorrowTab ? "Confirm Borrow" : "Confirm Repay"}
        </Button>
      </div> 
      {noCollateral && (
        <p className="text-center text-[11px] text-white/30">
          Close this modal and click <span className="text-primary font-semibold">Transfer</span> to add collateral.
        </p>
      )}
    </div>
  );
};
