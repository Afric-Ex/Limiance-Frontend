"use client";

import { Sidebar } from "@/src/components/shared/sidebar";
import { MobileBottomNav } from "@/src/components/shared/mobile-bottom-nav";
import { UserInitializer } from "@/src/components/shared/user-initializer";
import { FCMInitializer } from "@/src/components/shared/fcm-initializer";
import { ReactNode } from "react";

function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 min-[1150px]:grid-cols-[19%_1fr] pt-8 gap-8 flex-1 overflow-auto max-[1150px]:pt-0 max-[1150px]:pb-[80px] min-h-0">
      <UserInitializer />
      <FCMInitializer />

      <Sidebar />
      <div className="overflow-auto max-[1150px]:px-4 min-[1150px]:pr-10 min-h-0">
        {children}
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default DashboardLayout;
