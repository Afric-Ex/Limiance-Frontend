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
import { Wallet } from "@/src/components/icons/wallet";

const accountNavLinks = [
  { name: "Profile", link: "/account/profile", icon: Account },
  { name: "Verification", mobileName: "Verify", link: "/account/kyc", icon: Authorization },
  { name: "Security", link: "/account/security", icon: Secure },
  { name: "API Keys", link: "/account/api-keys", icon: UserKey },
  { name: "Whitelisted Wallets", mobileName: "Wallets", link: "/account/whitelisted-wallets", icon: Wallet },
  { name: "Settings", link: "/account/settings", icon: Settings },
  { name: "Payments", mobileName: "Payments", link: "/account/payment-methods", icon: BusinessCard },
];

export const AccountMobileTabs = () => {
  const pathname = usePathname();

  return (
    <nav aria-label="Account navigation" className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/[0.08] bg-surface/95 pb-safe shadow-[0_-12px_36px_rgba(0,0,0,0.4)] backdrop-blur-xl pointer-events-auto min-[1150px]:hidden">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-1 overflow-x-auto px-2 py-2 no-scrollbar">
        {accountNavLinks.map((tab) => {
          const isActive = pathname === tab.link || pathname.startsWith(`${tab.link}/`);
          return (
            <a
              key={tab.name}
              href={tab.link}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "relative z-10 flex min-w-[68px] flex-none touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-all active:scale-95",
                isActive ? "bg-primary/[0.12] text-primary" : "text-white/45 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <div className="relative">
                <tab.icon width={22} height={22} color={isActive ? "#4d77f0" : undefined} fillOpacity={isActive ? "1" : undefined} />
              </div>
              <span className={clsx("whitespace-nowrap text-2xs", isActive ? "font-bold text-primary" : "font-medium")}>
                {tab.mobileName ?? tab.name}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};
