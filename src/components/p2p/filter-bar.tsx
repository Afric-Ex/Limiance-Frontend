"use client";

import React from "react";
import { useP2PStore } from "@/src/stores/p2p-store";
import { Select, NumberInput } from "@mantine/core";
import { FiChevronDown, FiFilter } from "react-icons/fi";

export const FilterBar = () => {
  const { adFilters, setAdFilters } = useP2PStore();

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white border border-[#e4e8ef] p-2 rounded-[4px] mb-6 shadow-[0_4px_14px_rgba(31,45,61,0.04)]">
      {/* Buy/Sell Tabs */}
      <div className="flex bg-[#f0f3f7] rounded-[3px] p-1 max-[1150px]:w-full">
        <button
            className={`px-8 py-2 rounded-[2px] text-sm font-semibold transition-all duration-200 max-[1150px]:flex-1 ${
            adFilters.type === "BUY" ? "bg-[#25ab42] text-white" : "text-[#727679] hover:text-[#161a1e] hover:bg-white"
          }`}
          onClick={() => setAdFilters({ type: "BUY" })}
        >
          Buy
        </button>
        <button
            className={`px-8 py-2 rounded-[2px] text-sm font-semibold transition-all duration-200 max-[1150px]:flex-1 ${
            adFilters.type === "SELL" ? "bg-[#f6465d] text-white" : "text-[#727679] hover:text-[#161a1e] hover:bg-white"
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
            input: "bg-white border-0 text-[#161a1e] placeholder-[#a1a1aa] h-10 rounded-[2px] focus:border-[#25ab42] focus:ring-1 focus:ring-[#25ab42]/30 transition-all",
          }}
          rightSection={<span className="text-[#727679] pr-2 font-medium text-xs">{adFilters.fiat}</span>}
        />
      </div>

      <div className="w-[120px] max-[1150px]:w-[calc(50%-6px)]">
        <Select
          value={adFilters.asset}
          onChange={(val) => setAdFilters({ asset: val || "USDT" })}
          data={["USDT", "BTC", "ETH"]}
          classNames={{
            input: "bg-white border-0 text-[#161a1e] h-10 rounded-[2px] focus:border-[#25ab42] focus:ring-1 focus:ring-[#25ab42]/30 transition-all font-semibold",
            dropdown: "bg-white border-[#e4e8ef] text-[#161a1e] shadow-xl rounded-[4px]",
            option: "hover:bg-[#f0f3f7] data-[combobox-selected]:bg-[#e8f6eb] data-[combobox-selected]:text-[#168331] rounded-[2px] mx-1 my-0.5 transition-colors"
          }}
          rightSection={<FiChevronDown size={15} className="text-[#727679]" />}
        />
      </div>

      <div className="w-[120px] max-[1150px]:w-[calc(50%-6px)]">
        <Select
          value={adFilters.fiat}
          onChange={(val) => setAdFilters({ fiat: val || "USD" })}
          data={["USD", "EUR", "GBP", "NGN"]}
          classNames={{
            input: "bg-white border-0 text-[#161a1e] h-10 rounded-[2px] focus:border-[#25ab42] focus:ring-1 focus:ring-[#25ab42]/30 transition-all font-semibold",
            dropdown: "bg-white border-[#e4e8ef] text-[#161a1e] shadow-xl rounded-[4px]",
            option: "hover:bg-[#f0f3f7] data-[combobox-selected]:bg-[#e8f6eb] data-[combobox-selected]:text-[#168331] rounded-[2px] mx-1 my-0.5 transition-colors"
          }}
          rightSection={<FiChevronDown size={15} className="text-[#727679]" />}
        />
      </div>

      <div className="w-[180px] max-[1150px]:w-full">
        <Select
          value={adFilters.paymentMethod}
          onChange={(val) => setAdFilters({ paymentMethod: val || "All" })}
          data={["All", "Bank Transfer", "PayPal", "WeChat", "Alipay"]}
          placeholder="Payment Method"
          classNames={{
            input: "bg-white border-0 text-[#161a1e] h-10 rounded-[2px] focus:border-[#25ab42] focus:ring-1 focus:ring-[#25ab42]/30 transition-all font-medium",
            dropdown: "bg-white border-[#e4e8ef] text-[#161a1e] shadow-xl rounded-[4px]",
            option: "hover:bg-[#f0f3f7] data-[combobox-selected]:bg-[#e8f6eb] data-[combobox-selected]:text-[#168331] rounded-[2px] mx-1 my-0.5 transition-colors"
          }}
          rightSection={<FiChevronDown size={15} className="text-[#727679]" />}
        />
      </div>

      <button type="button" className="hidden max-[1150px]:flex items-center gap-2 h-10 px-3 text-sm font-semibold text-[#161a1e] border-l border-[#e4e8ef]" aria-label="Open filters">
        <FiFilter size={15} /> Filter
      </button>
    </div>
  );
};
