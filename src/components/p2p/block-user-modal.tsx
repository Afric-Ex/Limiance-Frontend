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
      title="Block User"
      centered
      classNames={{
        content: "bg-gray-900 text-white",
        header: "bg-gray-900 text-white border-b border-white/10",
        title: "text-lg font-bold text-[#F6465D]",
        close: "text-white hover:bg-white/10"
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <p className="text-white/80">
          Are you sure you want to block <strong className="text-white">{username}</strong>?
        </p>
        
        <ul className="list-disc pl-5 text-sm text-white/60 mb-2">
          <li>You will no longer see their ads.</li>
          <li>They will not be able to interact with your ads.</li>
          <li>You cannot send them direct messages.</li>
        </ul>

        <Textarea
          placeholder="Reason for blocking (optional)"
          minRows={2}
          value={reason}
          onChange={(event) => setReason(event.currentTarget.value)}
          classNames={{
            input: "bg-black/40 border-white/10 text-white focus:border-[#F6465D]"
          }}
        />

        <div className="flex gap-3 mt-4">
          <Button variant="light" color="gray" className="flex-1 bg-white/5 hover:bg-white/10 text-white" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-[#F6465D] hover:bg-[#F6465D]/90 text-white"
            onClick={handleConfirm}
          >
            Block User
          </Button>
        </div>
      </div>
    </Modal>
  );
};
