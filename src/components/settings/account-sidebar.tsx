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
  { name: "Payment Methods", link: "/account/payment-methods", icon: BusinessCard },
];

export const AccountSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1 w-full rounded-2xl border border-white/[0.06] bg-[#181a20] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      {/* Header */}
      <div className="px-3 pb-4 mb-1 border-b border-white/[0.06]">
        <h2 className="text-base font-bold text-white">Account</h2>
        <p className="text-[11px] text-white/40 mt-1">Manage your account settings</p>
      </div>

      {/* Nav Links */}
      {accountNavLinks.map((item) => {
        const isActive = pathname === item.link || pathname.startsWith(`${item.link}/`);
        return (
          <div key={item.name} className="relative flex items-center">
            {/* Active accent bar */}
            <span
              className={clsx(
                "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300",
                isActive
                  ? "h-6 bg-primary shadow-[0_0_8px_2px_rgba(59,130,246,0.45)]"
                  : "h-0"
              )}
            />
            <a
              href={item.link}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "group flex items-center justify-between w-full ml-[3px] rounded-xl px-3 py-2.5 transition-all duration-200 text-left",
                isActive
                  ? "bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
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
                  {item.name}
                </span>
              </div>
            </a>
          </div>
        );
      })}
    </div>
  );
};
