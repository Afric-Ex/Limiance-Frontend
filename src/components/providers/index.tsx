"use client";

import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";
import { GoogleReCaptchaProvider } from "react19-google-recaptcha-v3";

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

  const withRecaptcha = (
    <GoogleReCaptchaProvider
      reCaptchaKey={(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string) ?? ""}
    >
      {children}
    </GoogleReCaptchaProvider>
  );

  if (GoogleOAuthProvider && GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {withRecaptcha}
      </GoogleOAuthProvider>
    );
  }

  return withRecaptcha;
}

export default Providers;
