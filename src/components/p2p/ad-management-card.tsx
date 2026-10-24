"use client";

import React, { useState } from "react";
import { Ad } from "@/src/stores/p2p-store";
import { Button, Modal } from "@mantine/core";
import { useRouter } from "next/navigation";
import { PaymentMethodBadge } from "./payment-method-badge";
import { MdWarning } from "react-icons/md";
import clsx from "clsx";

interface AdManagementCardProps {
  ad: Ad;
  isActive: boolean;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
}

export const AdManagementCard = ({
  ad,
  isActive,
  onPause,
  onResume,
  onDelete,
}: AdManagementCardProps) => {
  const router = useRouter();
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <div className="bg-[#181a20] border border-white/[0.07] rounded-xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start border-b border-white/[0.06] pb-3.5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span
              className={clsx(
                "px-2 py-0.5 rounded text-xs font-bold uppercase",
                ad.type === "BUY" ? "bg-buy/15 text-buy" : "bg-sell/15 text-sell"
              )}
            >
              {ad.type}
            </span>
            <span className="text-sm font-bold text-white font-mono">
              {ad.asset}/{ad.fiat}
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-buy" : "bg-white/30"}`} />
              <span className="text-xs text-white/50">{isActive ? "Active" : "Paused"}</span>
            </div>
          </div>
          <div className="text-white/40 text-[11px]">
            Created: 14 Mar 2024 · Orders: 12 completed
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-white font-mono tabular-nums">
            {ad.price.toLocaleString()} <span className="text-xs font-normal text-white/40">{ad.fiat}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg">
          <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Available Amount</div>
          <div className="text-white font-medium font-mono tabular-nums">
            {ad.availableQuantity.toLocaleString()} {ad.asset}
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg">
          <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Order Limit</div>
          <div className="text-white font-medium font-mono tabular-nums">
            {ad.minQuantity.toLocaleString()} – {ad.maxQuantity.toLocaleString()} {ad.asset}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Payment Methods</div>
          <div className="flex flex-wrap gap-1.5">
            {ad.paymentMethods.map((m) => (
              <PaymentMethodBadge key={m} method={m} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 border-t border-white/[0.06] pt-3 mt-1">
        <Button
          variant="subtle"
          className="flex-1 !bg-white/[0.04] !border !border-white/[0.08] !text-white/80 hover:!text-white hover:!bg-white/[0.08] !h-9 !text-xs !rounded-lg"
          onClick={() => router.push(`/trades/p2p/ads/edit/${ad.id}`)}
        >
          Edit
        </Button>
        {isActive ? (
          <Button
            variant="subtle"
            className="flex-1 !bg-yellow-500/10 !border !border-yellow-500/20 !text-yellow-500 hover:!bg-yellow-500/20 !h-9 !text-xs !rounded-lg"
            onClick={() => setIsPauseModalOpen(true)}
          >
            Pause
          </Button>
        ) : (
          <Button
            variant="subtle"
            className="flex-1 !bg-buy/10 !border !border-buy/20 !text-buy hover:!bg-buy/20 !h-9 !text-xs !rounded-lg"
            onClick={onResume}
          >
            Resume
          </Button>
        )}
        <Button
          variant="subtle"
          className="flex-1 !bg-[#F6465D]/10 !border !border-[#F6465D]/20 !text-[#F6465D] hover:!bg-[#F6465D]/20 !h-9 !text-xs !rounded-lg"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          Delete
        </Button>
      </div>

      {/* Pause Modal */}
      <Modal
        opened={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
        title="Pause Advertisement?"
        centered
        classNames={{
          content: "!bg-[#181a20] !text-white !border !border-white/[0.08] !rounded-xl !p-2",
          header: "!bg-[#181a20] !text-white !border-b !border-white/[0.06] !pb-3",
          title: "!text-sm !font-semibold !text-white",
          close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
        }}
      >
        <div className="py-2 flex flex-col gap-4">
          <p className="text-white/60 text-xs leading-relaxed">
            Your advertisement will be hidden from the P2P marketplace. Any existing active orders will continue until completed.
          </p>
          <div className="flex gap-2.5 mt-2">
            <Button
              variant="subtle"
              className="flex-1 !bg-white/[0.04] !border !border-white/[0.08] !text-white/70 hover:!text-white hover:!bg-white/[0.08] !h-10 !text-xs !rounded-lg"
              onClick={() => setIsPauseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 !bg-yellow-500 hover:!bg-yellow-600 !text-black !font-semibold !h-10 !text-xs !rounded-lg"
              onClick={() => {
                setIsPauseModalOpen(false);
                onPause();
              }}
            >
              Pause Advertisement
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Advertisement?"
        centered
        classNames={{
          content: "!bg-[#181a20] !text-white !border !border-white/[0.08] !rounded-xl !p-2",
          header: "!bg-[#181a20] !text-white !border-b !border-white/[0.06] !pb-3",
          title: "!text-sm !font-semibold !text-[#F6465D]",
          close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
        }}
      >
        <div className="py-2 flex flex-col gap-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-xs text-yellow-500/90 flex gap-2">
            <MdWarning size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Are you sure? This action cannot be undone.</p>
              <p className="text-yellow-500/75 text-[11px]">Any locked crypto will be returned to your Funding Account.</p>
            </div>
          </div>
          <div className="flex gap-2.5 mt-2">
            <Button
              variant="subtle"
              className="flex-1 !bg-white/[0.04] !border !border-white/[0.08] !text-white/70 hover:!text-white hover:!bg-white/[0.08] !h-10 !text-xs !rounded-lg"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 !bg-[#F6465D] hover:!bg-[#F6465D]/90 !text-white !font-semibold !h-10 !text-xs !rounded-lg"
              onClick={() => {
                setIsDeleteModalOpen(false);
                onDelete();
              }}
            >
              Delete Advertisement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};