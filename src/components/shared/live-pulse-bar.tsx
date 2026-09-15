"use client";

import React, { useEffect, useState } from "react";
import { AiOutlineFire } from "react-icons/ai";

export const LivePulseBar = () => {
  const [pulseText, setPulseText] = useState("BTC surged 5.2% in the last 24h");

  // Rotating alerts
  useEffect(() => {
    const alerts = [
      "BTC surged 5.2% in the last 24h",
      "Whale Alert: 1,000 BTC transferred",
      "ETH/USDT high trading volume",
      "New Listing: NOT/USDT is now live!",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % alerts.length;
      setPulseText(alerts[idx]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-[60px] min-[1150px]:hidden left-0 right-0 z-40 bg-elevated/95 backdrop-blur-md border-t border-b border-primary/20 shadow-[0_-2px_10px_rgba(37,171,66,0.1)] overflow-hidden">
      <div className="flex items-center px-4 py-1.5 gap-2">
        <div className="flex items-center justify-center text-primary animate-pulse w-4 h-4">
          <AiOutlineFire size={14} />
        </div>
        <div className="flex-1 overflow-hidden relative h-[18px]">
          <span
            key={pulseText}
            className="text-[10px] font-semibold text-white/80 absolute left-0 top-0 truncate animate-fade-in transition-all duration-300"
          >
            {pulseText}
          </span>
        </div>
      </div>
    </div>
  );
};
