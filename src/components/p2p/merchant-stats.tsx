"use client";

import React from "react";
import { Avatar } from "@mantine/core";
import { MdVerified } from "react-icons/md";
import { FaThumbsUp } from "react-icons/fa";

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
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-blue-500/20 text-blue-400">
        {name ? name.charAt(0).toUpperCase() : "M"}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-base font-semibold text-white">{name}</span>
          {verified && <MdVerified className="text-[#0ECB81] text-sm" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
          <span>{trades} orders</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>{completionRate}%</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-1">
            <FaThumbsUp className="text-white/40" size={10} />
            <span>98%</span>
          </div>
        </div>
        <div className="text-xs text-white/40 mt-0.5">
          Avg. pay: {responseTime}
        </div>
      </div>
    </div>
  );
};
