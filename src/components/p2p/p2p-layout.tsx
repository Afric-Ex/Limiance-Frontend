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

export const P2PLayout = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => {
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
    <div className={clsx("flex flex-col h-full w-full", light ? "bg-[#f7f9fc] text-[#161a1e]" : "bg-transparent")}>
      {/* P2P Header Nav */}
      <div className={clsx(
        "flex items-center gap-8 border-b pb-4 mb-6 px-4 overflow-x-auto whitespace-nowrap w-full max-w-7xl mx-auto",
        light ? "border-[#e4e8ef]" : "border-white/10"
      )}>
        {navLinks.map((item) => {
          const isActive = pathname === item.link || (item.link !== "/trades/p2p" && pathname.startsWith(item.link));
          return (
            <Link
              key={item.name}
              href={item.link}
              className={clsx(
                "text-sm font-semibold transition-colors pb-4 -mb-4 border-b-2",
                isActive
                  ? light ? "text-[#161a1e] border-[#25ab42]" : "text-white border-primary"
                  : light ? "text-[#727679] border-transparent hover:text-[#161a1e]" : "text-white/55 border-transparent hover:text-white"
              )}
            >
              <div className="flex items-center">
                {item.name}
                {item.name === "Orders" && processingCount > 0 && (
                    <span className={clsx("ml-2 inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px]", light ? "bg-[#fff1d6] text-[#a56100]" : "bg-yellow-500 text-black")}>
                    {processingCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Page Content */}
      <div className={clsx("flex-1 overflow-auto w-full max-w-7xl mx-auto px-4", light && "pb-12")}>
        <GlobalP2PNotification />
        {children}
      </div>
    </div>
  );
};
