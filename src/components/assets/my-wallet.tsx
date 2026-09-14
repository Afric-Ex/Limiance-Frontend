"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { assetKeys, asset } from "@/src/services/asset";
import { Convert } from "../icons/convert";
import { Transfer } from "../icons/transfer";
import { Withdraw } from "../icons/withdraw";
import { BusinessCard } from "../icons/business-card";
import { BalanceCloak } from "../shared/balance-cloak";
import { Skeleton } from "../shared/skeleton";
import { useAssets } from "@/src/hooks/use-assets";
import { useRouter } from "next/navigation";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { ConvertAsset } from "../transactions/convert-asset";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

export const MyWallet = () => {
  const { push } = useRouter();
  const { handleOpenDepositModal, handleOpenInternalTransferModal } = useAssets();

  // Use WebSocket for real-time balance data
  const { balances, isLoading: balanceLoading } = usePortfolioWs();

  // "total" = backend overall, per-account derived from coins
  const fundingBal = balances["funding"];
  const overallBal = balances["total"];

  const overallLoading = balanceLoading;
  const fundingBalLoading = balanceLoading;

  const safeNum = (val: string | null | undefined) => {
    const n = parseFloat(val ?? "");
    return isNaN(n) ? 0 : n;
  };

  const fundingUsd = safeNum(fundingBal?.inUsd).toFixed(2);
  const fundingBtc = safeNum(fundingBal?.inBtc).toFixed(8);

  const overallUsdNum = safeNum(overallBal?.inUsd);
  const fundingUsdNum = safeNum(fundingBal?.inUsd);
  const tradingUsd = Math.max(0, overallUsdNum - fundingUsdNum).toFixed(2);
  
  const overallBtcNum = safeNum(overallBal?.inBtc);
  const fundingBtcNum = safeNum(fundingBal?.inBtc);
  const tradingBtc = Math.max(0, overallBtcNum - fundingBtcNum).toFixed(8);

  const fundingLoading = fundingBalLoading;
  const tradingLoading = overallLoading || fundingBalLoading;

  const actions = [
    { icon: BusinessCard, text: "Deposit", onClick: handleOpenDepositModal },
    { icon: Withdraw, text: "Withdraw", onClick: () => push("/transactions/withdrawal") },
    { icon: Transfer, text: "Transfer", onClick: () => handleOpenInternalTransferModal() },
    {
      icon: Convert,
      text: "Convert",
      onClick: () =>
        modals.open({
          children: <ConvertAsset />,
          ...DEFAULT_MODAL_SETTINGS,
        }),
    },
  ];

  return (
    <div className="flex flex-col gap-4 animate-fade-up stagger-1 max-[1150px]:gap-3">
      <h3 className="text-xl font-bold mb-2 max-[1150px]:mb-0 max-[1150px]:text-lg">My Assets</h3>
      
      <div className="rounded-xl border border-white/[0.06] bg-[#181a20] flex flex-col divide-y divide-white/[0.04]">
        {/* ROW 1: Funding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 max-[1150px]:p-4 gap-4 max-[1150px]:gap-3 row-hover transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold max-[1150px]:text-sm">Funding</span>
              <span className="text-xs text-white/50 max-[1150px]:text-[10px]">Deposits / Withdrawals / P2P</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:items-end gap-1">
            {fundingLoading ? (
              <Skeleton variant="text" width="100px" height="20px" />
            ) : (
              <div className="flex items-baseline gap-1.5 justify-end max-[1150px]:justify-start">
                <span className="text-base font-semibold max-[1150px]:text-sm">
                  <BalanceCloak balance={fundingUsd} />
                </span>
                <span className="text-xs text-white/50 max-[1150px]:text-[10px]">USD</span>
              </div>
            )}
            {fundingLoading ? (
              <Skeleton variant="text" width="60px" height="14px" />
            ) : (
              <div className="flex items-baseline gap-1 justify-end max-[1150px]:justify-start">
                <span className="text-xs text-white/40 max-[1150px]:text-[10px]">≈ <BalanceCloak balance={fundingBtc} /></span>
                <span className="text-[10px] text-white/30">BTC</span>
              </div>
            )}
          </div>

          <div className="flex items-center sm:justify-end gap-2 mt-2 sm:mt-0 max-[1150px]:grid max-[1150px]:grid-cols-4 max-[1150px]:mt-2">
            {actions.map((action) => (
              <button
                key={action.text}
                onClick={action.onClick}
                title={action.text}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-95 max-[1150px]:bg-white/5 max-[1150px]:flex max-[1150px]:justify-center max-[1150px]:rounded-lg"
              >
                <action.icon className="w-4 h-4 max-[1150px]:w-5 max-[1150px]:h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* ROW 2: Unified Trading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 max-[1150px]:p-4 gap-4 max-[1150px]:gap-3 row-hover transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-[#F0B90B] rounded-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold max-[1150px]:text-sm">Unified Trading</span>
              <span className="text-xs text-white/50 w-full max-w-[200px] leading-tight max-[1150px]:text-[10px]">
                Spot, Futures, Margin, Earn, Bots
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:items-end gap-1">
            {tradingLoading ? (
              <Skeleton variant="text" width="100px" height="20px" />
            ) : (
              <div className="flex items-baseline gap-1.5 justify-end max-[1150px]:justify-start">
                <span className="text-base font-semibold max-[1150px]:text-sm">
                  <BalanceCloak balance={tradingUsd} />
                </span>
                <span className="text-xs text-white/50 max-[1150px]:text-[10px]">USD</span>
              </div>
            )}
            {tradingLoading ? (
              <Skeleton variant="text" width="60px" height="14px" />
            ) : (
              <div className="flex items-baseline gap-1 justify-end max-[1150px]:justify-start">
                <span className="text-xs text-white/40 max-[1150px]:text-[10px]">≈ <BalanceCloak balance={tradingBtc} /></span>
                <span className="text-[10px] text-white/30">BTC</span>
              </div>
            )}
          </div>

          <div className="flex items-center sm:justify-end gap-2 mt-2 sm:mt-0 max-[1150px]:grid max-[1150px]:grid-cols-4 max-[1150px]:mt-2">
            <button className="text-xs font-semibold px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors max-[1150px]:rounded-lg max-[1150px]:h-full max-[1150px]:col-span-1">
              Trade
            </button>
            {actions.slice(2).map((action) => (
              <button
                key={action.text}
                onClick={action.onClick}
                title={action.text}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-95 max-[1150px]:bg-white/5 max-[1150px]:flex max-[1150px]:justify-center max-[1150px]:rounded-lg"
              >
                <action.icon className="w-4 h-4 max-[1150px]:w-5 max-[1150px]:h-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
