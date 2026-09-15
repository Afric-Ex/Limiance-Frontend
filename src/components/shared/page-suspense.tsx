"use client";

import { Suspense, type ReactNode } from "react";

/**
 * PageSuspense — wraps a page's content in a Suspense boundary with a
 * content-shaped skeleton as the fallback, so the skeleton shows while
 * data is being fetched (route streaming or suspending client data) and
 * resolves into the real page once loaded.
 */
export function PageSuspense({
  fallback,
  children,
  className = "",
}: {
  fallback: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Suspense fallback={fallback}>
      <div className={className}>{children}</div>
    </Suspense>
  );
}