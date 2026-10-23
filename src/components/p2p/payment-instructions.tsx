"use client";

import React from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { MdContentCopy, MdWarning } from "react-icons/md";

interface PaymentInstructionsProps {
  method: {
    method: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export const PaymentInstructions = ({ method }: PaymentInstructionsProps) => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-[#181a20] border border-white/[0.07] rounded-xl p-5 mt-5">
      <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Payment Information</h3>

      <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.05] divide-y divide-white/[0.05] text-xs">
        <div className="flex justify-between items-center py-2.5">
          <span className="text-white/40">Method</span>
          <span className="text-white font-medium">{method.method}</span>
        </div>

        <div className="flex justify-between items-center py-2.5">
          <div>
            <div className="text-white/40">Account Name</div>
            <div className="text-white font-medium mt-0.5">{method.accountName}</div>
          </div>
          <Tooltip label="Copy" classNames={{ tooltip: "!text-xs !bg-[#1c1e26] !border-white/10" }}>
            <ActionIcon variant="subtle" color="gray" onClick={() => handleCopy(method.accountName)}>
              <MdContentCopy size={14} className="text-white/40 hover:text-white" />
            </ActionIcon>
          </Tooltip>
        </div>

        <div className="flex justify-between items-center py-2.5">
          <div>
            <div className="text-white/40">Account Number</div>
            <div className="text-white font-mono font-bold text-sm tracking-wide mt-0.5">{method.accountNumber}</div>
          </div>
          <Tooltip label="Copy" classNames={{ tooltip: "!text-xs !bg-[#1c1e26] !border-white/10" }}>
            <ActionIcon variant="subtle" color="gray" onClick={() => handleCopy(method.accountNumber)}>
              <MdContentCopy size={14} className="text-white/40 hover:text-white" />
            </ActionIcon>
          </Tooltip>
        </div>

        {method.bankName && (
          <div className="flex justify-between items-center py-2.5">
            <div>
              <div className="text-white/40">Bank Name</div>
              <div className="text-white font-medium mt-0.5">{method.bankName}</div>
            </div>
            <Tooltip label="Copy" classNames={{ tooltip: "!text-xs !bg-[#1c1e26] !border-white/10" }}>
              <ActionIcon variant="subtle" color="gray" onClick={() => handleCopy(method.bankName)}>
                <MdContentCopy size={14} className="text-white/40 hover:text-white" />
              </ActionIcon>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="mt-3.5 p-3 bg-[#FBA42A]/10 border border-[#FBA42A]/20 rounded-lg text-[#FBA42A]/90 text-xs flex items-start gap-2.5 leading-relaxed">
        <MdWarning size={16} className="shrink-0 mt-0.5" />
        <span>
          <strong>Important:</strong> Use the exact account details shown above for the transfer. Do not include
          crypto-related words (such as &quot;BTC&quot;, &quot;USDT&quot;, or &quot;Limiance&quot;) in your bank payment
          remarks.
        </span>
      </div>
    </div>
  );
};
