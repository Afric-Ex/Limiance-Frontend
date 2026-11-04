import React, { ReactNode } from "react";
import { AccountSidebar } from "@/src/components/settings/account-sidebar";
import { AccountMobileTabs } from "@/src/components/settings/account-mobile-tabs";
import { BackButton } from "@/src/components/shared/back-button";
import { FCMInitializer } from "@/src/components/shared/fcm-initializer";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-84px)] flex-col">
      <FCMInitializer />
      <div className="w-full px-4 pt-3 min-[1150px]:px-8">
        <BackButton href="/dashboard" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1480px] flex-1 grid-cols-1 gap-5 px-4 pb-24 pt-3 min-[1150px]:grid-cols-[248px_minmax(0,1fr)] min-[1150px]:gap-8 min-[1150px]:px-8 min-[1150px]:pb-10 min-[1150px]:pt-5">
        {/* Desktop Sidebar */}
        <aside className="sticky top-5 hidden h-fit max-h-[calc(100vh-7rem)] self-start overflow-y-auto min-[1150px]:flex">
          <AccountSidebar />
        </aside>

        {/* Content */}
        <div className="min-h-0 min-w-0">
          {children}
        </div>
      </div>

      {/* Mobile Tabs */}
      <AccountMobileTabs />
    </div>
  );
}
