"use client";

import React from "react";
import clsx from "clsx";
import { OrderStatus } from "@/src/stores/p2p-store";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusBadge = ({ status, className }: OrderStatusBadgeProps) => {
  let colorClass = "";
  const label = status.replace("_", " ");

  switch (status) {
    case "PENDING_PAYMENT":
      colorClass = "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      break;
    case "PAID":
      colorClass = "bg-blue-500/20 text-blue-400 border-blue-500/30";
      break;
    case "RELEASED":
    case "COMPLETED":
      colorClass = "bg-buy/20 text-buy border-buy/30";
      break;
    case "CANCELLED":
      colorClass = "bg-gray-500/20 text-gray-400 border-gray-500/30";
      break;
    case "DISPUTED":
      colorClass = "bg-[#F6465D]/20 text-[#F6465D] border-[#F6465D]/30";
      break;
    default:
      colorClass = "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }

  return (
    <div className={clsx("px-2.5 py-1 text-xs font-semibold rounded-md border uppercase tracking-wide inline-flex items-center gap-1.5", colorClass, className)}>
      {status === "PENDING_PAYMENT" && <span className="animate-pulse w-1.5 h-1.5 bg-current rounded-full" />}
      {status === "COMPLETED" && <span>✓</span>}
      {status === "CANCELLED" && <span>✕</span>}
      {status === "DISPUTED" && <span>⚠️</span>}
      {label}
    </div>
  );
};
