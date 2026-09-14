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
      onSuccess={(credentialResponse) => {
        if (credentialResponse.credential)
          console.log(credentialResponse.credential);
      }}
      onError={() => {
        console.log("Login Failed");
      }}
    />
  );
};
