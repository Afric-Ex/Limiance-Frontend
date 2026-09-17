"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { GlobalP2PNotification } from "./global-p2p-notification";
import { useAllMatchedOrders, useAdvertiserInfo } from "@/src/hooks/p2p/use-p2p";

const p2pNavLinks = [
  { name: "P2P Trading", link: "/trades/p2p" },
  { name: "Orders", link: "/trades/p2p/orders" },
  { name: "My Ads", link: "/trades/p2p/my-ads" },
  // Profile will be dynamically injected if the user is an advertiser
];

export const P2PLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
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
      <div className="flex items-center space-x-8 border-b border-white/10 pb-4 mb-6 px-4 overflow-x-auto whitespace-nowrap w-full max-w-7xl mx-auto">
        {navLinks.map((item) => {
          const isActive = pathname === item.link || (item.link !== "/trades/p2p" && pathname.startsWith(item.link));
          return (
            <Link
              key={item.name}
              href={item.link}
              className={clsx(
                "text-lg font-medium transition-colors pb-4 -mb-4 border-b-2",
                isActive 
                  ? "text-white border-primary" 
                  : "text-white/55 border-transparent hover:text-white"
              )}
            >
              <div className="flex items-center">
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
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-auto w-full max-w-7xl mx-auto px-4">
        <GlobalP2PNotification />
        {children}
      </div>
    </div>
  );
};
