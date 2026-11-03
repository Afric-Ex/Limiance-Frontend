"use client";

import Link from "next/link";
import { FaArrowRightArrowLeft, FaLayerGroup, FaCoins, FaShieldHalved } from "react-icons/fa6";
import { MdArrowOutward } from "react-icons/md";
import { LIM_NAME, LIM_SYMBOL } from "@/src/lib/lim";

const UTILITIES = [
  {
    icon: <FaShieldHalved size={18} />,
    title: "Hold & grow",
    description: `${LIM_NAME} stays in your portfolio the moment it's credited — counted toward your total assets in real time.`,
    href: "/assets",
    action: "View assets",
    gradient: "from-blue-500/20 to-primary/5",
    glow: "bg-blue-500/10",
  },
  {
    icon: <FaArrowRightArrowLeft size={18} />,
    title: "Convert & trade",
    description: `Swap ${LIM_SYMBOL} with USDT and other listed assets instantly at the live platform rate.`,
    href: "/assets",
    action: "Open wallet",
    gradient: "from-purple-500/20 to-primary/5",
    glow: "bg-purple-500/10",
  },
  {
    icon: <FaLayerGroup size={18} />,
    title: "Earn products",
    description: "Simple Earn, staking, launchpad, dual investment and more — launching on Limiance Earn.",
    href: "#earn-products",
    action: "Explore products",
    gradient: "from-primary/20 to-blue-500/5",
    glow: "bg-primary/10",
  },
  {
    icon: <FaCoins size={18} />,
    title: "Platform rewards",
    description: `Use ${LIM_SYMBOL} across the exchange and unlock tier-based fee discounts and exclusive perks.`,
    href: "#earn-products",
    action: "Learn more",
    gradient: "from-amber-500/15 to-primary/5",
    glow: "bg-amber-500/10",
  },
] as const;

export function LimUtility() {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:p-5">
      {/* Section header */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-white">Token Utilities</h2>
          <p className="text-xs text-white/45">Everything you can do with {LIM_SYMBOL} on Limiance.</p>
        </div>
        <Link href="/assets" className="shrink-0 text-xs font-semibold text-primary transition-colors hover:text-primary/80">
          View all →
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {UTILITIES.map((item) => (
          <li
            key={item.title}
            className={`group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br ${item.gradient} p-4 transition-all hover:border-white/[0.14] hover:scale-[1.01]`}
          >
            {/* Icon */}
            <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${item.glow} text-primary transition-all group-hover:scale-105`}>
              {item.icon}
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-xs leading-relaxed text-white/50 transition-colors group-hover:text-white/65">
                {item.description}
              </p>
            </div>

            <Link
              href={item.href}
              className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {item.action}
              <MdArrowOutward size={12} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}