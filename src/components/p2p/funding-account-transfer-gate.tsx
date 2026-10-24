"use client";

import React, { useState } from "react";
import { Modal, Button, NumberInput } from "@mantine/core";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { HiArrowNarrowRight } from "react-icons/hi";

interface FundingAccountTransferGateProps {
  isOpen: boolean;
  onClose: () => void;
  asset: string;
  onTransferComplete: () => void;
}

export const FundingAccountTransferGate = ({
  isOpen,
  onClose,
  asset: assetSymbol,
  onTransferComplete,
}: FundingAccountTransferGateProps) => {
  const [amount, setAmount] = useState<number | "">("");

  const { coins: portfolio } = usePortfolioWs({ coins: true });

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
        content: "!bg-[#181a20] !text-white !border !border-white/[0.08] !rounded-xl !p-2",
        header: "!bg-[#181a20] !text-white !border-b !border-white/[0.06] !pb-3",
        title: "!text-sm !font-semibold !text-white",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <p className="text-white/50 text-xs leading-relaxed">
          To sell crypto on Limiance P2P, escrowed funds must reside in your Funding Account.
        </p>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3.5 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-white/40 text-[10px] uppercase tracking-wider">From</span>
            <span className="font-semibold text-white">Spot Account</span>
          </div>
          <HiArrowNarrowRight size={18} className="text-white/30" />
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-white/40 text-[10px] uppercase tracking-wider">To</span>
            <span className="font-semibold text-white">Funding Account</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-white/60 text-xs font-medium">Transfer Amount</span>
            <span className="text-white/40 text-[11px] font-mono">
              Available: {spotBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} {assetSymbol}
            </span>
          </div>
          <NumberInput
            value={amount}
            onChange={(val) => setAmount(val === "" ? "" : Number(val))}
            placeholder="0.00"
            rightSection={
              <button
                type="button"
                className="text-[11px] font-bold text-primary hover:text-primary/80 pr-3"
                onClick={() => setAmount(spotBalance)}
              >
                MAX
              </button>
            }
            hideControls
            classNames={{
              input:
                "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.15] focus:!border-primary/60 !text-white !h-11 !text-sm font-mono !rounded-lg",
              section: "!w-fit !right-2",
            }}
          />
        </div>

        <div className="flex gap-2.5 mt-2">
          <Button
            variant="subtle"
            className="flex-1 !bg-white/[0.04] !border !border-white/[0.08] !text-white/70 hover:!text-white hover:!bg-white/[0.08] !rounded-lg !h-10 !text-xs !font-semibold"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 !bg-primary hover:!bg-primary/90 !text-white !rounded-lg !h-10 !text-xs !font-semibold"
            disabled={!amount || Number(amount) <= 0 || Number(amount) > spotBalance}
            onClick={() => {
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