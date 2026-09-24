"use client"

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BackButton } from "@/src/components/shared/back-button";
import { FCMInitializer } from "@/src/components/shared/fcm-initializer";

export default function NoSidebarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-84px)] flex-col">
      <FCMInitializer />
      {!pathname?.startsWith("/trades/margin") && !pathname?.startsWith("/trades/futures") && !pathname?.startsWith("/trades/spot") && (
        <div className="w-full px-4 pt-2 min-[1150px]:px-8">
          <BackButton href="/dashboard" />
        </div>
      )}
      {children}
    </div>
  );
}