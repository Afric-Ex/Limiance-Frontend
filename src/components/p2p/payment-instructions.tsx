"use client";

import React from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { MdContentCopy } from "react-icons/md";

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
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-6">
      <h3 className="text-lg font-bold text-white mb-4">Payment Information</h3>
      
      <div className="bg-black/20 rounded-lg p-4 border border-white/5">
        <div className="mb-4">
          <div className="text-white/50 text-sm mb-1">Method</div>
          <div className="text-white font-medium">{method.method}</div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-white/50 text-sm mb-1">Account Name</div>
            <div className="text-white font-medium">{method.accountName}</div>
          </div>
          <Tooltip label="Copy">
            <ActionIcon variant="subtle" color="gray" onClick={() => handleCopy(method.accountName)}>
              <MdContentCopy size={18} />
            </ActionIcon>
          </Tooltip>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-white/50 text-sm mb-1">Account Number</div>
            <div className="text-xl font-bold text-white tracking-wider">{method.accountNumber}</div>
          </div>
          <Tooltip label="Copy">
            <ActionIcon variant="subtle" color="gray" onClick={() => handleCopy(method.accountNumber)}>
              <MdContentCopy size={18} />
            </ActionIcon>
          </Tooltip>
        </div>

        {method.bankName && (
          <div className="flex justify-between items-center">
            <div>
              <div className="text-white/50 text-sm mb-1">Bank Name</div>
              <div className="text-white font-medium">{method.bankName}</div>
            </div>
            <Tooltip label="Copy">
              <ActionIcon variant="subtle" color="gray" onClick={() => handleCopy(method.bankName)}>
                <MdContentCopy size={18} />
              </ActionIcon>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500/90 text-sm">
        <strong>⚠️ Important:</strong> Use exactly the Account Name shown above for the transfer. Do not include crypto-related words like "BTC", "USDT", or "Limiance" in your transfer remarks to prevent your bank account from being blocked.
      </div>
    </div>
  );
};
