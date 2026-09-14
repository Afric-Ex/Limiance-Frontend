"use client";

import React from "react";
import { Modal, Button } from "@mantine/core";
import { useRouter } from "next/navigation";
import { MdSecurity, MdSpeed, MdSupportAgent } from "react-icons/md";

interface NonAdvertiserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NonAdvertiserModal = ({ isOpen, onClose }: NonAdvertiserModalProps) => {
  const router = useRouter();

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Become a P2P Advertiser"
      centered
      size="lg"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      classNames={{
        content: "bg-gray-900 text-white border border-blue-500/20",
        header: "bg-gray-900 text-white border-b border-white/10",
        title: "text-xl font-bold text-white",
        close: "text-white hover:bg-white/10"
      }}
    >
      <div className="flex flex-col py-4 gap-6">
        <p className="text-white/80">
          To post your own P2P ads and set your own prices, you need to apply to become a Limiance P2P Advertiser.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 mt-1">
              <MdSecurity size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Set Your Own Terms</h4>
              <p className="text-white/60 text-sm">Create Buy and Sell ads with your preferred payment methods and price limits.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 mt-1">
              <MdSpeed size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Zero Fees</h4>
              <p className="text-white/60 text-sm">Enjoy zero fees as a verified maker on the Limiance P2P platform.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center shrink-0 mt-1">
              <MdSupportAgent size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Dedicated Support</h4>
              <p className="text-white/60 text-sm">Get priority access to customer support and dispute resolution.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="light" color="gray" size="lg" className="flex-1 bg-white/5 hover:bg-white/10 text-white" onClick={() => router.push("/trades/p2p")}>
            Back to Market
          </Button>
          <Button 
            size="lg"
            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              onClose();
              router.push("/trades/p2p/advertiser/register");
            }}
          >
            Apply Now
          </Button>
        </div>
      </div>
    </Modal>
  );
};
