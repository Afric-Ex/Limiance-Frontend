import React from "react";
import { Button } from "@mantine/core";
import { MdSpaceDashboard } from "react-icons/md";
import { IoWalletOutline, IoDocumentTextOutline, IoGiftOutline, IoSettingsOutline } from "react-icons/io5";
import { LuUserRound } from "react-icons/lu";
import { RiLogoutBoxRLine } from "react-icons/ri";
import Link from "next/link";
import { handleLogout } from "@/src/lib/handle-logout";
import { useUserStore } from "@/src/stores/user-store";
import { truncateEmail } from "@/src/lib/truncate-email";
import clsx from "clsx";
import { UserAvatar } from "./user-avatar";

const list = [
  {
    name: "Dashboard",
    link: "/dashboard",
    icon: MdSpaceDashboard,
  },
  {
    name: "Assets",
    link: "/assets/overview",
    icon: IoWalletOutline,
  },
  {
    name: "Orders",
    link: "/orders/spot",
    icon: IoDocumentTextOutline,
  },
  {
    name: "Rewards Hub",
    link: "/rewards-hub",
    icon: IoGiftOutline,
  },
  {
    name: "Account",
    link: "/account/profile",
    icon: LuUserRound,
  },
  {
    name: "Settings",
    link: "/settings",
    icon: IoSettingsOutline,
  },
];

export const ProfileDropdown = ({ isMobile }: { isMobile?: boolean }) => {
  const user = useUserStore((state) => state.user);

  return (
    <div
      className={clsx(
        isMobile ? "" : "w-[280px] rounded-xl",
        "bg-[#181a20] border border-white/[0.06] flex flex-col shadow-2xl"
      )}
    >
      <div className="pt-4 pb-2 flex gap-1 flex-col">
        <div className="flex px-4 flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar size={40} />
              <span className="flex flex-col gap-1">
                <span className="font-medium text-sm">{truncateEmail(user?.email)}</span>
                <span className="text-xs text-white/40">UID: {user?.id}</span>
              </span>
            </div>
            <div className="flex gap-2">
              {user?.isVerified && (
                <span className="py-0.5 px-2 bg-[#0ECB81]/10 text-xs text-[#0ECB81] rounded-full">
                  Verified
                </span>
              )}
              <span className="py-0.5 px-2 bg-white/[0.04] text-xs text-white/70 rounded-full">
                Link X
              </span>
            </div>
          </div>
          <Button className="!h-9 !rounded-lg !bg-white/[0.02] !border !border-white/[0.06] !text-white/80">
            <span className="text-sm">Switch account</span>
          </Button>
        </div>
        {!isMobile && (
          <div className="flex flex-col mt-2">
            {list.map((item) => (
              <Link
                key={item.name}
                href={item.link}
                className="flex text-white/70 hover:text-white hover:bg-white/[0.02] px-4 py-2.5 gap-3 items-center transition-colors"
              >
                <item.icon size={18} />
                <span className="text-sm">{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      {!isMobile && (
        <div
          onClick={() => void handleLogout()}
          className="py-3 px-4 flex cursor-pointer hover:bg-white/[0.02] items-center gap-3 border-t border-white/[0.06] text-white/70 hover:text-white transition-colors"
        >
          <RiLogoutBoxRLine size={18} />
          <span className="text-sm">Log out</span>
        </div>
      )}
    </div>
  );
};
