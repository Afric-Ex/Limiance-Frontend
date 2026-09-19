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

// --- Nav structure ------------------------------------------------------------

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
  { name: "Futures", link: "/trades/futures", icon: IoFlashOutline, badge: "PRO" },
  { name: "Margin", link: "/trades/margin", icon: RiBarChartFill },
  { name: "P2P Trading", link: "/trades/p2p", icon: RiExchangeFundsLine },
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

// --- Expandable dropdown ------------------------------------------------------

function NavDropdown({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = pathname.includes(item.routeIdentifier ?? "");
  const [open, setOpen] = useState(isActive);
  const Icon = item.icon;

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 text-left",
          isActive
            ? "bg-primary/10 text-white"
            : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
        )}
      >
        <span
          className={clsx(
            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
            isActive
              ? "bg-primary/20 text-primary"
              : "bg-white/[0.04] text-white/40 group-hover:bg-white/[0.07] group-hover:text-white/60"
          )}
        >
          <Icon
            size={16}
            color={isActive ? "var(--color-primary, #4D77F0)" : "currentColor"}
            fillOpacity={isActive ? "1" : "0.6"}
          />
        </span>
        <span className="flex-1 text-[13px] font-semibold">{item.name}</span>
        <IoChevronDown
          size={13}
          className={clsx(
            "flex-shrink-0 text-white/30 transition-transform duration-300",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      <div
        className={clsx(
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mt-1 ml-4 pl-3 border-l border-white/[0.06] flex flex-col gap-0.5 pb-1">
          {item.children?.map((child) => {
            const childActive =
              pathname === child.link || pathname.startsWith(child.link + "/");
            return (
<Link
                key={child.name}
                href={child.link}
                onClick={onNavigate}
                className={clsx(
                  "text-[12.5px] py-1.5 px-3 rounded-lg transition-all duration-150 font-medium",
                  childActive
                    ? "text-primary bg-primary/[0.08]"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
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

// --- Single link --------------------------------------------------------------

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive =
    pathname === item.link || pathname.startsWith((item.link ?? "") + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.link!}
      onClick={onNavigate}
      className={clsx(
        "group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200",
        isActive
          ? "bg-primary/10 text-white"
          : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
      )}
    >
      <span
        className={clsx(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
          isActive
            ? "bg-primary/20 text-primary"
            : "bg-white/[0.04] text-white/40 group-hover:bg-white/[0.07] group-hover:text-white/60"
        )}
      >
        <Icon
          size={16}
          color={isActive ? "var(--color-primary, #4D77F0)" : "currentColor"}
          fillOpacity={isActive ? "1" : "0.6"}
        />
      </span>
      <span className="flex-1 text-[13px] font-semibold">{item.name}</span>
      {item.badge && (
        <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// --- Section label ------------------------------------------------------------

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-5 pb-1.5 text-[9.5px] font-bold tracking-[0.18em] uppercase text-white/20 select-none">
      {label}
    </p>
  );
}

// --- User profile card --------------------------------------------------------

export function UserProfileCard() {
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
    <div className="p-3 border-t border-white/[0.06]">
      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all duration-200 group">
        <div className="relative flex-shrink-0">
          <UserAvatar size={32} />
          <span
            className={clsx(
              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#181a20]",
              isVerified ? "bg-buy" : "bg-warning"
            )}
            title={statusText}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-semibold text-white/90 truncate leading-tight">
            {displayName}
          </p>
          <p className={clsx("text-[10px] font-medium leading-tight mt-0.5", isVerified ? "text-buy" : "text-warning/80")}>
            {statusText}
          </p>
        </div>

        <button
          onClick={() => handleLogout()}
          title="Sign out"
          className="flex-shrink-0 p-1.5 rounded-lg text-white/30 hover:text-sell hover:bg-sell/10 transition-all duration-200"
        >
          <Logout />
        </button>
      </div>
    </div>
  );
}

// --- Main sidebar content (shared between desktop nav & mobile drawer) ----------

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isTransactions = pathname.includes("transactions");
  const links = isTransactions ? transactionLinks : mainNavLinks;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 flex flex-col scrollbar-none">
      {isTransactions ? (
        <>
          <SectionLabel label="Transactions" />
          <div className="flex flex-col gap-0.5">
            {links.map((item) =>
              item.link ? (
                <NavLink
                  key={item.name}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ) : null
            )}
          </div>
        </>
      ) : (
        <>
          <SectionLabel label="Overview" />
          <div className="flex flex-col gap-0.5">
            {mainNavLinks.slice(0, 2).map((item) => (
              <NavLink
                key={item.name}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </div>

          <SectionLabel label="Trading" />
          <div className="flex flex-col gap-0.5">
            {mainNavLinks.slice(2, 7).map((item) =>
              item.children ? (
                <NavDropdown
                  key={item.name}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ) : (
                <NavLink
                  key={item.name}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              )
            )}
          </div>

          <SectionLabel label="Finance" />
          <div className="flex flex-col gap-0.5">
            {mainNavLinks.slice(7, 9).map((item) => (
              <NavLink
                key={item.name}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </div>

          <SectionLabel label="Profile" />
          <div className="flex flex-col gap-0.5">
            {mainNavLinks.slice(9).map((item) =>
              item.children ? (
                <NavDropdown
                  key={item.name}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ) : (
                <NavLink
                  key={item.name}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- Main sidebar -------------------------------------------------------------

export const Sidebar = () => {
  return (
    <nav className="max-[1150px]:hidden flex flex-col h-full overflow-hidden bg-[#181a20] border-r border-white/[0.06]">
      <SidebarContent />
      <UserProfileCard />
    </nav>
  );
};
