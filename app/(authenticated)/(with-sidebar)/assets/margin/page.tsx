"use client";

import { useState, useEffect } from "react";
import { modals } from "@mantine/modals";
import { useMutation, useQuery } from "@tanstack/react-query";
import { tradingService } from "@/src/services/trading";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { successNotification } from "@/src/lib/notification-handler";
import { useRouter } from "next/navigation";
import { MarginTermsInfo } from "@/src/components/assets/margin-terms-info";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { MarginAccountPanel } from "@/src/components/trades/margin-account-panel";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AssetsMarginSkeleton } from "@/src/components/skeletons/assets";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";

function MarginInner() {
  const router = useRouter();
  const [tradeMode, setTradeMode] = useState<"cross" | "isolated">("cross");

  const { data: marginAccount, isLoading: marginAccountLoading, isError: marginAccountError } = useQuery({
    queryKey: ["margin-account"],
    queryFn: () => tradingService.getMarginAccount(),
    retry: false,
    throwOnError: false,
  });

  const { mutate: handleSetMarginMode } = useMutation({
    mutationFn: (mode: "cross" | "isolated") => tradingService.setMarginMode(mode),
    onSuccess: (data, mode) => {
      setTradeMode(mode);
      successNotification(`Margin mode set to ${mode === 'cross' ? 'Cross' : 'Isolated'}`);
    },
    onError: (e) => errorMessageHandler(e),
  });

  const hasMarginAccount =
    !marginAccountError &&
    !!marginAccount &&
    marginAccount.success !== false &&
    !!marginAccount?.data &&
    marginAccount.data.margin_level !== "" &&
    marginAccount.data.margin_level !== null &&
    marginAccount.data.margin_level !== undefined;

  useEffect(() => {
    if (marginAccountLoading || hasMarginAccount) return;

    modals.open({
      children: <MarginTermsInfo />,
      ...DEFAULT_MODAL_SETTINGS,
      size: "lg",
      styles: {
        content: {
          maxWidth: "calc(100vw - 32px)",
          backgroundColor: "#181a20",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
        },
        body: { padding: "20px" },
      },
      closeOnClickOutside: false,
      closeOnEscape: false,
      overlayProps: {
        onClick: () => {
          router.push("/dashboard");
        },
      },
    });
  }, [hasMarginAccount, marginAccountLoading, router]);

  return (
    <main className="flex w-full flex-col gap-6 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4 mt-2">
      {/* Page header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <MdOutlineAccountBalanceWallet size={22} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] leading-tight">
            Margin
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Borrow assets, track balances, and manage margin positions
          </p>
        </div>
      </div>

      <MarginAccountPanel
        tradeMode={tradeMode}
        onTradeModeChange={handleSetMarginMode}
      />
    </main>
  );
}

export default function Margin() {
  return (
    <PageSuspense fallback={<AssetsMarginSkeleton />}>
      <MarginInner />
    </PageSuspense>
  );
}
