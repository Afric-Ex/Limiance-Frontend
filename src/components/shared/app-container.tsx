"use client";

import clsx from "clsx";
import { usePathname } from "@/src/hooks/use-pathname";
import React, { ReactNode, useEffect, useRef } from "react";
import { Footer } from "./footer";
import { stripLocalePrefix } from "@/src/lib/locale-path";

const bgImagePages: string[] = [];

const NO_FOOTER_ROUTES = [
  "/dashboard",
  "/assets",
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
  // Paths are locale-prefixed (e.g. /fr/dashboard), so compare against the
  // prefix-free path when deciding whether a route opts out of the footer.
  const routePath = stripLocalePrefix(pathname);
  // The landing page ("/") renders its own footer.
  const showFooter = routePath !== "/" && !NO_FOOTER_ROUTES.some((route) => routePath.startsWith(route));

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
        bgImagePages.some((each) => routePath.includes(each)) && "bg-landing",
        "flex min-h-0 flex-1 flex-col overflow-auto"
      )}
    >
      {children}
      {showFooter && <Footer />}
    </div>
  );
};