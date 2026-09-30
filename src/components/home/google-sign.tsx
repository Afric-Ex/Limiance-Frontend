"use client";

import { GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export const GoogleSign = () => {
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <GoogleLogin
      size="large"
      type="icon"
      theme="outline"
      onSuccess={() => {
        // Stub: auth wiring is not implemented yet. The Google credential is a
        // bearer token - never log or persist it.
      }}
      onError={() => {
        console.log("Login Failed");
      }}
    />
  );
};
