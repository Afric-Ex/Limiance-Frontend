"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "@/src/components/icons/clock";
import { MdHourglassEmpty, MdWarning } from "react-icons/md";
import handImage from "@/public/hand.png";

interface KickstartJourneyProps {
  kycStatus?: string | null;
  onRefreshStatus?: () => void;
}

export const KickstartJourney: React.FC<KickstartJourneyProps> = ({
  kycStatus,
  onRefreshStatus,
}) => {
  const router = useRouter();
  const normalizedStatus = String(kycStatus || "").toLowerCase();
  const isPending = ["pending", "processing", "under_review"].includes(normalizedStatus);
  const isRejected = ["rejected", "failed"].includes(normalizedStatus);

  const handleVerificationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPending && onRefreshStatus) {
      onRefreshStatus();
    }
    router.push("/account/kyc?start=1");
  };

  return (
    <section aria-label="Kick start your journey" className="w-full flex flex-col gap-4 animate-fade-up">
      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
        Kick Start Your Journey!
      </h3>

      {/* Stepper Header */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 lg:gap-4 items-center">
        {/* Step 1 indicator */}
        <div className="md:col-span-6 flex items-center">
          <div className="flex items-center gap-3 w-full">
            <span
              className="w-6 h-6 rounded-full bg-[#2f66f6] text-white flex items-center justify-center text-xs font-bold shadow-[0_0_12px_rgba(47,102,246,0.6)] shrink-0"
              aria-label="Step 1"
            >
              1
            </span>
            <div className="hidden md:block flex-1 border-t border-dashed border-white/20" />
          </div>
        </div>

        {/* Step 2 indicator */}
        <div className="hidden md:flex md:col-span-3 items-center">
          <div className="flex items-center gap-3 w-full">
            <span
              className="w-6 h-6 rounded-full bg-[#1b2234] border border-white/10 text-white/40 flex items-center justify-center text-xs font-medium shrink-0"
              aria-label="Step 2"
            >
              2
            </span>
            <div className="flex-1 border-t border-dashed border-white/20" />
          </div>
        </div>

        {/* Step 3 indicator */}
        <div className="hidden md:flex md:col-span-3 items-center">
          <div className="flex items-center gap-3 w-full">
            <span
              className="w-6 h-6 rounded-full bg-[#1b2234] border border-white/10 text-white/40 flex items-center justify-center text-xs font-medium shrink-0"
              aria-label="Step 3"
            >
              3
            </span>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 lg:gap-4 items-stretch">
        {/* Card 1: Verify your Identity */}
        <div className="md:col-span-6 relative overflow-hidden rounded-card border border-[#2f66f6]/40 bg-gradient-to-br from-[#10192e] via-[#0d1424] to-[#0a0f1b] p-5 sm:p-6 flex justify-between items-center transition-all duration-300 hover:border-[#2f66f6]/70 shadow-[0_8px_30px_rgba(0,0,0,0.35)] min-h-[160px]">
          {/* Background decorative glow */}
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-[#2f66f6]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Left Text & Actions */}
          <div className="flex flex-col gap-2.5 z-10 max-w-[240px] sm:max-w-[300px] lg:max-w-[340px]">
            <h4 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Verify your Identity
            </h4>
            <p className="text-xs sm:text-sm text-white/60 leading-snug">
              complete the verification steps to secure your account.
            </p>

            {/* Status alerts if pending or rejected */}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 w-fit">
                <MdHourglassEmpty size={13} className="animate-spin" />
                Under Review
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-1/10 text-error-1 border border-error-1/20 w-fit">
                <MdWarning size={13} />
                Needs Resubmission
              </span>
            )}

            {/* Action button & badges row */}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <button
                onClick={handleVerificationClick}
                className="bg-[#2f66f6] hover:bg-[#2557e0] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all shadow-[0_2px_10px_rgba(47,102,246,0.4)] active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {isPending
                  ? "Check Status"
                  : isRejected
                  ? "Retry Verification"
                  : "Continue Verification"}
              </button>

              {/* Badges B and A matching Figma design */}
              {/* <div className="flex items-center -space-x-1.5">
                <span
                  title="Binance / Bitcoin"
                  className="w-6 h-6 rounded-full bg-[#f59e0b] text-[#0d1424] font-black text-[11px] flex items-center justify-center shadow-md ring-2 ring-[#0d1424]"
                >
                  B
                </span>
                <span
                  title="Avalanche / Assets"
                  className="w-6 h-6 rounded-full bg-[#e11d48] text-white font-black text-[11px] flex items-center justify-center shadow-md ring-2 ring-[#0d1424]"
                >
                  A
                </span>
              </div> */}
            </div>
          </div>

          {/* Right 3D Illustration */}
          <div className="relative shrink-0 w-[105px] sm:w-[130px] lg:w-[145px] h-[120px] sm:h-[135px] flex items-center justify-center pointer-events-none select-none">
            <Image
              src={handImage}
              alt="Identity Verification 3D Graphic"
              width={145}
              height={145}
              className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              priority
            />
          </div>
        </div>

        {/* Card 2: Deposit */}
        <Link
          href="/transactions/deposit"
          className="md:col-span-3 rounded-card border border-white/[0.06] bg-[#181a20] p-5 sm:p-6 flex flex-col justify-between min-h-[140px] md:min-h-[160px] transition-all hover:bg-white/[0.03] hover:border-white/10 group cursor-pointer"
        >
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-white/70 group-hover:text-white transition-colors">
              Deposit
            </h4>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
            <Clock className="w-3.5 h-3.5 stroke-white/40" />
            <span>Pending</span>
          </div>
        </Link>

        {/* Card 3: Trade */}
        <Link
          href="/trades/spot"
          className="md:col-span-3 rounded-card border border-white/[0.06] bg-[#181a20] p-5 sm:p-6 flex flex-col justify-between min-h-[140px] md:min-h-[160px] transition-all hover:bg-white/[0.03] hover:border-white/10 group cursor-pointer"
        >
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-white/70 group-hover:text-white transition-colors">
              Trade
            </h4>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
            <Clock className="w-3.5 h-3.5 stroke-white/40" />
            <span>Pending</span>
          </div>
        </Link>
      </div>
    </section>
  );
};
