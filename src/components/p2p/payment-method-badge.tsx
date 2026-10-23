"use client";

import React from "react";
import clsx from "clsx";

interface PaymentMethodBadgeProps {
  method: string;
  className?: string;
}

export const PaymentMethodBadge = ({ method, className }: PaymentMethodBadgeProps) => {
  return (
    <div
      className={clsx(
        "px-2.5 py-0.5 rounded text-xs font-medium border bg-white/[0.05] border-white/[0.08] text-white/70 flex items-center gap-1.5",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
      <span>{method}</span>
    </div>
  );
};
