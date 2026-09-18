"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/src/stores/user-store";
import { handleLogout } from "@/src/lib/handle-logout";
import { userKeys, userService } from "@/src/services/user";
import { isKycApproved } from "@/src/lib/normalize-kyc-status";
import { UserAvatar } from "@/src/components/shared/user-avatar";

// Icons
import { Dashboard } from "../icons/dashboard";
import { Assets } from "../icons/assets";
import { Orders } from "../icons/orders";
import { Account } from "../icons/account";
import { BusinessCard } from "../icons/business-card";
import { Send } from "../icons/send";
import { Logout } from "../icons/logout";
import {
  IoClose,
  IoStatsChart,
  IoFlashOutline,
  IoChevronDown,
  IoSettingsSharp,
} from "react-icons/io5";
import { MdAutoGraph } from "react-icons/md";
import { IoIosGift } from "react-icons/io";
import {
  RiExchangeFundsLine,
  RiBarChartFill,
  RiCustomerService2Line,
} from "react-icons/ri";

// ─── Nav structure ───────────────────────────────────────────────────────────

type NavChild = { name: string; link: string };
type NavItem = {
  name: string;
  link?: string;
  icon: React.ElementType;
  routeIdentifier?: string;
  children?: NavChild[];
  badge?: string;
};

const mainNavSections: { label: string; items: NavItem[]; pinned?: boolean }[] = [
  {
    label: "Overview",
    pinned: true,
    items: [
      { name: "Dashboard", link: "/dashboard", icon: Dashboard },
      { name: "Markets", link: "/markets", icon: IoStatsChart },
    ],
  },
  {
    label: "Trading",
    items: [
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
      { name: "Margin", link: "/trades/margin", icon: RiBarChartFill },
      { name: "P2P Trading", link: "/trades/p2p", icon: RiExchangeFundsLine },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "Earn", link: "/earn", icon: MdAutoGraph },
      { name: "Rewards Hub", link: "/rewards-hub", icon: IoIosGift },
    ],
  },
  {
    label: "Profile",
    items: [
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
    ],
  },
];

const transactionLinks: NavItem[] = [
  { name: "Deposit", link: "/transactions/deposit", icon: BusinessCard },
  { name: "Withdrawal", link: "/transactions/withdrawal", icon: Send },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.link && (pathname === item.link || pathname.startsWith(item.link + "/"))) {
    return true;
  }
  return Boolean(
    item.children?.some(
      (child) => pathname === child.link || pathname.startsWith(child.link + "/")
    )
  );
}

function isSectionActive(section: { label: string; items: NavItem[] }, pathname: string): boolean {
  return section.items.some((item) => isItemActive(item, pathname));
}

// Leaf row inside a category drawer — padded-left, sits on the category's border line
function NavRow({
  link,
  label,
  icon: Icon,
  badge,
  pathname,
  onNavigate,
}: {
  link: string;
  label: string;
  icon?: React.ElementType;
  badge?: string;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = pathname === link || pathname.startsWith(link + "/");

  return (
    <Link
      href={link}
      onClick={onNavigate}
      className={clsx(
        "flex items-center gap-3 py-2.5 pl-4 pr-3 text-sm font-medium transition-all duration-150",
        isActive
          ? "text-primary bg-primary/[0.08] font-semibold"
          : "text-white/55 hover:text-white hover:bg-white/[0.03]"
      )}
    >
      {Icon ? (
        <Icon
          size={16}
          className={clsx(
            "shrink-0",
            isActive ? "text-primary" : "text-white/35"
          )}
        />
      ) : null}
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 shrink-0">
          {badge}
        </span>
      )}
    </Link>
  );
}

