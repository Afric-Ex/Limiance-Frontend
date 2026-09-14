"use client";

import React, { useState } from "react";
import { Ad } from "@/src/stores/p2p-store";
import { Button, Modal } from "@mantine/core";
import { useRouter } from "next/navigation";
import { PaymentMethodBadge } from "./payment-method-badge";

interface AdManagementCardProps {
  ad: Ad;
  isActive: boolean;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
}

export const AdManagementCard = ({ ad, isActive, onPause, onResume, onDelete }: AdManagementCardProps) => {
  const router = useRouter();
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-start border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-lg font-bold ${ad.type === "BUY" ? "text-[#0ECB81]" : "text-[#F6465D]"}`}>
              {ad.type} {ad.asset}/{ad.fiat}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isActive ? "bg-[#0ECB81]" : "bg-gray-500"}`} />
              <span className="text-sm font-medium text-white/70">{isActive ? "Active" : "Paused"}</span>
            </div>
          </div>
          <div className="text-white/50 text-sm">
            Created: 14 Mar 2024 • Orders: 12 completed
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white mb-1">
            {ad.price.toLocaleString()} {ad.fiat}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-white/50 mb-1">Available Amount</div>
          <div className="text-white font-medium">{ad.availableQuantity.toLocaleString()} {ad.asset}</div>
        </div>
        <div>
          <div className="text-white/50 mb-1">Order Limit</div>
          <div className="text-white font-medium">{ad.minQuantity.toLocaleString()} - {ad.maxQuantity.toLocaleString()} {ad.asset}</div>
        </div>
        <div className="col-span-2">
          <div className="text-white/50 mb-1">Payment Methods</div>
          <div className="flex flex-wrap gap-2">
            {ad.paymentMethods.map(m => (
              <PaymentMethodBadge key={m} method={m} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-2 border-t border-white/10 pt-4">
        <Button 
          variant="light" 
          color="gray" 
          className="flex-1 bg-white/5 hover:bg-white/10 text-white"
          onClick={() => router.push(`/p2p/ads/edit/${ad.id}`)}
        >
          Edit
        </Button>
        {isActive ? (
          <Button 
            variant="light" 
            color="yellow" 
            className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20"
            onClick={() => setIsPauseModalOpen(true)}
          >
            Pause
          </Button>
        ) : (
          <Button 
            variant="light" 
            color="green" 
            className="flex-1 bg-[#0ECB81]/10 hover:bg-[#0ECB81]/20 text-[#0ECB81] border border-[#0ECB81]/20"
            onClick={onResume}
          >
            Resume
          </Button>
        )}
        <Button 
          variant="light" 
          color="red" 
          className="flex-1 bg-[#F6465D]/10 hover:bg-[#F6465D]/20 text-[#F6465D] border border-[#F6465D]/20"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          Delete
        </Button>
      </div>

      {/* Pause Modal */}
      <Modal
        opened={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
        title="Pause Ad?"
        centered
        classNames={{
          content: "bg-gray-900 text-white",
          header: "bg-gray-900 text-white border-b border-white/10",
          title: "text-lg font-bold text-white",
          close: "text-white hover:bg-white/10"
        }}
      >
        <div className="py-2 flex flex-col gap-4">
          <p className="text-white/80">
            Your ad will be hidden from the marketplace. Active orders will continue until complete.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="light" color="gray" className="flex-1 bg-white/5 hover:bg-white/10 text-white" onClick={() => setIsPauseModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => { setIsPauseModalOpen(false); onPause(); }}
            >
              Pause Ad
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Ad?"
        centered
        classNames={{
          content: "bg-gray-900 text-white",
          header: "bg-gray-900 text-white border-b border-white/10",
          title: "text-lg font-bold text-[#F6465D]",
          close: "text-white hover:bg-white/10"
        }}
      >
        <div className="py-2 flex flex-col gap-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-sm text-yellow-500/90">
            <p className="font-bold mb-1">⚠️ Are you sure? This cannot be undone.</p>
            <p>Any locked crypto will be returned to your Funding Account.</p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="light" color="gray" className="flex-1 bg-white/5 hover:bg-white/10 text-white" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-[#F6465D] hover:bg-[#F6465D]/90 text-white"
              onClick={() => { setIsDeleteModalOpen(false); onDelete(); }}
            >
              Delete Ad
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
