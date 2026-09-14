"use client";

import React from "react";
import clsx from "clsx";

interface PaymentMethodBadgeProps {
  method: string;
  className?: string;
}

const getMethodColor = (method: string) => {
  const methodLower = method.toLowerCase();
  if (methodLower.includes("bank") || methodLower.includes("transfer")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (methodLower.includes("paypal")) return "bg-[#00457C]/20 text-[#0079C1] border-[#0079C1]/30";
  if (methodLower.includes("wechat")) return "bg-green-500/10 text-green-400 border-green-500/20";
  if (methodLower.includes("alipay")) return "bg-[#1677FF]/10 text-[#1677FF] border-[#1677FF]/20";
  return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
};

export const PaymentMethodBadge = ({ method, className }: PaymentMethodBadgeProps) => {
  return (
    <div className={clsx("px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1", getMethodColor(method), className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {method}
    </div>
  );
};
