"use client";

import React from "react";
import { useP2PStore } from "@/src/stores/p2p-store";
import { Select, TextInput, NumberInput } from "@mantine/core";

export const FilterBar = () => {
  const { adFilters, setAdFilters } = useP2PStore();

  return (
    <div className="flex flex-wrap items-center gap-4 max-[1150px]:gap-3 bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.1)] p-4 max-[1150px]:p-3 rounded-2xl max-[1150px]:rounded-xl mb-6 max-[1150px]:mb-4">
      {/* Buy/Sell Tabs */}
      <div className="flex bg-black/40 backdrop-blur-md rounded-xl p-1.5 border border-white/[0.05] max-[1150px]:w-full">
        <button
          className={`px-8 py-2 rounded-lg text-sm font-bold transition-all duration-300 max-[1150px]:flex-1 ${
            adFilters.type === "BUY" ? "bg-[#0ECB81] text-white shadow-[0_0_15px_rgba(14,203,129,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
          onClick={() => setAdFilters({ type: "BUY" })}
        >
          Buy
        </button>
        <button
          className={`px-8 py-2 rounded-lg text-sm font-bold transition-all duration-300 max-[1150px]:flex-1 ${
            adFilters.type === "SELL" ? "bg-[#F6465D] text-white shadow-[0_0_15px_rgba(246,70,93,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
          onClick={() => setAdFilters({ type: "SELL" })}
        >
          Sell
        </button>
      </div>

      <div className="flex-1 min-w-[200px] max-[1150px]:w-full max-[1150px]:flex-none">
        <NumberInput
          placeholder="Enter Amount"
          value={adFilters.amount ? Number(adFilters.amount) : ""}
          onChange={(val) => setAdFilters({ amount: val ? val.toString() : "" })}
          hideControls
          classNames={{
            input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white placeholder-white/30 h-11 rounded-xl focus:border-[#0ECB81] focus:ring-1 focus:ring-[#0ECB81]/30 transition-all",
          }}
          rightSection={<span className="text-white/50 pr-2 font-medium text-xs">{adFilters.fiat}</span>}
        />
      </div>

      <div className="w-[120px] max-[1150px]:w-[calc(50%-6px)]">
        <Select
          value={adFilters.asset}
          onChange={(val) => setAdFilters({ asset: val || "USDT" })}
          data={["USDT", "BTC", "ETH"]}
          classNames={{
            input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-11 rounded-xl focus:border-[#0ECB81] focus:ring-1 focus:ring-[#0ECB81]/30 transition-all font-semibold",
            dropdown: "bg-[#111] border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-xl",
            option: "hover:bg-white/10 data-[combobox-selected]:bg-[#0ECB81]/20 data-[combobox-selected]:text-[#0ECB81] rounded-lg mx-1 my-0.5 transition-colors"
          }}
        />
      </div>

      <div className="w-[120px] max-[1150px]:w-[calc(50%-6px)]">
        <Select
          value={adFilters.fiat}
          onChange={(val) => setAdFilters({ fiat: val || "USD" })}
          data={["USD", "EUR", "GBP", "NGN"]}
          classNames={{
            input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-11 rounded-xl focus:border-[#0ECB81] focus:ring-1 focus:ring-[#0ECB81]/30 transition-all font-semibold",
            dropdown: "bg-[#111] border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-xl",
            option: "hover:bg-white/10 data-[combobox-selected]:bg-[#0ECB81]/20 data-[combobox-selected]:text-[#0ECB81] rounded-lg mx-1 my-0.5 transition-colors"
          }}
        />
      </div>

      <div className="w-[180px] max-[1150px]:w-full">
        <Select
          value={adFilters.paymentMethod}
          onChange={(val) => setAdFilters({ paymentMethod: val || "All" })}
          data={["All", "Bank Transfer", "PayPal", "WeChat", "Alipay"]}
          placeholder="Payment Method"
          classNames={{
            input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-11 rounded-xl focus:border-[#0ECB81] focus:ring-1 focus:ring-[#0ECB81]/30 transition-all font-medium",
            dropdown: "bg-[#111] border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-xl",
            option: "hover:bg-white/10 data-[combobox-selected]:bg-[#0ECB81]/20 data-[combobox-selected]:text-[#0ECB81] rounded-lg mx-1 my-0.5 transition-colors"
          }}
        />
      </div>
    </div>
  );
};
