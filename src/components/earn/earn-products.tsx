"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  FaArrowRightArrowLeft,
  FaArrowsRotate,
  FaChartLine,
  FaLock,
  FaPiggyBank,
  FaRocket,
  FaUsers,
} from "react-icons/fa6";
import {
  ComingSoonPanel,
  type EarnProductOffering,
} from "./coming-soon-panel";

const PRODUCTS: EarnProductOffering[] = [
  {
    name: "Simple Earn",
    description:
      "Earn daily rewards on your idle assets with flexible savings — no lock-in, redeem whenever you want.",
    features: ["Flexible", "No lock-in", "Daily rewards"],
    icon: FaPiggyBank,
  },
  {
    name: "Staking",
    description:
      "Lock your assets for a fixed term and earn higher, predictable returns with transparent terms.",
    features: ["Fixed terms", "Predictable APY", "On-chain staking"],
    icon: FaLock,
  },
  {
    name: "Launchpad",
    description:
      "Get early access to vetted token sales and secure your allocation before public listing.",
    features: ["Token sales", "Fair allocation", "Early access"],
    icon: FaRocket,
  },
  {
    name: "Pool Savings",
    description:
      "Save together — pool funds with other users to unlock shared, community-powered yields.",
    features: ["Shared pools", "Community yield", "Low entry"],
    icon: FaUsers,
  },
  {
    name: "Dual Investment",
    description:
      "Pick a target price and settlement date to earn enhanced yields regardless of market direction.",
    features: ["Target price", "Flexible settlement", "Enhanced yield"],
    icon: FaArrowRightArrowLeft,
  },
  {
    name: "Auto Invest",
    description:
      "Automate your strategy with scheduled recurring investments at the intervals you choose.",
    features: ["Recurring plans", "Any schedule", "Dollar-cost averaging"],
    icon: FaArrowsRotate,
  },
  {
    name: "Smart Trend",
    description:
      "Follow market momentum with automated strategies tuned to funding-rate and trend signals.",
    features: ["Automated strategy", "Trend signals", "Funding alerts"],
    icon: FaChartLine,
  },
];

/** The full earn product suite. None of it is live yet, so every tab shows an
 * honest, styled "Coming Soon" panel — no invented rates, no fake flows. */
export function EarnProducts() {
  const [activeTab, setActiveTab] = useState(PRODUCTS[0].name);
  const activeProduct =
    PRODUCTS.find((product) => product.name === activeTab) ?? PRODUCTS[0];

  return (
    <section
      id="earn-products"
      className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:rounded-xl max-[1150px]:p-4 scroll-mt-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-[var(--text-subtitle)] font-semibold text-[var(--color-text-primary)]">
          Earn products
        </h2>
        <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          Flexible savings, staking, launchpad and more — launching soon.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {PRODUCTS.map((product) => (
          <button
            key={product.name}
            onClick={() => setActiveTab(product.name)}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border",
              activeTab === product.name
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-transparent border-white/[0.06] text-white/40 hover:text-white/70 hover:border-white/15"
            )}
          >
            {product.name}
          </button>
        ))}
      </div>

      <ComingSoonPanel key={activeTab} product={activeProduct} />
    </section>
  );
}
