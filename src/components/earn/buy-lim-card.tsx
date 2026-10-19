"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaCreditCard, FaHandshake } from "react-icons/fa6";
import { SiTether } from "react-icons/si";
import {
  MethodOptionList,
  MethodOption,
} from "@/src/components/shared/method-select-modal";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { useBalanceCloakStore } from "@/src/stores/balance-cloak-store";
import { useUserStore } from "@/src/stores/user-store";
import { LIM_SYMBOL } from "@/src/lib/lim";

const BUY_BADGE_CLASS = "bg-buy-tint text-buy border border-buy/25";
const BUY_ICON_BG = "from-buy/20 to-buy/5";
const BUY_CTA_CLASS =
  "bg-buy hover:bg-buy/90 hover:shadow-[0_0_16px_rgba(37,171,66,0.3)]";

/**
 * Method chooser for buying LIM. Each row routes into a flow that already
 * exists in the app — nothing here reinvents payments:
 *  - USDT → the in-app Buy LIM flow (server-quoted conversion)
 *  - Bank card → the Monabe NGN deposit flow, deep-linked with asset=LIM
 *  - P2P → USDT is traded there, then converted; LIM itself is not a P2P
 *    asset yet and the row says so instead of pretending otherwise.
 */
export function BuyLimCard() {
  const router = useRouter();
  const { coins } = usePortfolioWs({ coins: true });
  const cloakEnabled = useBalanceCloakStore((s) => s.enabled);
  const legacyHide = useUserStore((s) => s.hideBalance);
  const hideBalance = cloakEnabled || legacyHide;

  const usdtBalance = useMemo(() => {
    const usdt = coins.find(
      (coin) => String(coin.symbol).toUpperCase() === "USDT"
    );
    if (!usdt) return 0;
    return Number(usdt.fundingBalance ?? 0) + Number(usdt.spotBalance ?? 0);
  }, [coins]);

  const balanceText = hideBalance
    ? "**** USDT"
    : `${usdtBalance.toLocaleString("en-US")} USDT`;

  const options: MethodOption[] = [
    {
      icon: <SiTether className="text-buy" size={22} />,
      iconBg: BUY_ICON_BG,
      ctaColor: BUY_CTA_CLASS,
      title: "Pay with USDT",
      badge: "Recommended",
      badgeClass: BUY_BADGE_CLASS,
      description: `Balance: ${balanceText}|Instant conversion at the live platform rate.`,
      onSelect: () => router.push("/assets/earn/buy"),
    },
    {
      icon: <FaCreditCard className="text-primary" size={20} />,
      title: "Bank card",
      description: `Fund with Naira (NGN) by card.|Receive ${LIM_SYMBOL} directly — pre-selected for you.`,
      onSelect: () => router.push("/transactions/fiat-deposit?tab=card&asset=LIM"),
    },
    {
      icon: <FaHandshake className="text-primary" size={20} />,
      title: "P2P (USDT)",
      description: `${LIM_SYMBOL} isn't listed on P2P yet.|Buy USDT from other users, then convert.`,
      onSelect: () => router.push("/trades/p2p"),
    },
  ];

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:rounded-xl max-[1150px]:p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[var(--text-subtitle)] font-semibold text-[var(--color-text-primary)]">
          Buy {LIM_SYMBOL}
        </h2>
        <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          Choose how you want to pay.
        </p>
      </div>
      <MethodOptionList options={options} />
    </section>
  );
}
