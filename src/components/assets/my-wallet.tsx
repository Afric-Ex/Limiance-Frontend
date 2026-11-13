"use client";

import React, { useEffect, useRef } from "react";
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
import { useWalletBalances } from "@/src/hooks/use-wallet-balances";
import { useBalanceCloak } from "@/src/stores/balance-cloak-store";
import { Eye } from "../icons/eye";
import { BsEyeSlashFill } from "react-icons/bs";
import toast from "react-hot-toast";
import { MdAccountBalanceWallet, MdCandlestickChart } from "react-icons/md";
import { useTranslations } from "next-intl";

export const MyWallet = () => {
  const t = useTranslations("Wallet");
  const { push } = useRouter();
  const { handleOpenDepositModal, handleOpenInternalTransferModal } = useAssets();
  const { funding, trading, isLoading, isConnected } = useWalletBalances();
  const { enabled, toggleCloak } = useBalanceCloak();

  const prevConnectedRef = useRef(isConnected);

  useEffect(() => {
    if (!isConnected && prevConnectedRef.current && !isLoading) {
      toast.loading(t("reconnecting"), { id: "wallet-ws" });
    } else if (isConnected) {
      toast.dismiss("wallet-ws");
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, isLoading, t]);

  const fundingUsd = funding?.inUsd ?? "0.00";
  const fundingBtc = funding?.inBtc ?? "0.00000000";
  const tradingUsd = trading?.inUsd ?? "0.00";
  const tradingBtc = trading?.inBtc ?? "0.00000000";

  const isFundingLoading = isLoading && !funding;
  const isTradingLoading = isLoading && !trading;

  const statusColor = isConnected
    ? "bg-green-500"
    : isLoading
      ? "bg-yellow-500 animate-pulse"
      : "bg-red-500";
  const statusLabel = isConnected
    ? t("realtimeConnected")
    : isLoading
      ? t("connecting")
      : t("disconnectedStale");

  const actions = [
    { id: "deposit", icon: BusinessCard, text: t("deposit"), onClick: handleOpenDepositModal },
    { id: "withdraw", icon: Withdraw, text: t("withdraw"), onClick: () => push("/transactions/withdrawal") },
    { id: "transfer", icon: Transfer, text: t("transfer"), onClick: () => handleOpenInternalTransferModal() },
    {
      id: "convert",
      icon: Convert,
      text: t("convert"),
      onClick: () =>
        modals.open({
          children: <ConvertAsset />,
          ...DEFAULT_MODAL_SETTINGS,
        }),
    },
  ];

  return (
    <div className="flex min-w-0 w-full flex-col gap-4 animate-fade-up stagger-1 max-[1150px]:gap-3" data-snapshot-hide>
      <div className="flex items-center justify-between mb-2 max-[1150px]:mb-0">
        <h3 className="text-xl font-bold max-[1150px]:text-lg">{t("myAssets")}</h3>
        <div className="flex items-center gap-3">
          <span
            data-testid="ws-status"
            aria-label={statusLabel}
            title={statusLabel}
            className={`w-2 h-2 rounded-full ${statusColor}`}
          />
          <button
            aria-label={enabled ? t("showBalances") : t("hideBalances")}
            title={enabled ? t("showBalances") : t("hideBalances")}
            onClick={toggleCloak}
            data-testid="cloak-toggle"
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            {enabled ? <Eye className="w-4 h-4" /> : <BsEyeSlashFill size={16} />}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#181a20] flex flex-col divide-y divide-white/[0.04]">
        {/* ROW 1: Funding */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between p-5 max-[1150px]:p-4 gap-4 max-[1150px]:gap-3 row-hover transition-colors">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MdAccountBalanceWallet size={17} className="text-primary" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-base font-semibold max-[1150px]:text-sm">{t("funding")}</span>
              <span className="text-xs text-white/50 max-[1150px]:text-2xs">{t("depositsWithdrawalsP2p")}</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col sm:items-end gap-1">
            {isFundingLoading ? (
              <Skeleton variant="text" width="100px" height="20px" />
            ) : (
              <div className="flex items-baseline gap-1.5 justify-end max-[1150px]:justify-start">
                <span className="text-base font-semibold max-[1150px]:text-sm">
                  <BalanceCloak balance={fundingUsd} />
                </span>
                <span className="text-xs text-white/50 max-[1150px]:text-2xs">USD</span>
              </div>
            )}
            {isFundingLoading ? (
              <Skeleton variant="text" width="60px" height="14px" />
            ) : (
              <div className="flex items-baseline gap-1 justify-end max-[1150px]:justify-start">
                <span className="text-xs text-white/40 max-[1150px]:text-2xs">≈ <BalanceCloak balance={fundingBtc} /></span>
                <span className="text-2xs text-white/30">BTC</span>
              </div>
            )}
          </div>

          <div className="flex max-w-full flex-wrap items-center gap-2 sm:justify-end mt-2 sm:mt-0 max-[1150px]:grid max-[1150px]:w-full max-[1150px]:grid-cols-4 max-[1150px]:mt-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                title={action.text}
                aria-label={action.text}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-95 max-[1150px]:bg-white/5 max-[1150px]:flex max-[1150px]:justify-center max-[1150px]:rounded-lg"
              >
                <action.icon className="w-4 h-4 max-[1150px]:w-5 max-[1150px]:h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* ROW 2: Unified Trading */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between p-5 max-[1150px]:p-4 gap-4 max-[1150px]:gap-3 row-hover transition-colors">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center flex-shrink-0">
              <MdCandlestickChart size={17} className="text-[#F0B90B]" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="whitespace-nowrap text-base font-semibold max-[1150px]:text-sm">{t("unifiedTrading")}</span>
              <span className="text-xs text-white/50 w-full max-w-[200px] leading-tight max-[1150px]:text-2xs">
                {t("spotFuturesMargin")}
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col sm:items-end gap-1">
            {isTradingLoading ? (
              <Skeleton variant="text" width="100px" height="20px" />
            ) : (
              <div className="flex items-baseline gap-1.5 justify-end max-[1150px]:justify-start">
                <span className="text-base font-semibold max-[1150px]:text-sm">
                  <BalanceCloak balance={tradingUsd} />
                </span>
                <span className="text-xs text-white/50 max-[1150px]:text-2xs">USD</span>
              </div>
            )}
            {isTradingLoading ? (
              <Skeleton variant="text" width="60px" height="14px" />
            ) : (
              <div className="flex items-baseline gap-1 justify-end max-[1150px]:justify-start">
                <span className="text-xs text-white/40 max-[1150px]:text-2xs">≈ <BalanceCloak balance={tradingBtc} /></span>
                <span className="text-2xs text-white/30">BTC</span>
              </div>
            )}
          </div>

          <div className="flex max-w-full flex-wrap items-center gap-2 sm:justify-end mt-2 sm:mt-0 max-[1150px]:grid max-[1150px]:w-full max-[1150px]:grid-cols-4 max-[1150px]:mt-2">
            <button
              onClick={() => push("/markets")}
              aria-label={t("trade")}
              className="whitespace-nowrap text-xs font-semibold px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors max-[1150px]:rounded-lg max-[1150px]:h-full max-[1150px]:col-span-1"
            >
              {t("trade")}
            </button>
            {actions.slice(2).map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                title={action.text}
                aria-label={action.text}
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
