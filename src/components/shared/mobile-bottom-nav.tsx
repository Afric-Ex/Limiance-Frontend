"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Dashboard } from "../icons/dashboard";
import { Assets } from "../icons/assets";
import {
  IoStatsChart,
  IoPersonOutline,
  IoClose,
  IoTrendingUp,
  IoFlash,
  IoStorefront,
  IoWallet,
  IoSwapHorizontal,
} from "react-icons/io5";
import { MdAutoGraph } from "react-icons/md";
import { RiBarChartFill } from "react-icons/ri";
// ─── Trade Sheet ────────────────────────────────────────────────────────────

const tradeOptions = [
  {
    icon: IoTrendingUp,
    label: "Spot Trading",
    sub: "Buy & sell crypto instantly",
    href: "/trades/spot",
    color: "#ffffff",
    bg: "rgba(255,255,255,0.05)",
  },
  {
    icon: IoFlash,
    label: "Futures Trading",
    sub: "Trade with leverage up to 100x",
    href: "/trades/futures",
    color: "#ffffff",
    bg: "rgba(255,255,255,0.05)",
    badge: "PRO",
  },
  {
    icon: RiBarChartFill,
    label: "Margin Trading",
    sub: "Trade with borrowed funds",
    href: "/trades/margin",
    color: "#ffffff",
    bg: "rgba(255,255,255,0.05)",
  },
  {
    icon: IoStorefront,
    label: "P2P Trading",
    sub: "Trade directly with others",
    href: "/trades/p2p",
    color: "#ffffff",
    bg: "rgba(255,255,255,0.05)",
  },
  {
    icon: IoWallet,
    label: "Buy Crypto",
    sub: "Purchase with local currency",
    href: "/buy-crypto",
    color: "#ffffff",
    bg: "rgba(255,255,255,0.05)",
  },
  {
    icon: IoSwapHorizontal,
    label: "Convert",
    sub: "Instantly swap between assets",
    href: "/assets/spot",
    color: "#ffffff",
    bg: "rgba(255,255,255,0.05)",
  },
];

function TradeSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] sheet-enter">
        <div className="bg-[#13151c] rounded-t-3xl border-t border-white/[0.08] pb-safe">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-2 pb-4">
            <h3 className="text-lg font-bold text-white/90">Trade</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <IoClose size={18} />
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2 px-4 pb-8">
            {tradeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.href}
                  onClick={() => {
                    onClose();
                    router.push(opt.href);
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] active:scale-[0.98] transition-all hover:bg-white/[0.06] tap-scale text-left"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: opt.bg }}
                  >
                    <Icon size={20} style={{ color: opt.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-white/90">
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 tracking-wider">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white/40">{opt.sub}</span>
                  </div>
                  <svg
                    className="text-white/20 shrink-0"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Bottom Nav ─────────────────────────────────────────────────────────────

const tabs = [
  {
    name: "Home",
    link: "/dashboard",
    icon: Dashboard,
    matchPath: "/dashboard",
  },
  {
    name: "Markets",
    link: "/markets",
    icon: IoStatsChart,
    matchPath: "/markets",
  },
  // Center trade button — handled separately
  {
    name: "Assets",
    link: "/assets/overview",
    icon: Assets,
    matchPath: "/assets",
  },
  {
    name: "Profile",
    link: "/account/profile",
    icon: IoPersonOutline,
    matchPath: "/account",
  },
];

export const MobileBottomNav = () => {
  const pathname = usePathname();
  const [tradeOpen, setTradeOpen] = useState(false);

  return (
    <>
      <TradeSheet open={tradeOpen} onClose={() => setTradeOpen(false)} />

      <nav className="fixed bottom-0 left-0 right-0 z-50 min-[1150px]:hidden">
        {/* Glass bar */}
        <div className="bg-[#0f1117]/90 backdrop-blur-2xl border-t border-white/[0.06] px-2 flex items-center justify-around pb-safe">
          {/* Tab 1 & 2 */}
          {tabs.slice(0, 2).map((tab) => {
            const isActive =
              pathname === tab.matchPath ||
              pathname.startsWith(tab.matchPath + "/");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.link}
                className="flex flex-col items-center gap-1 px-4 py-3 tap-scale relative"
              >
                {/* Active glow dot */}
                {isActive && (
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6366f1] shadow-[0_0_6px_2px_rgba(99,102,241,0.6)]" />
                )}
                <Icon
                  size={22}
                  className={clsx(
                    "transition-all duration-200",
                    isActive
                      ? "text-[#6366f1] drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                      : "text-white/40"
                  )}
                />
                <span
                  className={clsx(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-[#6366f1]" : "text-white/35"
                  )}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}

          {/* Center Trade Button */}
          <div className="flex flex-col items-center -mt-6">
            <button
              onClick={() => setTradeOpen(true)}
              className="relative w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform bg-[#181a20] border border-white/[0.08]"
            >
              <IoSwapHorizontal size={24} className="text-white relative z-10" />
            </button>
            <span className="text-[10px] font-medium text-white/35 mt-1">
              Trade
            </span>
          </div>

          {/* Tab 3 & 4 */}
          {tabs.slice(2).map((tab) => {
            const isActive =
              pathname === tab.matchPath ||
              pathname.startsWith(tab.matchPath + "/");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.link}
                className="flex flex-col items-center gap-1 px-4 py-3 tap-scale relative"
              >
                {isActive && (
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6366f1] shadow-[0_0_6px_2px_rgba(99,102,241,0.6)]" />
                )}
                <Icon
                  size={22}
                  className={clsx(
                    "transition-all duration-200",
                    isActive
                      ? "text-[#6366f1] drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                      : "text-white/40"
                  )}
                />
                <span
                  className={clsx(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-[#6366f1]" : "text-white/35"
                  )}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
