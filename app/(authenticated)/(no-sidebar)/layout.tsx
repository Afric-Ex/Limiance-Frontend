"use client"

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { CiMenuBurger } from "react-icons/ci";
import { MobileSideDrawer } from "@/src/components/shared/mobile-side-drawer";
import { FCMInitializer } from "@/src/components/shared/fcm-initializer";

export default function NoSidebarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const showMenu =
    !pathname?.startsWith("/trades/margin") &&
    !pathname?.startsWith("/trades/futures") &&
    !pathname?.startsWith("/trades/spot");

  return (
    <div className="flex min-h-[calc(100vh-84px)] flex-col">
      <FCMInitializer />
      {showMenu && (
        <div className="w-full px-4 pt-2 min-[1150px]:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-white transition-colors hover:bg-white/[0.05]"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="app-sidebar-drawer"
          >
            <CiMenuBurger size={22} />
          </button>
        </div>
      )}
      <MobileSideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} showOnDesktop />
      {children}
    </div>
  );
}
