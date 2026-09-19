"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";
import React, { ReactNode, useEffect, useRef } from "react";
import { Footer } from "./footer";

const bgImagePages: string[] = [];

const NO_FOOTER_ROUTES = [
  "/dashboard",
  "/assets",
  "/earn",
  "/orders",
  "/account",
  "/settings",
  "/support",
  "/trades",
  "/transactions",
  "/buy-crypto",
  "/rewards-hub",
  "/markets",
];

export const AppContainer = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const showFooter = !NO_FOOTER_ROUTES.some((route) => pathname.startsWith(route));

  // Reset scroll to top when pathname changes, because Next.js built-in scroll-to-top
  // only operates on the window object, not our custom overflow container.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div
      ref={scrollRef}
      className={clsx(
        bgImagePages.some((each) => pathname.includes(each)) && "bg-landing",
        "flex flex-col overflow-auto h-screen"
      )}
    >
      {children}
      {showFooter && <Footer />}
    </div>
  );
};
