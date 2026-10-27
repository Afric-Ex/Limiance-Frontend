"use client";

import React, { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Fallback dummy client_id in dev so Google GSI script doesn't throw "Missing required parameter client_id"
// when the env variable is not configured yet.
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "000000000000-dummygoogleclientid0000000000.apps.googleusercontent.com";

function Providers({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}

export default Providers;
