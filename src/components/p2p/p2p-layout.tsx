"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "@/src/hooks/use-pathname";
import clsx from "clsx";
import { GlobalP2PNotification } from "./global-p2p-notification";
import { NonAdvertiserModal } from "./non-advertiser-modal";
import { KycRequiredGate } from "@/src/components/shared/kyc-required-gate";
import { SidebarMenuButton } from "@/src/components/shared/sidebar-menu";
import {
  useAllMatchedOrders,
  useP2PAdvertiserStatus,
} from "@/src/hooks/p2p/use-p2p";
import { useP2PGlobalEvents } from "@/src/hooks/p2p/use-p2p-realtime";

const p2pNavLinks = [
  { name: "P2P Trading", link: "/trades/p2p" },
  { name: "Orders", link: "/trades/p2p/orders" },
  { name: "My Ads", link: "/trades/p2p/my-ads" },
  // Profile will be dynamically injected if the user is an advertiser
];

const FINAL_ORDER_STATUSES = new Set([
  "COMPLETED",
  "RELEASED",
  "CANCELLED",
  "CANCELED",
  "EXPIRED",
]);

// The application page must stay reachable for users who have no advertiser
// account yet — it is the only way out of the restricted state.
const ADVERTISER_REGISTER_PATH = "/trades/p2p/advertiser/register";

export const P2PLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  useP2PGlobalEvents();
  const { data } = useAllMatchedOrders();
  const allOrders = (data as any)?.data?.data ?? [];
  const processingCount = allOrders.filter(
    (o: any) =>
      !FINAL_ORDER_STATUSES.has(String(o.status ?? "").toUpperCase())
  ).length;

  const {
    isAdvertiser,
    isNotAdvertiser,
    isLoading: isAdvertiserLoading,
  } = useP2PAdvertiserStatus();

  const isRegisterRoute = pathname.startsWith(ADVERTISER_REGISTER_PATH);
  // Hard gate: users without an advertiser account may not interact with the
  // P2P area at all. The whole subtree is made inert (clicks, focus, keyboard)
  // instead of relying on individual pages to guard their own buttons.
  const isBlocked = !isRegisterRoute && !isAdvertiserLoading && isNotAdvertiser;

  const navLinks = [...p2pNavLinks];
  if (isAdvertiser) {
    navLinks.push({ name: "Profile", link: "/trades/p2p/profile" });
  }

  return (
    <KycRequiredGate featureName="P2P Trading">
      <div
        className={clsx(
          "flex flex-col h-full w-full",
          isBlocked && "pointer-events-none select-none opacity-60"
        )}
        inert={isBlocked || undefined}
        aria-hidden={isBlocked || undefined}
      >
        {/* P2P Header Nav */}
        <nav className="flex items-center gap-6 max-[600px]:gap-5 border-b border-white/[0.06] mb-6 px-4 overflow-x-auto whitespace-nowrap w-full max-w-7xl mx-auto min-h-10">
          <SidebarMenuButton className="hidden min-[1150px]:grid h-8 w-8 rounded-md" />
          {navLinks.map((item) => {
            const isActive = pathname === item.link || (item.link !== "/trades/p2p" && pathname.startsWith(item.link));
            return (
              <Link
                key={item.name}
                href={item.link}
                className={clsx(
                  "text-sm font-medium leading-none transition-colors py-2.5 border-b-2 -mb-px",
                  isActive 
                    ? "text-white border-primary" 
                    : "text-white/55 border-transparent hover:text-white"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {item.name}
                  {item.name === "Orders" && processingCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center bg-yellow-500 text-black text-2xs font-bold px-1 rounded-md min-w-[18px] h-[18px]">
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

      <NonAdvertiserModal
        isOpen={isBlocked}
        onClose={() => {
          /* Required by the P2P area: the only exits are Apply or Dashboard. */
        }}
        backLabel="Exit to Dashboard"
        onBack={() => router.push("/dashboard")}
      />
    </KycRequiredGate>
  );
};
