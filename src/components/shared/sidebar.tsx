"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useUserStore } from "@/src/stores/user-store";
import { handleLogout } from "@/src/lib/handle-logout";
import { UserAvatar } from "@/src/components/shared/user-avatar";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mantine/core";
import { userKeys, userService } from "@/src/services/user";
import { isKycApproved } from "@/src/lib/normalize-kyc-status";
import { useTranslations } from "next-intl";
import { stripLocalePrefix } from "@/src/lib/locale-path";

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
import { BusinessCard } from "../icons/business-card";
import { Send } from "../icons/send";
import { RiExchangeFundsLine, RiBarChartFill, RiCustomerService2Line } from "react-icons/ri";

// --- Nav structure ------------------------------------------------------------

type NavChild = { nameKey: string; link: string };
type NavItem = {
  nameKey: string;
  link?: string;
  icon: React.ElementType;
  routeIdentifier?: string;
  children?: NavChild[];
  badge?: string;
};

const mainNavLinks: NavItem[] = [
  { nameKey: "dashboard", link: "/dashboard", icon: Dashboard },
  { nameKey: "markets", link: "/markets", icon: IoStatsChart },
  {
    nameKey: "assets",
    routeIdentifier: "assets",
    icon: Assets,
    children: [
      { nameKey: "overview", link: "/assets/overview" },
      { nameKey: "spot", link: "/assets/spot" },
      { nameKey: "margin", link: "/assets/margin" },
      { nameKey: "futures", link: "/assets/futures" },
      { nameKey: "earn", link: "/assets/earn" },
      { nameKey: "funding", link: "/assets/funding" },
    ],
  },
  {
    nameKey: "orders",
    routeIdentifier: "orders",
    icon: Orders,
    children: [
      { nameKey: "spotOrder", link: "/orders/spot" },
      { nameKey: "marginOrder", link: "/orders/margin" },
      { nameKey: "fiatOrder", link: "/orders/fiat" },
      { nameKey: "transactionAnalysis", link: "/orders/transaction-analysis" },
      { nameKey: "convertHistory", link: "/orders/convert-history" },
      { nameKey: "paymentHistory", link: "/orders/payment-history" },
    ],
  },
  { nameKey: "futures", link: "/trades/futures", icon: IoFlashOutline, badge: "PRO" },
  { nameKey: "margin", link: "/trades/margin", icon: RiBarChartFill },
  { nameKey: "p2pTrading", link: "/trades/p2p", icon: RiExchangeFundsLine },
  {
    nameKey: "account",
    routeIdentifier: "account",
    icon: Account,
    children: [
      { nameKey: "profile", link: "/account/profile" },
      { nameKey: "security", link: "/account/security" },
      { nameKey: "apiKeys", link: "/account/api-keys" },
      { nameKey: "whitelistedWallets", link: "/account/whitelisted-wallets" },
      { nameKey: "identity", link: "/account/kyc" },
      { nameKey: "paymentMethods", link: "/account/payment-methods" },
    ],
  },
  { nameKey: "settings", link: "/settings", icon: IoSettingsSharp },
  { nameKey: "support", link: "/support", icon: RiCustomerService2Line },
];

