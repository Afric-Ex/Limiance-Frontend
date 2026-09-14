"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useUserStore } from "@/src/stores/user-store";
import { handleLogout } from "@/src/lib/handle-logout";
import { UserAvatar } from "@/src/components/shared/user-avatar";
import { useQuery } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { isKycApproved } from "@/src/lib/normalize-kyc-status";

// Icons
import { Dashboard } from "../icons/dashboard";
import { Assets } from "../icons/assets";
import { Orders } from "../icons/orders";
import { Account } from "../icons/account";
import { Logout } from "../icons/logout";
import {
  IoStatsChart,
  IoSettingsSharp,
  IoChevronDown,
  IoFlashOutline,
} from "react-icons/io5";
import { MdAutoGraph } from "react-icons/md";
import { IoIosGift } from "react-icons/io";
import { BusinessCard } from "../icons/business-card";
import { Send } from "../icons/send";
import { RiExchangeFundsLine, RiBarChartFill, RiCustomerService2Line } from "react-icons/ri";

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavChild = { name: string; link: string };
type NavItem = {
  name: string;
  link?: string;
  icon: React.ElementType;
  routeIdentifier?: string;
  children?: NavChild[];
  badge?: string;
};

const mainNavLinks: NavItem[] = [
  { name: "Dashboard", link: "/dashboard", icon: Dashboard },
  { name: "Markets", link: "/markets", icon: IoStatsChart },
  {
    name: "Assets",
    routeIdentifier: "assets",
    icon: Assets,
    children: [
      { name: "Overview", link: "/assets/overview" },
      { name: "Spot", link: "/assets/spot" },
      { name: "Margin", link: "/assets/margin" },
      { name: "Futures", link: "/assets/futures" },
      { name: "Trading Bots", link: "/assets/trading-bots" },
      { name: "Earn", link: "/assets/earn" },
      { name: "Funding", link: "/assets/funding" },
    ],
  },
  {
    name: "Orders",
    routeIdentifier: "orders",
    icon: Orders,
    children: [
      { name: "Spot Order", link: "/orders/spot" },
      { name: "Margin Order", link: "/orders/margin" },
      { name: "Fiat Order", link: "/orders/fiat" },
      { name: "Transaction Analysis", link: "/orders/transaction-analysis" },
      { name: "Convert History", link: "/orders/convert-history" },
      { name: "Payment History", link: "/orders/payment-history" },
    ],
  },
  {
    name: "Futures",
    link: "/trades/futures",
    icon: IoFlashOutline,
    badge: "PRO",
  },
  {
    name: "Margin",
    link: "/trades/margin",
    icon: RiBarChartFill,
  },
  {
    name: "P2P Trading",
    link: "/trades/p2p",
    icon: RiExchangeFundsLine,
  },
  { name: "Earn", link: "/earn", icon: MdAutoGraph },
  { name: "Rewards Hub", link: "/rewards-hub", icon: IoIosGift },
  {
    name: "Account",
    routeIdentifier: "account",
    icon: Account,
    children: [
      { name: "Profile", link: "/account/profile" },
      { name: "Security", link: "/account/security" },
      { name: "API Keys", link: "/account/api-keys" },
      { name: "Identity (KYC)", link: "/account/kyc" },
      { name: "Payment Methods", link: "/account/payment-methods" },
    ],
  },
  { name: "Settings", link: "/settings", icon: IoSettingsSharp },
  { name: "Support", link: "/support", icon: RiCustomerService2Line },
];

const transactionLinks: NavItem[] = [
  { name: "Deposit", link: "/transactions/deposit", icon: BusinessCard },
  { name: "Withdrawal", link: "/transactions/withdrawal", icon: Send },
];

// ─── Expandable dropdown ──────────────────────────────────────────────────────

