"use client";

import clsx from "clsx";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import React from "react";
import { Convert } from "../icons/convert";
import { Transfer } from "../icons/transfer";
import { Withdraw } from "../icons/withdraw";
import { useAssets } from "@/src/hooks/use-assets";
import { useRouter } from "next/navigation";
import { ConvertAsset } from "../transactions/convert-asset";
import { BalanceCloak } from "../shared/balance-cloak";
import { BalanceRevealControl } from "../shared/balance-reveal-control";
import { Skeleton } from "../shared/skeleton";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { deriveFundingBalance } from "@/src/lib/portfolio-utils";

export const WalletCard = ({ title, children }: { title?: string; children?: React.ReactNode }) => {
  const { push } = useRouter();
  const {
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
  const isFundingAccount = singleAccount === "funding";

  // Real-time balance data. `balances.total` comes from
  // the `overall_portfolio_balance` response to get_portfolio_balance;
  // per-account balances are derived from get_portfolio. Ask for whichever this
  // card actually renders so a page never opens both streams unnecessarily.
  const { balances, isLoading: balanceLoading } = usePortfolioWs(
    isFundingAccount
      ? { coins: true, balance: true }
      : singleAccount
        ? { coins: true }
        : { balance: true }
  );

  // Pick the right account balance; "total" is the overall from backend
  const acctBal = singleAccount ? balances[singleAccount] : balances["total"];
  const fundingBalance = isFundingAccount
    ? deriveFundingBalance(
        balances.total,
        balances.spot,
        balances.futures,
        balances.margin
      )
    : null;
  const [balanceWaitExpired, setBalanceWaitExpired] = React.useState(false);
  const hasUsdBalance = isFundingAccount
    ? fundingBalance != null
    : acctBal?.inUsd != null;

  React.useEffect(() => {
    setBalanceWaitExpired(false);
    if (hasUsdBalance) return;

    const timeout = window.setTimeout(() => setBalanceWaitExpired(true), 45_000);
    return () => window.clearTimeout(timeout);
  }, [hasUsdBalance, singleAccount]);

  const showBalanceLoader = !hasUsdBalance && !balanceWaitExpired;

  const safeNum = (val: string | null | undefined) => {
    const n = parseFloat(val ?? "");
    return isNaN(n) ? 0 : n;
  };

  const totalUsd = isFundingAccount
    ? fundingBalance?.inUsd ?? 0
    : safeNum(acctBal?.inUsd);
  const totalBtc = isFundingAccount
    ? fundingBalance?.inBtc ?? 0
    : safeNum(acctBal?.inBtc);

  // Server-provided 24h P&L (from get_portfolio / get_portfolio_balance).
  // pnlPercentage is a fraction (e.g. 0.00496626) → ×100 for display.
  const pnl = safeNum(acctBal?.pnl);
  const pnlPct = safeNum(acctBal?.pnlPercentage) * 100;

  const pnlDisplay = (pnl >= 0 ? "+" : "") + pnl.toFixed(2);
  const pnlPctDisplay = (pnlPct >= 0 ? "+" : "") + pnlPct.toFixed(2) + "%";
  const isPnlUp = pnl >= 0;

  const balance = { inUsd: totalUsd, inBtc: totalBtc };

  const buttons = [
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
  ];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.05] bg-gradient-to-br from-surface via-elevated to-black animate-fade-up max-[1150px]:rounded-xl">
      {/* Glow blobs */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-6 lg:p-7 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: label + balance + P&L */}
          <div className="flex flex-col gap-3 max-w-md">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary/70">
                {title ?? "Total Assets"}
              </span>
              <BalanceRevealControl />
            </div>

            {showBalanceLoader ? (
              <Skeleton variant="balance" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums leading-none">
                    <BalanceCloak balance={balance?.inUsd ?? 0} />
                  </span>
                  <span className="text-base font-semibold text-white/40">USD</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-white/50">
                  <span>≈</span>
                  <span><BalanceCloak balance={balance?.inBtc ?? 0} /></span>
                  <span className="text-xs text-white/30">BTC</span>
                </div>
              </>
            )}

            {/* P&L line */}
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Today&apos;s P&L
              </span>
              {showBalanceLoader ? (
                <Skeleton variant="text" width="100px" height="14px" />
              ) : (
                <span className={clsx("flex items-center gap-1 text-sm font-mono font-bold", isPnlUp ? "text-[#25AB42]" : "text-error-1")}>
                  <span>{pnlDisplay}</span>
                  <span>({pnlPctDisplay})</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: action cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:shrink-0">
            {buttons.map((item) => (
              <button
                key={item.text}
                onClick={item.action}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 rounded-xl p-3.5 min-w-[96px] transition-all duration-200 active:scale-95",
                  item.isPrimary
                    ? "bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary"
                    : "bg-white/[0.04] border border-white/[0.05] text-white/80 hover:bg-white/[0.08] hover:border-white/15"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{item.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional slot: Deposit / Fiat Channels merged into the same hero */}
        {children != null && (
          <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-5">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
