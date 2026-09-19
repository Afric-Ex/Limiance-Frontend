"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { SidebarContent, UserProfileCard } from "./sidebar";
import Logo from "./logo";
import { IoClose } from "react-icons/io5";

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
          "bg-[#181a20] border-r border-white/[0.06] flex flex-col overflow-hidden isolation-isolate",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ animation: open ? "slideInLeft 0.3s ease both" : undefined }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-white/[0.06]">
          <Logo imageClasses="w-[110px] max-sm:w-[110px]" />
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white tap-scale"
          >
            <IoClose size={16} />
          </button>
        </div>

        {/* Nav — same UI as the large-screen sidebar */}
        <SidebarContent onNavigate={onClose} />

        {/* User profile footer — same UI as the large-screen sidebar */}
        <UserProfileCard />
      </div>
    </>,
    document.body
  );
};