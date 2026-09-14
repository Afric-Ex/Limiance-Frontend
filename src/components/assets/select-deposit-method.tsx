import React from "react";
import { modals } from "@mantine/modals";
import { FaArrowRightLong } from "react-icons/fa6";
import Link from "next/link";
import { HiOutlineUsers } from "react-icons/hi2";
import { LuWallet } from "react-icons/lu";
import { IoSparklesOutline } from "react-icons/io5";
import { MdOutlineClose } from "react-icons/md";

export const SelectDepositMethod = () => {
  const actions = [
    {
      category: "Buy Crypto with Fiat",
      subtitle: "P2P Trading",
      badge: "0 Fees",
      badgeColor: "bg-success-5/10 text-success-5 border border-success-5/20",
      desc: "Buy crypto directly from verified merchants with zero fees.",
      link: "/trades/p2p",
      Icon: HiOutlineUsers,
      iconBg: "from-success-5/20 to-success-5/5",
      iconColor: "text-success-5",
      ctaColor:
        "bg-success-5 hover:bg-success-6 hover:shadow-[0_0_16px_rgba(14,203,129,0.3)]",
    },
    {
      category: "Deposit Crypto",
      subtitle: "Crypto Deposit",
      badge: null,
      desc: "Send crypto directly into your Limiance wallet from any external address.",
      link: "/transactions/deposit",
      Icon: LuWallet,
      iconBg: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      ctaColor:
        "bg-primary hover:bg-primary/90 hover:shadow-[0_0_16px_rgba(77,119,240,0.3)]",
    },
  ];

  return (
    <div className="w-full max-w-[540px] bg-[#181a20] rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="flex flex-col gap-0.5">
          <h4 className="text-lg font-bold text-white tracking-tight">Add Funds</h4>
          <p className="text-xs text-white/40">Choose how you want to deposit</p>
        </div>
        <button
          onClick={modals.closeAll}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-95 text-white/60 hover:text-white"
        >
          <MdOutlineClose size={16} />
        </button>
      </div>

      {/* Method Cards */}
      <div className="flex flex-col gap-3 p-6">
        {actions.map((item) => (
          <div
            key={item.subtitle}
            className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 overflow-hidden"
          >
            {/* subtle gradient left edge */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center justify-between px-5 py-5">
              {/* left: icon + text */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center shrink-0`}
                >
                  <item.Icon size={22} className={item.iconColor} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-white">
                      {item.subtitle}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-white/40 leading-relaxed max-w-[260px]">
                    {item.desc}
                  </span>
                </div>
              </div>

              {/* right: Go button */}
              <Link href={item.link} onClick={modals.closeAll} className="shrink-0 ml-4">
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-all active:scale-95 ${item.ctaColor}`}
                >
                  Go
                  <FaArrowRightLong size={10} />
                </button>
              </Link>
            </div>
          </div>
        ))}

        {/* Footer note */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <IoSparklesOutline size={12} className="text-primary/60" />
          <span className="text-xs text-white/30">
            New to crypto?{" "}
            <Link
              href=""
              className="text-primary/80 hover:text-primary transition-colors"
            >
              See our deposit guide →
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};
