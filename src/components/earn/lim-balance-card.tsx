"use client";

import Link from "next/link";
import { modals } from "@mantine/modals";
import { BalanceCloak } from "@/src/components/shared/balance-cloak";
import { Button } from "@/src/components/ui/button";
import { StatCell } from "@/src/components/ui/stat-cell";
import { ConvertAsset } from "@/src/components/transactions/convert-asset";
import { LimTokenIcon } from "./lim-token-icon";
import { useLimWallet } from "@/src/hooks/use-lim-wallet";
import { LIM_SYMBOL } from "@/src/lib/lim";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";

/**
 * LIM holdings at a glance. Balances come from the shared portfolio feed, so
 * this card always agrees with the wallet and assets pages, and the app-wide
 * balance-cloak applies automatically.
 */
export function LimBalanceCard() {
  const { available, inTrading, locked, logo, isLoading } = useLimWallet();

  const openConvert = () => {
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      children: <ConvertAsset defaultFromAsset={LIM_SYMBOL} />,
    });
  };

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:rounded-xl max-[1150px]:p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <LimTokenIcon logo={logo} size={44} />
          <div className="min-w-0">
            <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
              LIM Balance
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Available to spend
            </p>
          </div>
        </div>
        <Link
          href="/assets"
          className="text-[var(--text-caption)] text-primary hover:text-primary-strong transition-colors shrink-0"
        >
          View assets
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[38px] leading-none font-bold text-[var(--color-text-primary)] tabular-nums">
            {isLoading ? (
              <span className="skeleton inline-block h-9 w-40 rounded align-middle" />
            ) : (
              <BalanceCloak balance={available} />
            )}
          </span>
          <span className="text-[var(--text-subtitle)] font-semibold text-[var(--color-text-secondary)]">
            {LIM_SYMBOL}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCell label="Available" value={<BalanceCloak balance={available} />} />
        <StatCell label="In trading" value={<BalanceCloak balance={inTrading} />} />
        <StatCell label="Locked" value={<BalanceCloak balance={locked} />} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/assets/earn/buy" className="flex-1">
          <Button variant="buy" className="w-full">
            Buy {LIM_SYMBOL}
          </Button>
        </Link>
        <Button variant="outline" className="flex-1" onClick={openConvert}>
          Convert an asset
        </Button>
      </div>
    </section>
  );
}
