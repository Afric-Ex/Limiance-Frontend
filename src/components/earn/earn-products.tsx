"use client";

import { useState } from "react";
import clsx from "clsx";
import type { IconType } from "react-icons";
import {
  FaArrowRightArrowLeft, FaArrowsRotate, FaChartLine,
  FaLock, FaPiggyBank, FaRocket, FaUsers,
} from "react-icons/fa6";
import { MdAccessTime, MdCheckCircle } from "react-icons/md";

export interface EarnProductPreviewStat { label: string; value: string }

export interface EarnProduct {
  name: string;
  description: string;
  features: readonly string[];
  icon: IconType;
  isLive?: boolean;
  preview: readonly EarnProductPreviewStat[];
}

export const EARN_PRODUCTS: EarnProduct[] = [
  {
    name: "Simple Earn",
    description: "Earn daily rewards on your idle assets with flexible savings — no lock-in, redeem whenever you want.",
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
    description: "Lock your assets for a fixed term and earn higher, predictable returns with transparent terms.",
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
    description: "Get early access to vetted token sales and secure your allocation before public listing.",
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
    description: "Save together — pool funds with other users to unlock shared, community-powered yields.",
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
    description: "Pick a target price and settlement date to earn enhanced yields regardless of market direction.",
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
    description: "Automate your strategy with scheduled recurring investments at the intervals you choose.",
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
    description: "Follow market momentum with automated strategies tuned to funding-rate and trend signals.",
    features: ["Automated strategy", "Trend signals", "Funding alerts"],
    icon: FaChartLine,
    preview: [
      { label: "Style", value: "Automated strategy" },
      { label: "Signals", value: "Trend + funding" },
      { label: "Alerts", value: "Funding alerts" },
    ],
  },
];

const ProductPreview = ({ product }: { product: EarnProduct }) => {
  const Icon = product.icon;
  return (
    <div className="animate-fade-up flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Left: info */}
      <div className="flex flex-1 flex-col gap-5">
        {/* Product identity */}
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Icon size={24} />
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-white">{product.name}</h3>
              <span className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                <MdAccessTime size={10} />
                Coming soon
              </span>
            </div>
            <p className="text-xs text-white/45">Launching on Limiance Earn</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-white/60">{product.description}</p>

        {/* Feature checklist */}
        <div className="flex flex-col gap-2">
          {product.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2.5 text-sm">
              <MdCheckCircle size={15} className="shrink-0 text-primary/70" />
              <span className="text-white/70">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: stats card */}
      <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] lg:w-72">
        <div className="border-b border-white/[0.06] px-5 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Product details</p>
        </div>
        <div className="flex flex-col divide-y divide-white/[0.05]">
          {product.preview.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="text-xs text-white/45">{stat.label}</span>
              <span className="text-right text-sm font-semibold text-white">{stat.value}</span>
            </div>
          ))}
          {/* Placeholder APY row */}
          <div className="flex items-center justify-between gap-4 bg-primary/[0.04] px-5 py-3.5">
            <span className="text-xs text-white/45">Est. APY</span>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              TBA at launch
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function EarnProducts({
  activeProduct,
  onProductChange,
}: {
  activeProduct?: string;
  onProductChange?: (name: string) => void;
}) {
  const [internalTab, setInternalTab] = useState(EARN_PRODUCTS[0].name);
  const activeName = activeProduct ?? internalTab;
  const active = EARN_PRODUCTS.find((p) => p.name === activeName) ?? EARN_PRODUCTS[0];

  const selectProduct = (name: string) => {
    setInternalTab(name);
    onProductChange?.(name);
  };

  return (
    <section
      id="earn-products"
      className="flex scroll-mt-6 flex-col gap-6 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:p-5"
    >
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-white">Earn products</h2>
        <p className="text-xs text-white/45">Flexible savings, staking, launchpad and more — launching soon.</p>
      </div>

      {/* Tab strip */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex min-w-max items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          {EARN_PRODUCTS.map((product) => {
            const isActive = product.name === active.name;
            const Icon = product.icon;
            return (
              <button
                key={product.name}
                type="button"
                onClick={() => selectProduct(product.name)}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all",
                  isActive
                    ? "bg-primary text-white shadow-[0_0_12px_rgba(77,119,240,0.3)]"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
                )}
              >
                <Icon size={13} />
                {product.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product detail */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <ProductPreview key={active.name} product={active} />
      </div>
    </section>
  );
}