import Link from "next/link";
import { GiCoins, GiStairsGoal } from "react-icons/gi";
import { RiRocketLine, RiSafeLine } from "react-icons/ri";
import { IoGitCompareOutline } from "react-icons/io5";
import { BsGraphUpArrow } from "react-icons/bs";

const list = [
  {
    title: "Simple Earn",
    subtitle: "Earn passive income on idle crypto assets",
    link: "/earn/simple-earn",
    icon: GiCoins,
  },
  {
    title: "Staking",
    subtitle: "Stake your tokens to secure networks and earn rewards",
    link: "/earn/staking",
    icon: GiStairsGoal,
  },
  {
    title: "Launchpad",
    subtitle: "Get early access to promising new token projects",
    link: "/earn/launchpad",
    icon: RiRocketLine,
  },
  {
    title: "Pool Savings",
    subtitle: "Flexible and fixed-term savings for steady returns",
    link: "/earn/pool-savings",
    icon: RiSafeLine,
  },
  {
    title: "Dual Investment",
    subtitle: "Earn high yields with structured investment products",
    link: "/earn/dual-investment",
    icon: IoGitCompareOutline,
  },
  {
    title: "Smart Trend",
    subtitle: "Automated strategies to optimize your earnings",
    link: "/earn/smart-trend",
    icon: BsGraphUpArrow,
  },
];

export const EarnDropdown = () => {
  return (
    <div className="bg-[#181a20] border border-white/[0.06] px-2 py-2 rounded-xl flex flex-col min-w-[320px] shadow-2xl">
      {list.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            href={item.link}
            key={item.title}
            className="cursor-pointer hover:bg-white/[0.02] flex items-start gap-3 py-2.5 px-2 group rounded-lg transition-colors"
          >
            <div className="mt-0.5 text-white/70 group-hover:text-primary transition-colors">
              <Icon size={18} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90 group-hover:text-white">{item.title}</span>
              <span className="text-xs text-white/50 leading-snug">{item.subtitle}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
