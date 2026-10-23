"use client";

import React from "react";
import clsx from "clsx";
import { OrderStatus } from "@/src/stores/p2p-store";
import { MdCheckCircle, MdCancel, MdWarning } from "react-icons/md";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusBadge = ({ status, className }: OrderStatusBadgeProps) => {
  let colorClass = "";
  const label = status.replace("_", " ");

  switch (status) {
    case "PENDING_PAYMENT":
      colorClass = "bg-[#FBA42A]/10 text-[#FBA42A] border-[#FBA42A]/20";
      break;
    case "PAID":
      colorClass = "bg-[#4d77f0]/10 text-[#4d77f0] border-[#4d77f0]/20";
      break;
    case "RELEASED":
    case "COMPLETED":
      colorClass = "bg-buy/10 text-buy border-buy/20";
      break;
    case "CANCELLED":
      colorClass = "bg-white/[0.05] text-white/40 border-white/[0.08]";
      break;
    case "DISPUTED":
      colorClass = "bg-[#F6465D]/10 text-[#F6465D] border-[#F6465D]/20";
      break;
    default:
      colorClass = "bg-white/[0.05] text-white/40 border-white/[0.08]";
  }

  return (
    <div
      className={clsx(
        "px-2.5 py-0.5 text-[11px] font-semibold rounded-md border uppercase tracking-wider inline-flex items-center gap-1.5",
        colorClass,
        className
      )}
    >
      {status === "PENDING_PAYMENT" && <span className="animate-pulse w-1.5 h-1.5 bg-current rounded-full" />}
      {status === "COMPLETED" && <MdCheckCircle size={13} className="shrink-0" />}
      {status === "CANCELLED" && <MdCancel size={13} className="shrink-0" />}
      {status === "DISPUTED" && <MdWarning size={13} className="shrink-0" />}
      <span>{label}</span>
    </div>
  );
};