const transactionLinks: NavItem[] = [
  { nameKey: "deposit", link: "/transactions/deposit", icon: BusinessCard },
  { nameKey: "withdrawal", link: "/transactions/withdrawal", icon: Send },
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
  const t = useTranslations("Navigation");
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
        <span className="flex-1 text-caption font-semibold">{t(item.nameKey)}</span>
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
                key={child.nameKey}
                href={child.link}
                onClick={onNavigate}
                className={clsx(
                  "text-xs py-1.5 px-3 rounded-lg transition-all duration-150 font-medium",
                  childActive
                    ? "text-primary bg-primary/[0.08]"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                )}
              >
                {t(child.nameKey)}
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
  const t = useTranslations("Navigation");
  if (!item.link) return null;

  const isActive =
    pathname === item.link || pathname.startsWith(item.link + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.link}
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
      <span className="flex-1 text-caption font-semibold">{t(item.nameKey)}</span>
      {item.badge && (
        <span className="text-2xs font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// --- Section label ------------------------------------------------------------

function SectionLabel({ labelKey }: { labelKey: string }) {
  const t = useTranslations("Navigation");
  return (
    <p className="px-3 pt-5 pb-1.5 text-2xs font-bold tracking-[0.18em] uppercase text-white/20 select-none">
      {t(labelKey)}
    </p>
  );
}

// --- User profile card --------------------------------------------------------

export function UserProfileCard() {
  const t = useTranslations("Common");
  const headerT = useTranslations("Header");
  const securityT = useTranslations("Security");
  const user = useUserStore((s) => s.user);
  const userLoading = useUserStore((s) => s.loading);
  const userHydrated = useUserStore((s) => s.hydrated);
  const fetchUser = useUserStore((s) => s.fetchUser);
const { data: kycStatus } = useQuery({
    queryKey: userKeys.kycStatus,
    queryFn: () => userService.getKycStatus(),
    select: (res) => res?.data?.status,
    // Verification status only moves when the user completes a KYC step, and
    // the same key is read by the dashboard — one fetch serves both.
    staleTime: 5 * 60_000,
  });

  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username || user.email || t("account")
    : "";

  const normalizedKycStatus = String(kycStatus || user?.kycStatus || "").toLowerCase();
  const isVerified = (user?.isIDverified ?? false) || isKycApproved(normalizedKycStatus);
  const statusText =
    isVerified
      ? securityT("kycVerified")
      : ["pending", "processing", "under_review"].includes(normalizedKycStatus)
        ? securityT("kycPending")
        : ["rejected", "failed"].includes(normalizedKycStatus)
          ? normalizedKycStatus === "failed" ? securityT("kycFailed") : securityT("kycRejected")
          : securityT("unverified");

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
          {user ? (
            <>
              <p className="text-xs font-semibold text-white/90 truncate leading-tight">
                {displayName}
              </p>
              <p className={clsx("text-2xs font-medium leading-tight mt-0.5", isVerified ? "text-buy" : "text-warning/80")}>
                {statusText}
              </p>
            </>
          ) : !userHydrated || userLoading ? (
            <div className="flex flex-col gap-1.5" aria-label={headerT("loadingAccount")}>
              <Skeleton height={10} width="70%" />
              <Skeleton height={8} width="45%" />
            </div>
          ) : (
            <button
              onClick={() => void fetchUser()}
              className="text-left text-micro font-medium text-white/60 hover:text-white transition-colors"
            >
              {t("profileUnavailable")} — {t("retry")}
            </button>
          )}
        </div>

        <button
          onClick={() => void handleLogout()}
          title={headerT("logout")}
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
  const t = useTranslations("Navigation");
  const rawPathname = usePathname();
  const pathname = stripLocalePrefix(rawPathname || "/");
  const isTransactions = pathname.includes("transactions");
  const links = isTransactions ? transactionLinks : mainNavLinks;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 flex flex-col scrollbar-none">
      {isTransactions ? (
        <>
          <SectionLabel labelKey="trades" />
          <div className="flex flex-col gap-0.5">
            {links.map((item) =>
              item.link ? (
                <NavLink
                  key={t(item.nameKey)}
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
          <SectionLabel labelKey="overview" />
          <div className="flex flex-col gap-0.5">
            {mainNavLinks.slice(0, 2).map((item) => (
              <NavLink
                key={t(item.nameKey)}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </div>

          <SectionLabel labelKey="trade" />
          <div className="flex flex-col gap-0.5">
            {mainNavLinks.slice(2, 7).map((item) =>
              item.children ? (
                <NavDropdown
                  key={t(item.nameKey)}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ) : (
                <NavLink
                  key={t(item.nameKey)}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              )
            )}
          </div>

          <SectionLabel labelKey="profile" />
          <div className="flex flex-col gap-0.5">
            {mainNavLinks.slice(7).map((item) =>
              item.children ? (
                <NavDropdown
                  key={t(item.nameKey)}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ) : (
                <NavLink
                  key={t(item.nameKey)}
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
