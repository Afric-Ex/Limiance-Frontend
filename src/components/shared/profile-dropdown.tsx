import React from "react";
import { LimianceAvatar } from "../icons/limiance-avatar";
import { Button } from "@mantine/core";
import { Dashboard } from "../icons/dashboard";
import { Assets } from "../icons/assets";
import { Orders } from "../icons/orders";
import { IoIosGift } from "react-icons/io";
import { IoSettingsSharp } from "react-icons/io5";
import Link from "next/link";
import { Logout } from "../icons/logout";
import { handleLogout } from "@/src/lib/handle-logout";
import { useUserStore } from "@/src/stores/user-store";
import { truncateEmail } from "@/src/lib/truncate-email";
import clsx from "clsx";

const list = [
  {
    name: "Dashboard",
    link: "/dashboard",
    icon: Dashboard,
  },
  {
    name: "Assets",
    link: "/assets/overview",
    icon: Assets,
  },
  {
    name: "Orders",
    link: "/orders/spot",
    icon: Orders,
  },
  {
    name: "Rewards Hub",
    link: "/rewards-hub",
    icon: IoIosGift,
  },
  {
    name: "Account",
    link: "/account/profile",
    icon: IoIosGift,
  },
  {
    name: "Settings",
    link: "/settings",
    icon: IoSettingsSharp,
  },
];

export const ProfileDropdown = ({ isMobile }: { isMobile?: boolean }) => {
  const user = useUserStore((state) => state.user);

  return (
    <div
      className={clsx(
        isMobile ? "" : "max-w-[286px] rounded-lg",
        "bg-gray-17/[97%] flex flex-col"
      )}
    >
      <div className="pt-6 pb-4 flex gap-1 flex-col">
        <div className="flex px-5 flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <LimianceAvatar className="w-7 h-[45px]" />
              <span className="flex flex-col gap-6px">
                <span className="font-bold">{truncateEmail(user?.email)}</span>
                <span
                  style={{ wordBreak: "break-word" }}
                  className="text-xs font-medium text-white/65"
                >
                  UID: {user?.id}
                </span>
              </span>
            </div>
            <span className="flex gap-2">
              {user?.isVerified && (
                <span className="py-2px px-[7px] bg-success-5/[8%] text-10px text-success-5 rounded">
                  Verified
                </span>
              )}
              <span className="py-2px px-[7px] bg-gray-9/[25%] text-10px text-white rounded">
                Link X
              </span>
            </span>
          </div>
          <Button className="!h-[35px] !rounded-full !bg-transparent !border !border-gray-9">
            <span className="text-10px`">Switch account</span>
          </Button>
        </div>
        {!isMobile && (
          <div className="flex flex-col">
            {list.map((item) => (
              <Link
                key={item.name}
                href={item.link}
                className="flex text-white/65 hover:bg-gray-9/20 px-6 py-3 gap-3 items-center"
              >
                <item.icon />
                <span className="text-xs">{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      {!isMobile && (
        <div
          onClick={() => handleLogout()}
          className="py-5 px-6 flex cursor-pointer hover:bg-gray-9/20 items-center gap-3 border-t border-t-gray-9/40"
        >
          <Logout />
          <span className="text-xs text-white/65">Log Out</span>
        </div>
      )}
    </div>
  );
};
