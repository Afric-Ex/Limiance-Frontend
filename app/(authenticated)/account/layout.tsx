import React, { ReactNode } from "react";
import { AccountSidebar } from "@/src/components/settings/account-sidebar";
import { AccountMobileTabs } from "@/src/components/settings/account-mobile-tabs";
import { BackButton } from "@/src/components/shared/back-button";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-84px)]">
      <div className="w-full px-4 min-[1150px]:px-8 pt-2">
        <BackButton href="/dashboard" />
      </div>

      <div className="grid grid-cols-1 min-[1150px]:grid-cols-[220px_1fr] flex-1 max-w-[1200px] w-full mx-auto px-4 min-[1150px]:px-8 pb-24 min-[1150px]:pb-8 gap-10 relative">
        {/* Desktop Sidebar */}
        <aside className="hidden min-[1150px]:flex sticky top-4 self-start h-fit max-h-[calc(100vh-6rem)] overflow-y-auto pr-6">
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
