"use client";

import React from "react";
import { Button, Modal } from "@mantine/core";
import { useRouter } from "next/navigation";
import { MdCancel } from "react-icons/md";

interface OrderCancelledOverlayProps {
  orderId: string;
  cryptoAmount: number;
  asset: string;
  isBuyer: boolean;
  reason?: string;
  onClose: () => void;
}

export const OrderCancelledOverlay = ({
  orderId,
  cryptoAmount,
  asset,
  isBuyer,
  reason = "payment was not confirmed within the time limit.",
  onClose,
}: OrderCancelledOverlayProps) => {
  const router = useRouter();

  return (
    <Modal
      opened
      onClose={onClose}
      title="Order Cancelled"
      centered
      classNames={{
        content: "!bg-[#181a20] !border !border-white/[0.08] !text-white !rounded-xl",
        header: "!bg-[#181a20] !border-b !border-white/[0.06] !text-white",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
        body: "max-h-[80vh] overflow-y-auto",
      }}
    >
      <div className="flex flex-col gap-4 pt-1">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F6465D]/10 border border-[#F6465D]/20 flex items-center justify-center text-[#F6465D] mx-auto mb-3">
            <MdCancel size={24} />
          </div>
          <p className="text-white/60 text-xs">This order was cancelled because {reason}</p>
        </div>

        <div className="bg-white/[0.03] p-4 rounded-lg border border-white/[0.06]">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Order ID</div>
              <div className="text-white font-mono text-xs truncate">{orderId}</div>
            </div>
            <div className="min-w-0">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Crypto Amount</div>
              <div className="text-white font-semibold font-mono text-xs">
                {cryptoAmount.toLocaleString()} {asset}
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05] text-white/70 text-xs leading-relaxed">
            {isBuyer ? (
              <p>No funds were deducted. You may return to the marketplace to trade with another counterparty.</p>
            ) : (
              <p>Your crypto has been released from escrow and returned to your Funding Account.</p>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 mt-1">
          <Button
            variant="subtle"
            className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="flex-1 !bg-primary hover:!bg-primary/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            onClick={() => router.push("/trades/p2p")}
          >
            Back to Marketplace
          </Button>
        </div>
      </div>
    </Modal>
  );
};
