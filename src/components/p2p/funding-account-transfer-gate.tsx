"use client";

import React, { useState } from "react";
import { Modal, Button, NumberInput } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { asset, assetKeys } from "@/src/services/asset";

interface FundingAccountTransferGateProps {
  isOpen: boolean;
  onClose: () => void;
  asset: string;
  onTransferComplete: () => void;
}

export const FundingAccountTransferGate = ({ isOpen, onClose, asset: assetSymbol, onTransferComplete }: FundingAccountTransferGateProps) => {
  const [amount, setAmount] = useState<number | "">("");

  const { data: portfolio } = useQuery({
    queryKey: assetKeys.portfolio(),
    queryFn: asset.fetchPortfolio,
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: 30_000,
  });

  const spotBalance = parseFloat(
    portfolio?.find((p: any) => p.symbol.toUpperCase() === assetSymbol.toUpperCase())?.spotBalance || "0"
  );

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Transfer to Funding Account"
      centered
      classNames={{
        content: "bg-gray-900 text-white",
        header: "bg-gray-900 text-white border-b border-white/10",
        title: "text-lg font-bold text-white",
        close: "text-white hover:bg-white/10"
      }}
    >
      <div className="flex flex-col gap-6 py-2">
        <p className="text-white/80 text-sm">
          To sell crypto on P2P, the funds must be in your Funding Account.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50">From</span>
            <span className="font-bold text-white">Spot Account</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50">To</span>
            <span className="font-bold text-white">Funding Account</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-white/70 text-sm">Amount</span>
            <span className="text-white/50 text-xs">Available: {spotBalance} {assetSymbol}</span>
          </div>
          <NumberInput
            value={amount}
            onChange={(val) => setAmount(val === "" ? "" : Number(val))}
            placeholder="0.00"
            rightSection={<span className="text-white/50 pr-4">{assetSymbol}</span>}
            hideControls
            classNames={{
              input: "bg-black/40 border-white/10 text-white focus:border-primary h-12 text-lg"
            }}
          />
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="light" color="gray" className="flex-1 bg-white/5 hover:bg-white/10 text-white" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!amount || Number(amount) <= 0 || Number(amount) > spotBalance}
            onClick={() => {
              // Mock API call
              onTransferComplete();
              onClose();
            }}
          >
            Confirm Transfer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
