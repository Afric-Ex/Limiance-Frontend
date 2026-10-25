"use client"

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, SidebarMenuProvider } from "@/src/components/shared/sidebar-menu";
import { FCMInitializer } from "@/src/components/shared/fcm-initializer";

export default function NoSidebarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showMenu =
    !pathname?.startsWith("/trades/margin") &&
    !pathname?.startsWith("/trades/futures") &&
    !pathname?.startsWith("/trades/spot");

  return (
    <div className="flex min-h-[calc(100vh-84px)] flex-col">
      <FCMInitializer />
      <SidebarMenuProvider>
        {showMenu && (
          <div className="w-full px-4 pt-2 min-[1150px]:px-8">
            <SidebarMenuButton />
          </div>
        )}
        {children}
      </SidebarMenuProvider>
    </div>
  );
}
