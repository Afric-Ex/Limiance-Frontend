"use client";

import { Sidebar } from "@/src/components/shared/sidebar";
import { MobileBottomNav } from "@/src/components/shared/mobile-bottom-nav";
import { FCMInitializer } from "@/src/components/shared/fcm-initializer";
import { ReactNode } from "react";

function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 min-[1150px]:grid-cols-[19%_1fr] pt-0 flex-1 overflow-auto max-[1150px]:pt-0 max-[1150px]:pb-[80px] min-h-0">
      <FCMInitializer />

      <Sidebar />
      <div className="overflow-auto px-4 py-4 max-[728px]:px-3 min-h-0">
        {children}
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default DashboardLayout;
