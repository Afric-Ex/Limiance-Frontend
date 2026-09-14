"use client";

import React from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Account } from "@/src/components/icons/account";
import { Secure } from "@/src/components/icons/secure";
import { UserKey } from "@/src/components/icons/user-key";
import { Settings } from "@/src/components/icons/settings";
import { BusinessCard } from "@/src/components/icons/business-card";
import { Authorization } from "@/src/components/icons/authorization";

const accountNavLinks = [
  { name: "Profile", link: "/account/profile", icon: Account },
  { name: "Verification", link: "/account/kyc", icon: Authorization },
  { name: "Security", link: "/account/security", icon: Secure },
  { name: "API Keys", link: "/account/api-keys", icon: UserKey },
  { name: "Settings", link: "/account/settings", icon: Settings },
  { name: "Payments", link: "/account/payment-methods", icon: BusinessCard },
];

export const AccountMobileTabs = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] min-[1150px]:hidden bg-[#181a20]/90 backdrop-blur-xl border-t border-white/[0.06] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pointer-events-auto">
      <div className="px-4 py-2 flex justify-start items-center overflow-x-auto no-scrollbar gap-2 w-full">
        {accountNavLinks.map((tab) => {
          const isActive = pathname === tab.link || pathname.startsWith(`${tab.link}/`);
          return (
            <a
              key={tab.name}
              href={tab.link}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "flex flex-col items-center justify-center gap-1.5 p-2 transition-all min-w-[64px] relative z-10 cursor-pointer active:scale-95 tap-scale rounded-xl touch-manipulation",
                isActive ? "text-primary bg-primary/10" : "text-white/55 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="relative">
                <tab.icon width={22} height={22} color={isActive ? "#4d77f0" : undefined} fillOpacity={isActive ? "1" : undefined} />
              </div>
              <span className={clsx("whitespace-nowrap text-[10px]", isActive ? "font-bold text-primary" : "font-medium")}>
                {tab.name}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};
