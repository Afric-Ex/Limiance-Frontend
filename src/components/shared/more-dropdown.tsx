import Link from "next/link";
import { MdOutlineDiamond, MdOutlinePayment, MdOutlineAccountBalance } from "react-icons/md";
import { RiNftLine } from "react-icons/ri";
import { BsWallet2 } from "react-icons/bs";
import { PiPlantBold } from "react-icons/pi";
import { useTranslations } from "next-intl";

const list = [
  {
    titleKey: "vipInstitutional",
    subtitleKey: "vipInstitutionalSubtitle",
    link: "/support",
    icon: MdOutlineDiamond,
    badge: "NEW",
  },
  {
    titleKey: "launchpool",
    subtitleKey: "launchpoolSubtitle",
    link: "/assets/earn",
    icon: PiPlantBold,
  },
  {
    titleKey: "pay",
    subtitleKey: "paySubtitle",
    link: "/transactions/deposit",
    icon: MdOutlinePayment,
  },
  {
    titleKey: "loans",
    subtitleKey: "loansSubtitle",
    link: "/support",
    icon: MdOutlineAccountBalance,
  },
  {
    titleKey: "nft",
    subtitleKey: "nftSubtitle",
    link: "/markets",
    icon: RiNftLine,
  },
  {
    titleKey: "web3Wallet",
    subtitleKey: "web3WalletSubtitle",
    link: "/assets/overview",
    icon: BsWallet2,
  },
];

export const MoreDropdown = () => {
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
              <span className="text-sm flex items-center gap-2 font-medium text-white/90 group-hover:text-white">
                {t(item.titleKey as "vipInstitutional")}
                {(item as any).badge && (
                  <span className="py-0.5 px-1.5 text-2xs bg-primary rounded-full">{(item as any).badge}</span>
                )}
              </span>
              <span className="text-xs text-white/50 leading-snug">{t(item.subtitleKey as "vipInstitutionalSubtitle")}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
