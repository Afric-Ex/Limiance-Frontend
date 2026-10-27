import React from "react";
import { QuickBuy } from "../icons/quick-buy";
import { P2pTrading } from "../icons/p2p-trading";
import { FiatOtc } from "../icons/fiat-otc";
import { IoSwapHorizontal } from "react-icons/io5";
import { BsArrowRepeat } from "react-icons/bs";
import { MdAddCard } from "react-icons/md";
import clsx from "clsx";
import Link from "next/link";

const list = [
  {
    icon: QuickBuy,
    title: "One-Express / One-Click Buy",
    subtitle: "Purchase cryptocurrencies quickly and easily using your credit/debit card, Apple Pay, Google Pay, or fiat balance.",
    link: "/transactions/fiat-deposit?tab=card",
  },
  {
    icon: BsArrowRepeat,
    title: "Recurring Buy",
    subtitle: "Set up automated, recurring crypto purchases on a schedule (Auto-Invest) to build your portfolio over time.",
    link: "/assets/recurring-buy",
  },
  {
    icon: IoSwapHorizontal,
    title: "Convert",
    subtitle: "Instantly swap one cryptocurrency or fiat asset for another with zero fees and no slippage.",
    link: "/trades/convert",
  },
  {
    icon: P2pTrading,
    title: "P2P Trading",
    subtitle: "Buy and sell cryptocurrency directly with other users through a peer-to-peer marketplace with zero platform fees.",
    link: "/trades/p2p",
  },
  {
    icon: MdAddCard,
    title: "Fiat Deposit",
    subtitle: "Deposit local fiat currencies directly into your account via bank transfer or supported payment channels to fund your trades.",
    link: "/transactions/fiat-deposit",
  },
  {
    icon: FiatOtc,
    title: "Crypto Deposit",
    subtitle: "Transfer existing cryptocurrency assets from an external wallet or exchange into your Bybit account.",
    link: "/assets/deposit",
  },
];

export const BuyCryptoDropdown = () => {
  return (
    <div className="bg-[#181a20] border border-white/[0.06] px-2 py-2 rounded-xl flex flex-col min-w-[340px] shadow-2xl">
      {list.map((item) => (
        <Link
          href={item.link || ""}
          key={item.title}
          className={clsx(
            "cursor-pointer hover:bg-white/[0.02]",
            "flex items-start gap-3 py-2.5 px-2 group rounded-lg transition-colors"
          )}
        >
          <div className="mt-0.5 text-white/70 group-hover:text-primary transition-colors">
            <item.icon size={18} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm flex items-center gap-2 font-medium">
              <span className="group-hover:text-white text-white/90">{item.title}</span>
            </span>
            <span className="text-xs font-normal leading-snug text-white/50">
              {item.subtitle}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};
