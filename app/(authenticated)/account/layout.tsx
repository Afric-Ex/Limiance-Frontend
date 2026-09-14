import React, { ReactNode } from "react";
import { AccountSidebar } from "@/src/components/settings/account-sidebar";
import { AccountMobileTabs } from "@/src/components/settings/account-mobile-tabs";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-84px)]">
      <div className="grid grid-cols-1 min-[1150px]:grid-cols-[220px_1fr] flex-1 max-w-[1200px] w-full mx-auto px-4 min-[1150px]:px-8 py-8 gap-10 relative pb-24 min-[1150px]:pb-8">
        {/* Desktop Sidebar */}
        <aside className="hidden min-[1150px]:flex sticky top-8 h-fit border-r border-white/[0.06] pr-6">
          <AccountSidebar />
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0">
          {children}
        </div>
      </div>

      {/* Mobile Tabs */}
      <AccountMobileTabs />
    </div>
  );
}