// Grouped sub-list for items that have children (e.g. Assets, Orders, Account)
function NavGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  return (
    <div className="mt-1">
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-1.5">
        <Icon size={14} className="shrink-0 text-white/30" />
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/40">
          {item.name}
        </span>
      </div>
      <div className="ml-4 border-l border-white/[0.07] flex flex-col">
        {item.children?.map((child) => (
          <NavRow
            key={child.name}
            link={child.link}
            label={child.name}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

// ─── User profile card ───────────────────────────────────────────────────────

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
        <div className="flex-shrink-0 relative">
          <UserAvatar size={32} />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-elevated ${isVerified ? "bg-buy" : "bg-warning"}`}
            title={statusText}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">{displayName}</p>
          <p className={`text-[10px] font-medium ${isVerified ? "text-buy" : "text-warning"}`}>
            {statusText}
          </p>
        </div>

        <button
          onClick={() => handleLogout()}
          title="Sign out"
          className="flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity duration-200 hover:text-sell"
        >
          <Logout />
        </button>
      </div>
    </div>
  );
}

// ─── Drawer ──────────────────────────────────────────────────────────────────

export interface MobileSideDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const MobileSideDrawer: React.FC<MobileSideDrawerProps> = ({
  open,
  onClose,
}) => {
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);

  const isTransactions = pathname.includes("transactions");
  const sections: { label: string; items: NavItem[]; pinned?: boolean }[] = isTransactions
    ? [{ label: "Transactions", items: transactionLinks }]
    : mainNavSections;

  // Open the category belonging to the current route by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((section) => {
      initial[section.label] = isSectionActive(section, pathname);
    });
    return initial;
  });

  // Track route changes — always keep the category of the current page open
  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev };
      sections.forEach((section) => {
        if (isSectionActive(section, pathname)) {
          next[section.label] = true;
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "Loading…";

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] min-[1150px]:hidden animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 w-[300px] z-[9999] min-[1150px]:hidden",
          "bg-[#13151c] border-r border-white/[0.06] flex flex-col overflow-hidden isolation-isolate",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ animation: open ? "slideInLeft 0.3s ease both" : undefined }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <UserAvatar size={40} />
            <div>
              <p className="text-sm font-semibold text-white/90">{displayName}</p>
              <p className="text-xs text-white/40">{user?.email ?? ""}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white tap-scale"
          >
            <IoClose size={18} />
          </button>
        </div>

        {/* Nav — collapsible category drawers */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 scrollbar-none">
          {sections.map((section) => {
            const isOpen = Boolean(openSections[section.label]);
            const sectionActive = isSectionActive(section, pathname);

            const sectionItems = (
              <div className="ml-4 border-l-2 border-white/[0.09] flex flex-col pb-2">
                {section.items.map((item) =>
                  item.children ? (
                    <NavGroup
                      key={item.name}
                      item={item}
                      pathname={pathname}
                      onNavigate={onClose}
                    />
                  ) : (
                    <NavRow
                      key={item.name}
                      link={item.link!}
                      label={item.name}
                      icon={item.icon}
                      badge={item.badge}
                      pathname={pathname}
                      onNavigate={onClose}
                    />
                  )
                )}
              </div>
            );

            // Pinned sections (e.g. Overview) are always visible — no drawer
            if (section.pinned) {
              return (
                <div key={section.label} className="mb-1">
                  <p className="px-4 py-2.5 text-base font-bold tracking-wide select-none">
                    {section.label}
                  </p>
                  {sectionItems}
                </div>
              );
            }

            return (
              <div key={section.label} className="mb-1">
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  aria-expanded={isOpen}
                  className={clsx(
                    "flex w-full items-center justify-between px-4 py-2.5 rounded-lg text-base font-bold tracking-wide transition-all duration-200",
                    sectionActive
                      ? "text-white"
                      : "text-white/65 hover:text-white hover:bg-white/[0.03]",
                    isOpen && "text-white"
                  )}
                >
                  <span>{section.label}</span>
                  <IoChevronDown
                    size={16}
                    className={clsx(
                      "transition-transform duration-300 shrink-0",
                      isOpen ? "rotate-180" : "rotate-0",
                      sectionActive ? "text-primary" : "text-white/30"
                    )}
                  />
                </button>

                {/* Category drawer */}
                <div
                  className={clsx(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">{sectionItems}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* User profile footer */}
        <UserProfileCard />
      </div>
    </>,
    document.body
  );
};