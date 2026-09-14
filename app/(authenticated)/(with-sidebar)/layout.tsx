"use client";

import { Sidebar } from "@/src/components/shared/sidebar";
import { MobileBottomNav } from "@/src/components/shared/mobile-bottom-nav";
import { MobileSideDrawer } from "@/src/components/shared/mobile-side-drawer";
import { UserInitializer } from "@/src/components/shared/user-initializer";
import { FCMInitializer } from "@/src/components/shared/fcm-initializer";
import { ReactNode, useState } from "react";
import { IoMenuOutline } from "react-icons/io5";
import Logo from "@/src/components/shared/logo";

function DashboardLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 min-[1150px]:grid-cols-[19%_1fr] pt-8 gap-8 flex-1 overflow-auto max-[1150px]:pt-0 max-[1150px]:pb-[80px] min-h-0">
      <UserInitializer />
      <FCMInitializer />

      {/* Mobile sticky top bar — only visible on mobile */}
      <div className="min-[1150px]:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-12 bg-[#0a0b0f]/90 backdrop-blur-xl border-b border-white/[0.05] col-span-full">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06] transition-all"
          aria-label="Open menu"
        >
          <IoMenuOutline size={22} />
        </button>
        <Logo imageClasses="w-[120px] h-auto" />
        <div className="w-9" />
      </div>

      {/* Side drawer */}
      <MobileSideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <Sidebar />
      <div className="overflow-auto max-[1150px]:px-4 min-[1150px]:pr-10 min-h-0">
        {children}
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default DashboardLayout;
