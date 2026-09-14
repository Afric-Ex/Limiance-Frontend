"use client";

import React from "react";
import { FaCheck } from "react-icons/fa";
import { MdWarning } from "react-icons/md";
import { isKycApproved } from "@/src/lib/normalize-kyc-status";

interface VerifyStatusTagProps {
  verified?: boolean;
  status?: string | null;
}

export const VerifyStatusTag = ({ verified = false, status }: VerifyStatusTagProps) => {
  const normalizedStatus = String(status || "").toLowerCase();
  const isVerified = verified || isKycApproved(normalizedStatus);

  if (isVerified) {
    return (
      <span className="flex gap-1.5 text-success-1 rounded-full bg-success-1/10 items-center py-0.5 px-2.5 border border-success-1/20">
        <FaCheck size={10} />
        <span className="text-xs font-semibold">Verified</span>
      </span>
    );
  }

  if (["pending", "processing", "under_review"].includes(normalizedStatus)) {
    return (
      <span className="flex gap-1.5 text-yellow-400 rounded-full bg-yellow-400/10 items-center py-0.5 px-2.5 border border-yellow-400/20">
        <MdWarning size={11} />
        <span className="text-xs font-semibold">Pending</span>
      </span>
    );
  }

  if (["rejected", "failed"].includes(normalizedStatus)) {
    return (
      <span className="flex gap-1.5 text-error-1 rounded-full bg-error-1/10 items-center py-0.5 px-2.5 border border-error-1/20">
        <MdWarning size={11} />
        <span className="text-xs font-semibold">{normalizedStatus === "failed" ? "Failed" : "Rejected"}</span>
      </span>
    );
  }

  return (
    <span className="flex gap-1.5 text-yellow-400 rounded-full bg-yellow-400/10 items-center py-0.5 px-2.5 border border-yellow-400/20">
      <MdWarning size={11} />
      <span className="text-xs font-semibold">Unverified</span>
    </span>
  );
};
