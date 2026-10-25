"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { CiMenuBurger } from "react-icons/ci";
import { MobileSideDrawer } from "./mobile-side-drawer";

type SidebarMenuContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const SidebarMenuContext = createContext<SidebarMenuContextValue | null>(null);

/** Hosts one drawer for a layout so any page inside it can open the sidebar. */
export function SidebarMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarMenuContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
      <MobileSideDrawer open={isOpen} onClose={() => setIsOpen(false)} showOnDesktop />
    </SidebarMenuContext.Provider>
  );
}

export function useSidebarMenu() {
  const context = useContext(SidebarMenuContext);
  if (!context) {
    throw new Error("useSidebarMenu must be used within a SidebarMenuProvider");
  }
  return context;
}

export function SidebarMenuButton({ className = "" }: { className?: string }) {
  const { isOpen, open } = useSidebarMenu();

  return (
    <button
      type="button"
      onClick={open}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 text-white transition-colors hover:bg-white/[0.05] ${className}`}
      aria-label="Open navigation menu"
      aria-expanded={isOpen}
      aria-controls="app-sidebar-drawer"
    >
      <CiMenuBurger size={22} />
    </button>
  );
}
