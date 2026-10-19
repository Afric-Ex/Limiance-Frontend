"use client";

import Link from "next/link";
import { FaArrowRightArrowLeft, FaLayerGroup, FaCoins } from "react-icons/fa6";
import { LIM_NAME, LIM_SYMBOL } from "@/src/lib/lim";

const UTILITIES = [
  {
    icon: <FaArrowRightArrowLeft size={16} />,
    title: "Convert & trade",
    description: `Swap ${LIM_SYMBOL} with USDT and other listed assets at the live platform rate.`,
    href: "/assets",
    action: "Open wallet",
  },
  {
    icon: <FaLayerGroup size={16} />,
    title: "Earn products",
    description:
      "Simple Earn, staking, launchpad and more are on the way to Limiance Earn.",
    href: "#earn-products",
    action: "View products",
  },
  {
    icon: <FaCoins size={16} />,
    title: "Hold",
    description: `${LIM_NAME} stays in your wallet and counts toward your portfolio the moment it's credited.`,
    href: "/assets",
    action: "View assets",
  },
];

/** What LIM is for, grounded in surfaces that already exist in the app. */
export function LimUtility() {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:rounded-xl max-[1150px]:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[var(--text-subtitle)] font-semibold text-[var(--color-text-primary)]">
          Token Utilities
        </h2>
        <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          Your token, across the exchange.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {UTILITIES.map((item) => (
          <li
            key={item.title}
            className="group flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-primary/25 hover:bg-white/[0.03]"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary transition-colors group-hover:bg-primary/25"
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {item.title}
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] opacity-80 transition-opacity group-hover:opacity-100 group-hover:text-[var(--color-text-primary)]">
                {item.description}
              </p>
            </div>
            <Link
              href={item.href}
              className="mt-auto inline-flex w-fit items-center gap-1 rounded-sm text-xs font-semibold text-primary transition-colors hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              {item.action} <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
