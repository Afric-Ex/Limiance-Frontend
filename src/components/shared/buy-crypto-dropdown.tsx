import React from "react";
import { P2pTrading } from "../icons/p2p-trading";
import { FiatOtc } from "../icons/fiat-otc";
import { IoSwapHorizontal } from "react-icons/io5";
import { MdAddCard } from "react-icons/md";
import clsx from "clsx";
import Link from "next/link";
import { useTranslations } from "next-intl";

const list = [
  {
    icon: IoSwapHorizontal,
    titleKey: "convert",
    subtitleKey: "convertSubtitle",
    link: "/trades/spot",
  },
  {
    icon: P2pTrading,
    titleKey: "p2pTrading",
    subtitleKey: "p2pTradingSubtitle",
    link: "/trades/p2p",
  },
  {
    icon: MdAddCard,
    titleKey: "fiatDeposit",
    subtitleKey: "fiatDepositSubtitle",
    link: "/transactions/fiat-deposit",
  },
  {
    icon: FiatOtc,
    titleKey: "cryptoDeposit",
    subtitleKey: "cryptoDepositSubtitle",
    link: "/transactions/deposit",
  },
];

export const BuyCryptoDropdown = () => {
  const t = useTranslations("Dropdowns");
  return (
    <div className="bg-[#181a20] border border-white/[0.06] px-2 py-2 rounded-xl flex flex-col min-w-[340px] shadow-2xl">
      {list.map((item) => (
        <Link
          href={item.link || ""}
          key={item.titleKey}
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
              <span className="group-hover:text-white text-white/90">{t(item.titleKey as "convert")}</span>
            </span>
            <span className="text-xs font-normal leading-snug text-white/50">
              {t(item.subtitleKey as "convertSubtitle")}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};
