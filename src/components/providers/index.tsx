"use client";

import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Lazy-load GoogleOAuthProvider only when client ID is available
let GoogleOAuthProvider: React.ComponentType<{
  clientId: string;
  children: ReactNode;
}> | null = null;

if (GOOGLE_CLIENT_ID) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  GoogleOAuthProvider = require("@react-oauth/google").GoogleOAuthProvider;
}

function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.includes("/auth") || pathname === "/";

  if (!isAuthPage) return <>{children}</>;

  if (GoogleOAuthProvider && GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {children}
      </GoogleOAuthProvider>
    );
  }

  return <>{children}</>;
}

export default Providers;
