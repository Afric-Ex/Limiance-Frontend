"use client";

import clsx from "clsx";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import React from "react";
import { BusinessCard } from "../icons/business-card";
import { Convert } from "../icons/convert";
import { Transfer } from "../icons/transfer";
import { Withdraw } from "../icons/withdraw";
import { useAssets } from "@/src/hooks/use-assets";
import { useRouter } from "next/navigation";
import { ConvertAsset } from "../transactions/convert-asset";
import { useDailyPnl } from "@/src/hooks/use-daily-pnl";
import { BalanceCloak } from "../shared/balance-cloak";
import { BalanceRevealControl } from "../shared/balance-reveal-control";
import { Skeleton } from "../shared/skeleton";
import { MdKeyboardArrowRight } from "react-icons/md";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

export const WalletCard = ({ title }: { title?: string }) => {
  const { push } = useRouter();
  const {
    handleOpenDepositModal,
    handleOpenInternalTransferModal,
    handleOpenExternalTransferModal,
  } = useAssets();
  const accountMap: Record<string, string> = {
    "Funding Account": "funding",
    "Spot": "spot",
    "Futures": "futures",
    "Margin": "margin",
  };
  const singleAccount = title ? accountMap[title] : undefined;

  // Use WebSocket for real-time balance data
  const { balances, isLoading: balanceLoading } = usePortfolioWs();

  // Pick the right account balance; "total" is the overall from backend
  const acctBal = singleAccount ? balances[singleAccount] : balances["total"];

  const safeNum = (val: string | null | undefined) => {
    const n = parseFloat(val ?? "");
    return isNaN(n) ? 0 : n;
  };

  const totalUsd = safeNum(acctBal?.inUsd);
  const totalBtc = safeNum(acctBal?.inBtc);

  // Calculate real 24h P&L from Binance public API
  const pnlAccount = singleAccount === "spot" ? "spot" : singleAccount === "margin" ? "margin" : singleAccount === "futures" ? "futures" : undefined;
  const { pnl: pnlNum, pnlPct: pnlPctNum } = useDailyPnl(pnlAccount);

  const pnlDisplay = (pnlNum >= 0 ? "+" : "") + pnlNum.toFixed(2);
  const pnlPctDisplay = (pnlPctNum >= 0 ? "+" : "") + pnlPctNum.toFixed(2) + "%";
  const isPnlUp = pnlNum >= 0;

  const balance = { inUsd: totalUsd, inBtc: totalBtc };

  const buttons = [
    {
      icon: BusinessCard,
      text: "Deposit",
      isPrimary: true,
      action: handleOpenDepositModal,
    },
    {
      icon: Withdraw,
      text: "Withdraw",
      isPrimary: false,
      action: () => push("/transactions/withdrawal"),
    },
    {
      icon: Transfer,
      text: "Transfer",
      isPrimary: false,
      action: () => {
        if (title === "Futures") {
          handleOpenInternalTransferModal("funding", "futures");
        } else {
          handleOpenInternalTransferModal();
        }
      },
    },
    {
      icon: Transfer,
      text: "Ext. Transfer",
      isPrimary: false,
      action: handleOpenExternalTransferModal,
    },
    ...(title !== "Funding Account"
      ? [
          {
            icon: Convert,
            text: "Convert",
            isPrimary: false,
            action: () =>
              modals.open({
                children: <ConvertAsset />,
                ...DEFAULT_MODAL_SETTINGS,
              }),
          },
        ]
      : []),
  ];

  return (
    <div className="animate-fade-up rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:p-4 max-[1150px]:rounded-xl">
      {/* Top row: Title + Eye toggle + Action buttons */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 max-[1150px]:mb-4 max-[1150px]:flex-col">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white/80">
            {title ?? "Assets Overview"}
          </h3>
          <BalanceRevealControl />
        </div>
        <div className="flex flex-wrap items-center gap-2 max-[1150px]:grid max-[1150px]:grid-cols-4 max-[1150px]:w-full">
          {buttons.map((item) => (
            <button
              key={item.text}
              onClick={item.action}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 max-[1150px]:flex-col max-[1150px]:p-2 max-[1150px]:justify-center max-[1150px]:text-[10px]",
                item.isPrimary
                  ? "bg-primary text-white hover:brightness-110 max-[1150px]:bg-white/5 max-[1150px]:border max-[1150px]:border-white/10"
                  : "border border-white/10 bg-transparent text-white hover:border-white/25 hover:bg-white/[0.04]"
              )}
            >
              <item.icon className="max-[1150px]:w-5 max-[1150px]:h-5" />
              <span className="max-[1150px]:whitespace-nowrap">{item.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Balance section */}
      <div className="flex flex-col gap-1">
        {balanceLoading ? (
          <Skeleton variant="balance" />
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl max-[1150px]:text-2xl font-bold text-white">
                <BalanceCloak balance={balance?.inUsd ?? 0} />
              </span>
              <span className="text-sm font-medium text-white/40">USD</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-white/40">≈</span>
              <span className="text-sm text-white/40">
                <BalanceCloak balance={balance?.inBtc ?? 0} />
              </span>
              <span className="text-xs text-white/30">BTC</span>
            </div>
          </>
        )}

        {/* PnL line */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-medium text-white/50">
            Today&apos;s P&L
          </span>
          {balanceLoading ? (
            <Skeleton variant="text" width="100px" height="14px" />
          ) : (
              <span className={clsx("flex items-center gap-1 text-sm", isPnlUp ? "text-[#25AB42]" : "text-error-1")}>
                <span>{pnlDisplay}</span>
                <span>({pnlPctDisplay})</span>
                <MdKeyboardArrowRight className="text-white/30" />
              </span>
          )}
        </div>
      </div>
    </div>
  );
};
