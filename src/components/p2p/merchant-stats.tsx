"use client";

import React from "react";
import { MdVerified } from "react-icons/md";

interface MerchantStatsProps {
  name: string;
  verified: boolean;
  trades: number;
  completionRate: number | string;
  responseTime: string;
}

export const MerchantStats = ({ name, verified, trades, completionRate, responseTime }: MerchantStatsProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold bg-primary/10 text-primary">
        {name ? name.charAt(0).toUpperCase() : "M"}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-white">{name}</span>
          {verified && <MdVerified className="text-buy text-sm" />}
        </div>
        <div className="text-xs text-white/50 mt-0.5">
          {trades} Orders · {completionRate}% · {responseTime}
        </div>
      </div>
    </div>
  );
};
