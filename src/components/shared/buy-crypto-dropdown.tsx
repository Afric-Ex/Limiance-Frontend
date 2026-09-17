import React from "react";
import { QuickBuy } from "../icons/quick-buy";
import { P2pTrading } from "../icons/p2p-trading";
import { FiatOtc } from "../icons/fiat-otc";
import clsx from "clsx";
import Link from "next/link";

const list = [
  {
    icon: QuickBuy,
    title: "Quick Buy",
    subtitle: "Buy Crypto via VISA or Master Card",
  },
  {
    icon: P2pTrading,
    title: "P2P trading",
    subtitle: "Buy crypto from a verified merchants",
    rightSection: (
      <span className="py-[1px] font-medium text-6px px-6px bg-primary rounded-sm">
        0 fees
      </span>
    ),
    link: "/trades/p2p",
  },
  {
    icon: FiatOtc,
    title: "Fiat Deposit",
    subtitle: "Deposit fiat via bank transfer",
    isDiabled: true,
  },
];

export const BuyCryptoDropdown = () => {
  return (
    <div className="bg-gray-17/[97%] px-10px py-3 rounded-lg flex flex-col">
      {list.map((item) => (
        <Link
          href={item.link || ""}
          key={item.title}
          className={clsx(
            item.isDiabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:bg-gray-9/40",
            "flex items-center gap-2 py-10px px-2 group rounded"
          )}
        >
          <item.icon />
          <div className="flex flex-col gap-1">
            <span className="text-10px flex items-center gap-2 font-semibold">
              <span className="group-hover:text-primary">{item.title}</span>
              {item.rightSection}
            </span>
            <span className="text-8px font-medium text-white/55">
              {item.subtitle}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};
