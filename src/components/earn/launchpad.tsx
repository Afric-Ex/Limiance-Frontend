"use client";

import { RiRobot2Line, RiGiftFill } from "react-icons/ri";
import { MdArrowOutward, MdRocketLaunch } from "react-icons/md";

const LAUNCHPAD_ITEMS = [
  {
    icon: RiRobot2Line,
    title: "Trading Bots",
    description: "Automate your trading strategies 24/7. Set it and forget it with intelligent bot trading.",
    href: "/assets/trading-bots",
    comingSoon: true,
  },
  {
    icon: RiGiftFill,
    title: "Rewards Hub",
    description: "Manage and track all your rewards from earning programs and platform activities.",
    href: "/assets/earn",
    comingSoon: true,
  },
] as const;

export function Launchpad() {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:p-5">
      {/* Section header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MdRocketLaunch size={20} className="text-primary" />
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-white">Launchpad</h2>
            <p className="text-xs text-white/45">Explore upcoming features and opportunities.</p>
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LAUNCHPAD_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-white/[0.01] p-4 transition-all hover:border-white/[0.12]"
            >
              {/* Coming Soon badge */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                  Coming Soon
                </span>
              </div>

              {/* Icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:scale-110">
                <Icon size={18} />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1.5 pr-24">
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs leading-relaxed text-white/50 transition-colors group-hover:text-white/65">
                  {item.description}
                </p>
              </div>

              {/* Link (disabled due to coming soon) */}
              <div className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-white/40">
                Learn more
                <MdArrowOutward size={12} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
