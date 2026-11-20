"use client";

import React from "react";
import { KycRequiredGate } from "@/src/components/shared/kyc-required-gate";

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KycRequiredGate featureName="Transactions">{children}</KycRequiredGate>;
}
