"use client";

import { useState } from "react";
import clsx from "clsx";
import type { IconType } from "react-icons";
import {
  FaArrowRightArrowLeft,
  FaArrowsRotate,
  FaChartLine,
  FaLock,
  FaPiggyBank,
  FaRocket,
  FaUsers,
} from "react-icons/fa6";

export interface EarnProductPreviewStat {
  label: string;
  value: string;
}

export interface EarnProduct {
  name: string;
  description: string;
  features: readonly string[];
  icon: IconType;
  /** Three headline facts shown in the preview card. No invented numbers —
   *  rate figures stay "shared at launch" until operations confirms them. */
  preview: readonly EarnProductPreviewStat[];
}

/** The full earn product suite, shared with the "Ways to earn" teaser grid. */
export const EARN_PRODUCTS: EarnProduct[] = [
  {
    name: "Simple Earn",
    description:
      "Earn daily rewards on your idle assets with flexible savings — no lock-in, redeem whenever you want.",
    features: ["Flexible", "No lock-in", "Daily rewards"],
    icon: FaPiggyBank,
    preview: [
      { label: "APY estimate", value: "Shared at launch" },
      { label: "Lock period", value: "None — flexible" },
      { label: "Redemption", value: "Anytime" },
    ],
  },
  {
    name: "Staking",
    description:
      "Lock your assets for a fixed term and earn higher, predictable returns with transparent terms.",
    features: ["Fixed terms", "Predictable APY", "On-chain staking"],
    icon: FaLock,
    preview: [
      { label: "Return type", value: "Fixed APY" },
      { label: "Lock period", value: "Fixed term" },
      { label: "Redemption", value: "At maturity" },
    ],
  },
  {
    name: "Launchpad",
    description:
      "Get early access to vetted token sales and secure your allocation before public listing.",
    features: ["Token sales", "Fair allocation", "Early access"],
    icon: FaRocket,
    preview: [
      { label: "Access", value: "Early allocation" },
      { label: "Allocation", value: "Fair lottery" },
      { label: "Listing", value: "Before public" },
    ],
  },
  {
    name: "Pool Savings",
    description:
      "Save together — pool funds with other users to unlock shared, community-powered yields.",
    features: ["Shared pools", "Community yield", "Low entry"],
    icon: FaUsers,
    preview: [
      { label: "Entry", value: "Low minimum" },
      { label: "Yield", value: "Community pools" },
      { label: "Payout", value: "Shared returns" },
    ],
  },
  {
    name: "Dual Investment",
    description:
      "Pick a target price and settlement date to earn enhanced yields regardless of market direction.",
    features: ["Target price", "Flexible settlement", "Enhanced yield"],
    icon: FaArrowRightArrowLeft,
    preview: [
      { label: "Yield", value: "Enhanced APY" },
      { label: "Settlement", value: "Flexible dates" },
      { label: "Structure", value: "Target price" },
    ],
  },
  {
    name: "Auto Invest",
    description:
      "Automate your strategy with scheduled recurring investments at the intervals you choose.",
    features: ["Recurring plans", "Any schedule", "Dollar-cost averaging"],
    icon: FaArrowsRotate,
    preview: [
      { label: "Schedule", value: "Daily / weekly / monthly" },
      { label: "Strategy", value: "Dollar-cost averaging" },
      { label: "Control", value: "Pause anytime" },
    ],
  },
  {
    name: "Smart Trend",
    description:
      "Follow market momentum with automated strategies tuned to funding-rate and trend signals.",
    features: ["Automated strategy", "Trend signals", "Funding alerts"],
    icon: FaChartLine,
    preview: [
      { label: "Style", value: "Automated strategy" },
      { label: "Signals", value: "Trend + funding" },
      { label: "Alerts", value: "Funding alerts" },
    ],
  },
];

const ComingSoonBadge = () => (
  <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
    Coming soon
  </span>
);

/**
 * Preview card for one earn product. Deliberately richer than a bare
 * "coming soon" state: the product story (description + feature badges) and
 * three preview facts are real copy from the offering spec, while rate figures
 * stay honest until operations confirms them.
 */
const ProductPreview = ({ product }: { product: EarnProduct }) => {
  const Icon = product.icon;

  return (
    <div
      key={product.name}
      className="animate-fade-up rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 max-[1150px]:p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[var(--color-text-primary)]">
              {product.name}
            </h3>
            <p className="text-[var(--text-micro)] text-[var(--color-text-secondary)]">
              Launching on Limiance Earn
            </p>
          </div>
        </div>
        <ComingSoonBadge />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {product.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {product.features.map((feature) => (
          <span
            key={feature}
            className="rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/60"
          >
            {feature}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-3">
        {product.preview.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              {stat.label}
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * The full earn product suite. None of it is live yet, so every tab shows an
 * honest preview card — real product copy, a subtle "coming soon" badge, and
 * no invented rates. Tab navigation follows the Markets underline pattern.
 */
export function EarnProducts({
  activeProduct,
  onProductChange,
}: {
  activeProduct?: string;
  onProductChange?: (name: string) => void;
}) {
  const [internalTab, setInternalTab] = useState(EARN_PRODUCTS[0].name);
  const activeName = activeProduct ?? internalTab;
  const active =
    EARN_PRODUCTS.find((product) => product.name === activeName) ??
    EARN_PRODUCTS[0];

  const selectProduct = (name: string) => {
    setInternalTab(name);
    onProductChange?.(name);
  };

  return (
    <section
      id="earn-products"
      className="flex scroll-mt-6 flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:rounded-xl max-[1150px]:p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-[var(--text-subtitle)] font-semibold text-[var(--color-text-primary)]">
          Earn products
        </h2>
        <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          Flexible savings, staking, launchpad and more — launching soon.
        </p>
      </div>

      <div className="overflow-x-auto scrollbar-none border-b border-white/[0.06]">
        <div className="flex min-w-max items-center gap-6">
          {EARN_PRODUCTS.map((product) => {
            const isActive = product.name === active.name;
            return (
              <button
                key={product.name}
                type="button"
                onClick={() => selectProduct(product.name)}
                aria-pressed={isActive}
                className={clsx(
                  "relative rounded-sm pb-3 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                  isActive ? "text-white" : "text-white/45 hover:text-white/70"
                )}
              >
                {product.name}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <ProductPreview key={active.name} product={active} />
    </section>
  );
}
