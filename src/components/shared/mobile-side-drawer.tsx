"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useUserStore } from "@/src/stores/user-store";
import { handleLogout } from "@/src/lib/handle-logout";
import { UserAvatar } from "@/src/components/shared/user-avatar";
import {
  IoClose,
  IoTimeOutline,
  IoSettingsOutline,
  IoHelpCircleOutline,
  IoLogOutOutline,
  IoSwapHorizontalOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
} from "react-icons/io5";
import { MdAutoGraph as MdAutoGraphIcon } from "react-icons/md";

interface DrawerLink {
  icon: React.ElementType;
  label: string;
  href: string;
  sub?: string;
  danger?: boolean;
}

const drawerSections: { title: string; links: DrawerLink[] }[] = [
  {
    title: "Finance",
    links: [
      {
        icon: IoArrowDownOutline,
        label: "Deposit",
        href: "/transactions/deposit",
        sub: "Add funds to your account",
      },
      {
        icon: IoArrowUpOutline,
        label: "Withdrawal",
        href: "/transactions/withdrawal",
        sub: "Send funds to external wallet",
      },
      {
        icon: MdAutoGraphIcon,
        label: "Earn",
        href: "/earn",
        sub: "Grow your holdings",
      },
    ],
  },
  {
    title: "History",
    links: [
      { icon: IoTimeOutline, label: "Spot Orders", href: "/orders/spot" },
      { icon: IoTimeOutline, label: "Convert History", href: "/orders/convert-history" },
      { icon: IoTimeOutline, label: "Payment History", href: "/orders/payment-history" },
      { icon: IoTimeOutline, label: "Transaction Analysis", href: "/orders/transaction-analysis" },
    ],
  },
  {
    title: "Support",
    links: [
      {
        icon: IoSettingsOutline,
        label: "Settings",
        href: "/settings",
      },
      {
        icon: IoHelpCircleOutline,
        label: "Help & Support",
        href: "/settings",
        sub: "FAQ, contact, guides",
      },
    ],
  },
];

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

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] min-[1150px]:hidden animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={clsx(
          "fixed top-0 left-0 bottom-0 w-[300px] z-[60] min-[1150px]:hidden",
          "bg-elevated border-r border-white/[0.06] flex flex-col overflow-y-auto",
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

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {drawerSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="px-3 mb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-white/25">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      <Icon size={18} className="shrink-0" />
                      <div>
                        <p className="text-[13px] font-semibold">{link.label}</p>
                        {link.sub && (
                          <p className="text-[11px] text-white/35">{link.sub}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="px-4 pb-safe pb-6 border-t border-white/[0.06] pt-3">
          <button
            onClick={() => handleLogout()}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all tap-scale"
          >
            <IoLogOutOutline size={18} />
            <span className="text-[13px] font-semibold">Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
};
