"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MdOutlineSwapHoriz, MdArrowForward } from "react-icons/md";
import { IoSparklesOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { LuRepeat } from "react-icons/lu";
import { FiCreditCard } from "react-icons/fi";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { BuyCryptoSkeleton } from "@/src/components/skeletons/with-sidebar";

const tabs = [
  { label: "P2P Trading", href: "/trades/p2p" },
  { label: "Crypto Deposit", href: "/transactions/deposit" },
  { label: "Convert", href: null },
];



function BuyCryptoInner() {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");

  return (
    <main className="flex flex-col gap-8 w-full pb-10 min-h-[60vh] max-[1150px]:pb-[90px] max-[1150px]:px-4 page-enter">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">Buy Crypto</h1>
        <p className="text-sm text-white/40">Trade crypto with local currency via P2P or deposit directly</p>
      </div>

      {/* Sub-nav tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-0 overflow-x-auto whitespace-nowrap hide-scrollbar">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href ?? "#"}
            className="px-4 py-3 text-sm font-medium text-white/50 hover:text-white border-b-2 border-transparent hover:border-primary/50 transition-all shrink-0"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start max-[1150px]:flex max-[1150px]:flex-col-reverse">

        {/* Left Column: Info */}
        <div className="flex flex-col gap-8 max-[1150px]:gap-6 w-full">
          {/* Hero */}
          <div className="bg-[#181a20] border border-white/[0.06] rounded-2xl p-8 max-[1150px]:p-5 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl max-[1150px]:text-lg font-bold text-white">
                One-Click Buy USDT With <span className="text-primary">NGN</span>
              </h2>
              <p className="text-sm text-white/50 leading-relaxed max-w-lg">
                Trade USDT seamlessly on Limiance with P2P and multiple payment options.
                Buy from verified merchants with zero fees and instant settlement.
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-6 pt-2 max-[1150px]:gap-4 max-[1150px]:justify-between max-[1150px]:flex-wrap">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Avg. Price</span>
                <span className="text-lg font-bold text-white">₦1,650 <span className="text-xs text-white/40 font-medium">/ USDT</span></span>
              </div>
              <div className="w-px h-10 bg-white/[0.06] max-[1150px]:hidden" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Merchants</span>
                <span className="text-lg font-bold text-success-5">120+ <span className="text-xs text-white/40 font-medium">verified</span></span>
              </div>
              <div className="w-px h-10 bg-white/[0.06] max-[1150px]:hidden" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Fees</span>
                <span className="text-lg font-bold text-primary">0%</span>
              </div>
            </div>
          </div>

          {/* Promo Banner */}
          <div className="bg-gradient-to-r from-primary/[0.08] to-primary/[0.02] border border-primary/20 rounded-2xl p-6 max-[1150px]:p-4 flex max-[1150px]:flex-col items-center justify-between gap-6 max-[1150px]:gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-warning-1/20 text-warning-1 text-[10px] font-bold rounded uppercase tracking-wider">Trading Event</span>
                <span className="text-[10px] text-success-5 font-medium">● Ongoing</span>
              </div>
              <h3 className="text-base font-bold text-white">New User Welcome Bonus</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Deposit $100 or more and trade any amount on Spot or P2P to earn a 10 USDT airdrop.
              </p>
            </div>
            <Link
              href="/trades/p2p"
              className="shrink-0 flex items-center justify-center max-[1150px]:w-full gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 hover:shadow-[0_0_16px_rgba(77,119,240,0.3)]"
            >
              Start Trading <MdArrowForward size={16} />
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#181a20] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3 hover:border-white/[0.12] transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <IoShieldCheckmarkOutline size={20} />
              </div>
              <h4 className="text-sm font-bold text-white">Verified Merchants</h4>
              <p className="text-xs text-white/40 leading-relaxed">All P2P merchants are identity-verified and reviewed for reliability.</p>
            </div>
            
            <div className="bg-[#181a20] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3 hover:border-white/[0.12] transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <LuRepeat size={20} />
              </div>
              <h4 className="text-sm font-bold text-white">Zero Fees</h4>
              <p className="text-xs text-white/40 leading-relaxed">Buy and sell crypto via P2P with absolutely no trading fees.</p>
            </div>

            <div className="bg-[#181a20] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3 hover:border-white/[0.12] transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <MdOutlineSwapHoriz size={20} />
              </div>
              <h4 className="text-sm font-bold text-white">Multiple Payment Methods</h4>
              <p className="text-xs text-white/40 leading-relaxed">Bank transfer, mobile money, and more — pay however suits you.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Buy/Sell Card */}
        <div className="sticky top-24 max-[1150px]:relative max-[1150px]:top-0 bg-[#181a20] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col w-full">
          {/* Buy/Sell Tabs */}
          <div className="flex border-b border-white/[0.06]">
            <button
              onClick={() => setActiveTab("buy")}
              className={`flex-1 py-4 text-sm font-bold text-center transition-all relative ${
                activeTab === "buy"
                  ? "text-primary"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Buy
              {activeTab === "buy" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("sell")}
              className={`flex-1 py-4 text-sm font-bold text-center transition-all relative ${
                activeTab === "sell"
                  ? "text-primary"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Sell
              {activeTab === "sell" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5">
            {/* Spend */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                {activeTab === "buy" ? "Spend" : "Sell"}
              </label>
              <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl h-[56px] px-4 gap-3 focus-within:border-primary/40 transition-all">
                <input
                  type="text"
                  placeholder={activeTab === "buy" ? "4,500 - 23,000,000" : "Enter amount"}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none w-full min-w-0"
                />
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] rounded-lg cursor-pointer hover:bg-white/[0.1] transition-colors shrink-0">
                  <span className="text-sm">🇳🇬</span>
                  <span className="text-xs font-bold text-white">NGN</span>
                  <IoSparklesOutline size={10} className="text-white/40" />
                </div>
              </div>
            </div>

            {/* Receive */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1">
                Receive <span className="text-primary">≈</span>
              </label>
              <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl h-[56px] px-4 gap-3 focus-within:border-primary/40 transition-all">
                <input
                  type="text"
                  placeholder="Enter purchase amount"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none w-full min-w-0"
                />
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] rounded-lg cursor-pointer hover:bg-white/[0.1] transition-colors shrink-0">
                  <span className="w-4 h-4 rounded-full bg-success-5 flex items-center justify-center text-[8px] font-bold text-white">₮</span>
                  <span className="text-xs font-bold text-white">USDT</span>
                  <IoSparklesOutline size={10} className="text-white/40" />
                </div>
              </div>
            </div>

            {/* Rate */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-white/30">1 USDT ≈ 1,650 NGN</span>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-white/70">Payment Methods</span>
              <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl h-[56px] px-4 gap-3 cursor-pointer hover:border-white/[0.18] transition-all justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FiCreditCard size={16} className="text-primary" />
                  </span>
                  <span className="text-sm font-semibold text-white">Bank Transfer</span>
                </div>
                <IoSparklesOutline size={14} className="text-white/30" />
              </div>
            </div>

            {/* CTA */}
            <Link href="/trades/p2p" className="w-full h-[56px] rounded-xl bg-primary hover:bg-primary/90 hover:shadow-[0_0_16px_rgba(77,119,240,0.3)] text-white font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {activeTab === "buy" ? "Buy With NGN" : "Sell For NGN"}
            </Link>

            {/* Recurring Buy */}
            <Link
              href="#"
              className="flex items-center justify-center gap-2 text-xs text-white/40 hover:text-primary transition-colors py-1"
            >
              <LuRepeat size={14} />
              <span className="font-medium">Recurring Buy</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BuyCrypto() {
  return (
    <PageSuspense fallback={<BuyCryptoSkeleton />}>
      <BuyCryptoInner />
    </PageSuspense>
  );
}
