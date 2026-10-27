import Link from "next/link";
import { MdOutlineDiamond, MdOutlinePayment, MdOutlineAccountBalance } from "react-icons/md";
import { RiNftLine } from "react-icons/ri";
import { BsWallet2 } from "react-icons/bs";
import { PiPlantBold } from "react-icons/pi";

const list = [
  {
    title: "VIP & Institutional",
    subtitle: "Tailored services for high-volume traders and institutions",
    link: "/more/vip",
    icon: MdOutlineDiamond,
    badge: "NEW",
  },
  {
    title: "Launchpool",
    subtitle: "Stake tokens to earn new project tokens for free",
    link: "/earn/launchpool",
    icon: PiPlantBold,
  },
  {
    title: "Pay",
    subtitle: "Send, receive and spend crypto with ease",
    link: "/pay",
    icon: MdOutlinePayment,
  },
  {
    title: "Loans",
    subtitle: "Get instant crypto loans backed by your assets",
    link: "/loans",
    icon: MdOutlineAccountBalance,
  },
  {
    title: "NFT",
    subtitle: "Discover and trade NFTs from global creators",
    link: "/nft",
    icon: RiNftLine,
  },
  {
    title: "Web3 Wallet",
    subtitle: "Secure, multi-chain wallet for the Web3 ecosystem",
    link: "/web3-wallet",
    icon: BsWallet2,
  },
];

export const MoreDropdown = () => {
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
              <span className="text-sm flex items-center gap-2 font-medium text-white/90 group-hover:text-white">
                {item.title}
                {(item as any).badge && (
                  <span className="py-0.5 px-1.5 text-[10px] bg-primary rounded-full">{(item as any).badge}</span>
                )}
              </span>
              <span className="text-xs text-white/50 leading-snug">{item.subtitle}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
