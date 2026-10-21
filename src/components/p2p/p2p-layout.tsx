"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { GlobalP2PNotification } from "./global-p2p-notification";
import { useAllMatchedOrders, useAdvertiserInfo } from "@/src/hooks/p2p/use-p2p";
import { useP2PGlobalEvents } from "@/src/hooks/p2p/use-p2p-realtime";

const p2pNavLinks = [
  { name: "P2P Trading", link: "/trades/p2p" },
  { name: "Orders", link: "/trades/p2p/orders" },
  { name: "My Ads", link: "/trades/p2p/my-ads" },
  // Profile will be dynamically injected if the user is an advertiser
];

export const P2PLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  useP2PGlobalEvents();
  const { data } = useAllMatchedOrders();
  const allOrders = (data as any)?.data?.data ?? [];
  const processingCount = allOrders.filter((o: any) =>
    !["COMPLETED", "CANCELLED", "RELEASED"].includes(o.status?.toUpperCase())
  ).length;

  const { data: advertiserData } = useAdvertiserInfo();
  const isAdvertiser = !!advertiserData?.data?.data?.id;

  const navLinks = [...p2pNavLinks];
  if (isAdvertiser) {
    navLinks.push({ name: "Profile", link: "/trades/p2p/profile" });
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* P2P Header Nav */}
      <nav className="flex items-center gap-7 max-[600px]:gap-5 border-b border-white/[0.06] mb-6 px-4 overflow-x-auto whitespace-nowrap w-full max-w-7xl mx-auto min-h-11">
        {navLinks.map((item) => {
          const isActive = pathname === item.link || (item.link !== "/trades/p2p" && pathname.startsWith(item.link));
          return (
            <Link
              key={item.name}
              href={item.link}
              className={clsx(
                "text-base max-[600px]:text-sm font-medium leading-none transition-colors py-3 border-b-2 -mb-px",
                isActive 
                  ? "text-white border-primary" 
                  : "text-white/55 border-transparent hover:text-white"
              )}
            >
              <div className="flex items-center gap-1.5">
                {item.name}
                {item.name === "Orders" && processingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px]">
                    {processingCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Page Content */}
      <div className="flex-1 overflow-auto w-full max-w-7xl mx-auto px-4">
        <GlobalP2PNotification />
        {children}
      </div>
    </div>
  );
};
