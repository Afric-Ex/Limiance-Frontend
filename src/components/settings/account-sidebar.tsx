"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/src/hooks/use-pathname";
import clsx from "clsx";
import { Account } from "@/src/components/icons/account";
import { Secure } from "@/src/components/icons/secure";
import { UserKey } from "@/src/components/icons/user-key";
import { Settings } from "@/src/components/icons/settings";
import { BusinessCard } from "@/src/components/icons/business-card";
import { Authorization } from "@/src/components/icons/authorization";
import { Wallet } from "@/src/components/icons/wallet";

const accountNavLinks = [
  { nameKey: "profile", link: "/account/profile", icon: Account },
  { nameKey: "identity", link: "/account/kyc", icon: Authorization },
  { nameKey: "security", link: "/account/security", icon: Secure },
  { nameKey: "apiKeys", link: "/account/api-keys", icon: UserKey },
  { nameKey: "whitelistedWallets", link: "/account/whitelisted-wallets", icon: Wallet },
  { nameKey: "settings", link: "/account/settings", icon: Settings },
  { nameKey: "paymentMethods", link: "/account/payment-methods", icon: BusinessCard },
];

export const AccountSidebar = () => {
  const pathname = usePathname();
  const tn = useTranslations("Navigation");

  return (
    <div className="flex w-full flex-col gap-1.5 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-elevated to-surface p-3 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
      {/* Header */}
      <div className="mb-1 border-b border-white/[0.07] px-3 pb-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{tn("personalHub")}</p>
        <h2 className="text-base font-bold text-white">{tn("accountCenter")}</h2>
        <p className="mt-1 text-xs text-white/40">{tn("profileSecurityPreferences")}</p>
      </div>

      {/* Nav Links */}
      {accountNavLinks.map((item) => {
        const isActive = pathname === item.link || pathname.startsWith(`${item.link}/`);
        return (
          <div key={item.nameKey} className="relative flex items-center">
            {/* Active accent bar */}
            <span
              className={clsx(
                "absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-300",
                isActive
                  ? "h-6 bg-primary shadow-[0_0_8px_2px_rgba(59,130,246,0.45)]"
                  : "h-0"
              )}
            />
            <a
              href={item.link}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "group ml-[3px] flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-all duration-200",
                isActive
                  ? "bg-primary/[0.12] text-white shadow-[inset_0_0_0_1px_rgba(77,119,240,0.15)]"
                  : "bg-transparent hover:bg-white/[0.04] text-white/45 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                  <item.icon
                    width={17}
                    height={17}
                    color={isActive ? "var(--color-primary, #4D77F0)" : undefined}
                    fillOpacity={isActive ? "1" : "0.5"}
                  />
                </span>
                <span className={clsx("text-sm", isActive ? "font-semibold" : "font-medium")}>
                  {tn(item.nameKey)}
                </span>
              </div>
            </a>
          </div>
        );
      })}
    </div>
  );
};
