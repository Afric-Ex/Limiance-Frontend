"use client";

import React, { useState } from "react";
import { Modal, Button, Textarea } from "@mantine/core";

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  username: string;
}

export const BlockUserModal = ({ isOpen, onClose, onConfirm, username }: BlockUserModalProps) => {
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason("");
  };

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title="Block Counterparty"
      centered
      classNames={{
        content: "!bg-[#181a20] !border !border-white/[0.08] !text-white !rounded-xl",
        header: "!bg-[#181a20] !border-b !border-white/[0.06] !text-white",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <p className="text-white/80 text-xs">
          Are you sure you want to block <strong className="text-white">{username}</strong>?
        </p>

        <ul className="list-disc pl-5 text-xs text-white/50 space-y-1">
          <li>You will no longer see their advertisements in the marketplace.</li>
          <li>They will not be able to interact with or place orders on your ads.</li>
          <li>Direct chat messaging with this user will be disabled.</li>
        </ul>

        <Textarea
          placeholder="Reason for blocking (optional)"
          minRows={2}
          value={reason}
          onChange={(event) => setReason(event.currentTarget.value)}
          classNames={{
            input:
              "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-[#F6465D]/60 !rounded-lg !text-xs !p-3",
          }}
        />

        <div className="flex gap-2.5 mt-2">
          <Button
            variant="subtle"
            className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 !bg-[#F6465D] hover:!bg-[#F6465D]/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            onClick={handleConfirm}
          >
            Block User
          </Button>
        </div>
      </div>
    </Modal>
  );
};
