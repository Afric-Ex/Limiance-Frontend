"use client";

import React from "react";
import { Button, Modal } from "@mantine/core";
import { useRouter } from "next/navigation";

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
        content: "bg-gray-900 text-white",
        header: "bg-gray-900 text-white border-b border-white/10",
        title: "text-lg font-bold",
        close: "text-white hover:bg-white/10",
        body: "max-h-[80vh] overflow-y-auto",
      }}
    >
      <div className="flex flex-col gap-5 pt-1">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-500/20 text-gray-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ✕
          </div>
          <p className="text-white/70 text-sm">
            This order was automatically cancelled because {reason}
          </p>
        </div>

        <div className="bg-black/20 p-5 rounded-xl border border-white/5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="min-w-0">
              <div className="text-white/40 text-xs mb-1">Order ID</div>
              <div className="text-white font-mono text-sm break-all">{orderId}</div>
            </div>
            <div className="min-w-0">
              <div className="text-white/40 text-xs mb-1">Crypto Amount</div>
              <div className="text-white font-bold text-sm">{cryptoAmount.toLocaleString()} {asset}</div>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-white/80 text-sm">
            {isBuyer ? (
              <p>No funds were deducted. You may return to the marketplace to try again with another advertiser.</p>
            ) : (
              <p>Your crypto has been unlocked and safely returned to your Funding Account.</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="light"
            color="gray"
            className="flex-1 bg-white/5 hover:bg-white/10 text-white"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10"
            onClick={() => router.push("/trades/p2p")}
          >
            Back to Marketplace
          </Button>
        </div>
      </div>
    </Modal>
  );
};
