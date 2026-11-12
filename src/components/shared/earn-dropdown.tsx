import Link from "next/link";
import { GiCoins, GiStairsGoal } from "react-icons/gi";
import { RiRocketLine, RiSafeLine } from "react-icons/ri";
import { IoGitCompareOutline } from "react-icons/io5";
import { BsGraphUpArrow } from "react-icons/bs";
import { useTranslations } from "next-intl";

const list = [
  {
    titleKey: "simpleEarn",
    subtitleKey: "simpleEarnSubtitle",
    link: "/assets/earn",
    icon: GiCoins,
  },
  {
    titleKey: "staking",
    subtitleKey: "stakingSubtitle",
    link: "/assets/earn",
    icon: GiStairsGoal,
  },
  {
    titleKey: "launchpad",
    subtitleKey: "launchpadSubtitle",
    link: "/assets/earn",
    icon: RiRocketLine,
  },
  {
    titleKey: "poolSavings",
    subtitleKey: "poolSavingsSubtitle",
    link: "/assets/earn",
    icon: RiSafeLine,
  },
  {
    titleKey: "dualInvestment",
    subtitleKey: "dualInvestmentSubtitle",
    link: "/assets/earn",
    icon: IoGitCompareOutline,
  },
  {
    titleKey: "smartTrend",
    subtitleKey: "smartTrendSubtitle",
    link: "/assets/earn",
    icon: BsGraphUpArrow,
  },
];

export const EarnDropdown = () => {
  const t = useTranslations("Dropdowns");
  return (
    <div className="bg-[#181a20] border border-white/[0.06] px-2 py-2 rounded-xl flex flex-col min-w-[320px] shadow-2xl">
      {list.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            href={item.link}
            key={item.titleKey}
            className="cursor-pointer hover:bg-white/[0.02] flex items-start gap-3 py-2.5 px-2 group rounded-lg transition-colors"
          >
            <div className="mt-0.5 text-white/70 group-hover:text-primary transition-colors">
              <Icon size={18} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/90 group-hover:text-white">{t(item.titleKey as "simpleEarn")}</span>
              <span className="text-xs text-white/50 leading-snug">{t(item.subtitleKey as "simpleEarnSubtitle")}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
