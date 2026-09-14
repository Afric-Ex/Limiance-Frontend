"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/src/services/auth";
import SumsubWebSdk from "@sumsub/websdk-react";
import { getKycAccessToken } from "@/src/lib/normalize-kyc-status";

export default function Start() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeToken, setActiveToken] = useState<string | null>(null);

  const handleStartKyc = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await auth.startKyc();
      const token = getKycAccessToken(res as any);
      if (!token || typeof token !== "string") {
        setError("Unable to start verification. Please try again.");
        setLoading(false);
        return;
      }
      setActiveToken(token);
      setLoading(false);
    } catch {
      setLoading(false);
      setError("Could not start verification. Please try again.");
    }
  };

  const accessTokenExpirationHandler = () => {
    return Promise.resolve(activeToken || "");
  };

  const sumsubMessage = (type: string, payload: any) => {
    console.log("Sumsub message:", type, payload);
    if (type === "idCheck.onApplicantSubmitted") {
      router.push("/auth/verify-identity/pending");
    }
    if (type === "idCheck.onCancel") {
      setActiveToken(null);
      setError("Verification cancelled.");
    }
  };

  const sumsubError = (error: any) => {
    console.error("Sumsub error:", error);
    setError(error?.message || "Verification failed. Please try again.");
    setActiveToken(null);
  };

  return (
    <main className="flex flex-col gap-12 min-h-hero pt-10 relative bg-verifyIdentityBg bg-cover bg-no-repeat">
      <div className="flex max-w-1199px w-11/12 mx-auto flex-col gap-8">
        <h1 className="pb-3 border-b border-b-white/25 text-28px font-semibold">
          Identity verification
        </h1>
        <h2 className="text-36px font-bold">Verify your identity</h2>
      </div>
      <div className="flex items-center justify-center flex-1">
        {activeToken ? (
          <div className="w-full max-w-md bg-white rounded-lg overflow-hidden p-4">
            <SumsubWebSdk
              accessToken={activeToken}
              expirationHandler={accessTokenExpirationHandler}
              config={{ lang: "en" }}
              options={{ addViewportTag: false, adaptIframeHeight: true }}
              onMessage={sumsubMessage}
              onError={sumsubError}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 max-w-md w-full">
            <p className="text-center text-white/70">
              We use Sumsub to securely verify your identity. You will need a
              government-issued ID and your device camera.
            </p>
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <button
              onClick={handleStartKyc}
              disabled={loading}
              className="w-full py-3 px-6 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Starting..." : "Start Verification"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