function NavDropdown({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive = pathname.includes(item.routeIdentifier ?? "");
  const [open, setOpen] = useState(isActive);
  const Icon = item.icon;

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "group flex items-center gap-3 w-[calc(100%-12px)] ml-[3px] rounded-xl px-4 py-3 transition-all duration-200",
          isActive
            ? "bg-primary/10 text-white"
            : "text-white/50 hover:text-white hover:bg-white/[0.04]"
        )}
      >
        {/* Left accent bar */}
        <span
          className={clsx(
            "absolute left-0 w-[3px] h-8 rounded-r-full transition-all duration-300",
            isActive ? "bg-primary opacity-100" : "opacity-0"
          )}
        />
        <span
          className={clsx(
            "flex-shrink-0 transition-transform duration-200",
            "group-hover:scale-110"
          )}
        >
          <Icon
            size={18}
            color={isActive ? "var(--color-primary, #3B82F6)" : undefined}
            fillOpacity={isActive ? "1" : "0.5"}
          />
        </span>
        <span className="flex-1 text-left text-sm font-semibold tracking-wide">
          {item.name}
        </span>
        <IoChevronDown
          size={14}
          className={clsx(
            "transition-transform duration-300 flex-shrink-0",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      {/* Animated panel */}
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mt-1 ml-4 pl-4 border-l border-white/[0.07] flex flex-col gap-0.5 pb-1">
          {item.children?.map((child) => {
            const childActive = pathname === child.link || pathname.startsWith(child.link + "/");
            return (
              <Link
                key={child.name}
                href={child.link}
                className={clsx(
                  "text-sm py-2 px-3 rounded-lg transition-all duration-150",
                  childActive
                    ? "text-primary font-semibold bg-primary/[0.08]"
                    : "text-white/45 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                {child.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Single link ──────────────────────────────────────────────────────────────

function NavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive =
    pathname === item.link || pathname.startsWith((item.link ?? "") + "/");
  const Icon = item.icon;

  return (
    <div className="relative w-full flex items-center">
      {/* Left glow bar */}
      <span
        className={clsx(
          "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300",
          isActive ? "h-7 bg-primary shadow-[0_0_8px_2px_rgba(59,130,246,0.5)]" : "h-0"
        )}
      />
      <Link
        href={item.link!}
        className={clsx(
          "group flex items-center gap-3 w-[calc(100%-12px)] ml-[3px] rounded-xl px-4 py-3 transition-all duration-200",
          isActive
            ? "bg-primary/10 text-white"
            : "text-white/50 hover:text-white hover:bg-white/[0.04]"
        )}
      >
        <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
          <Icon
            size={18}
            color={isActive ? "var(--color-primary, #3B82F6)" : undefined}
          />
        </span>
        <span className="flex-1 text-sm font-semibold tracking-wide">
          {item.name}
        </span>
        {item.badge && (
          <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
            {item.badge}
          </span>
        )}
      </Link>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-4 pt-4 pb-1 text-[10px] font-bold tracking-[0.15em] uppercase text-white/20 select-none">
      {label}
    </p>
  );
}

// ─── User profile card ────────────────────────────────────────────────────────

function UserProfileCard() {
  const user = useUserStore((s) => s.user);
  const { data: kycStatus } = useQuery({
    queryKey: userKeys.kycStatus,
    queryFn: () => userService.getKycStatus(),
    select: (res) => res?.data?.status,
  });

  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "Loading...";

  const normalizedKycStatus = String(kycStatus || user?.kycStatus || "").toLowerCase();
  const isVerified = (user?.isIDverified ?? false) || isKycApproved(normalizedKycStatus);
  const statusText =
    isVerified
      ? "KYC Verified"
      : ["pending", "processing", "under_review"].includes(normalizedKycStatus)
        ? "KYC Pending"
        : ["rejected", "failed"].includes(normalizedKycStatus)
          ? normalizedKycStatus === "failed" ? "KYC Failed" : "KYC Rejected"
          : "Unverified";

  return (
    <div className="mt-auto border-t border-white/[0.06] pt-3 pb-2 px-3">
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04] transition-colors duration-200 group">
        {/* Avatar */}
        <div className="flex-shrink-0 relative">
          <UserAvatar size={32} />
          {/* KYC verified dot */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#181a20] ${isVerified ? "bg-emerald-400" : "bg-yellow-400"}`}
            title={statusText}
          />
        </div>

        {/* Name + verification */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">{displayName}</p>
          <p className={`text-[10px] font-medium ${isVerified ? "text-emerald-400" : "text-yellow-400"}`}>
            {statusText}
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={() => handleLogout()}
          title="Sign out"
          className="flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity duration-200 hover:text-red-400"
        >
          <Logout />
        </button>
      </div>
    </div>
  );
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export const Sidebar = () => {
  const pathname = usePathname();
  const isTransactions = pathname.includes("transactions");
  const links = isTransactions ? transactionLinks : mainNavLinks;

  return (
    <nav
      className={clsx(
        "max-[1150px]:hidden flex flex-col h-full overflow-hidden",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.01)_100%)]",
        "border-r border-white/[0.05] backdrop-blur-xl",
        "relative"
      )}
    >
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 flex flex-col gap-0.5 scrollbar-none">
        {isTransactions ? (
          <>
            <SectionLabel label="Transactions" />
            {links.map((item) =>
              item.link ? (
                <NavLink key={item.name} item={item} pathname={pathname} />
              ) : null
            )}
          </>
        ) : (
          <>
            <SectionLabel label="Overview" />
            {/* Dashboard + Markets */}
            {mainNavLinks.slice(0, 2).map((item) => (
              <NavLink key={item.name} item={item} pathname={pathname} />
            ))}

            <SectionLabel label="Trading" />
            {/* Assets, Orders, Futures, Margin, P2P */}
            {mainNavLinks.slice(2, 7).map((item) =>
              item.children ? (
                <NavDropdown key={item.name} item={item} pathname={pathname} />
              ) : (
                <NavLink key={item.name} item={item} pathname={pathname} />
              )
            )}

            <SectionLabel label="Finance" />
            {/* Earn + Rewards Hub */}
            {mainNavLinks.slice(7, 9).map((item) => (
              <NavLink key={item.name} item={item} pathname={pathname} />
            ))}

            <SectionLabel label="Profile" />
            {/* Account + Settings */}
            {mainNavLinks.slice(9).map((item) =>
              item.children ? (
                <NavDropdown key={item.name} item={item} pathname={pathname} />
              ) : (
                <NavLink key={item.name} item={item} pathname={pathname} />
              )
            )}
          </>
        )}
      </div>

      {/* User profile footer */}
      <UserProfileCard />
    </nav>
  );
};

