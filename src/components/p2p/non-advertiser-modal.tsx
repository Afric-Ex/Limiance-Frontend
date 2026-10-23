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
      size="md"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      classNames={{
        content: "!bg-[#181a20] !border !border-white/[0.08] !text-white !rounded-xl",
        header: "!bg-[#181a20] !border-b !border-white/[0.06] !text-white",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col py-3 gap-5">
        <p className="text-white/70 text-xs leading-relaxed">
          To post your own advertisements and set your own prices in the P2P marketplace, apply to become a Limiance
          P2P Advertiser.
        </p>

        <div className="flex flex-col gap-3.5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <MdSecurity size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs mb-0.5">Set Your Own Terms</h4>
              <p className="text-white/45 text-xs leading-normal">
                Create Buy and Sell ads with your preferred payment methods and price limits.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <MdSpeed size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs mb-0.5">Zero Maker Fees</h4>
              <p className="text-white/45 text-xs leading-normal">
                Enjoy zero maker fees across all active listings on Limiance P2P.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <MdSupportAgent size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs mb-0.5">Priority Dispute Handling</h4>
              <p className="text-white/45 text-xs leading-normal">
                Fast-track customer support and dedicated mediation for trade disputes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-2">
          <Button
            variant="subtle"
            className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            onClick={() => router.push("/trades/p2p")}
          >
            Back to Market
          </Button>
          <Button
            className="flex-[1.5] !bg-primary hover:!bg-primary/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
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
