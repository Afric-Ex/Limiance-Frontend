"use client";

import React, { useState } from "react";
import { Button, Modal, Select, Textarea } from "@mantine/core";

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { reason: string; details: string }) => void;
  username: string;
  isSubmitting?: boolean;
}

const reportReasons = [
  "Fraud or scam attempt",
  "Abusive behavior",
  "Fake payment proof",
  "Off-platform trading request",
  "Suspicious account activity",
];

export const ReportUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  username,
  isSubmitting = false,
}: ReportUserModalProps) => {
  const [reason, setReason] = useState<string | null>(reportReasons[0]);
  const [details, setDetails] = useState("");

  const handleClose = () => {
    setReason(reportReasons[0]);
    setDetails("");
    onClose();
  };

  const handleSubmit = () => {
    if (!reason) {
      return;
    }

    onSubmit({
      reason,
      details: details.trim(),
    });

    handleClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title="Report User"
      centered
      classNames={{
        content: "bg-gray-900 text-white",
        header: "bg-gray-900 text-white border-b border-white/10",
        title: "text-lg font-bold text-yellow-400",
        close: "text-white hover:bg-white/10",
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <p className="text-sm text-white/80">
          Tell us why you are reporting{" "}
          <strong className="text-white">{username}</strong>.
        </p>

        <Select
          label="Reason"
          data={reportReasons}
          value={reason}
          onChange={setReason}
          allowDeselect={false}
          classNames={{
            label: "!text-white/70 !mb-1.5 !text-sm",
            input:
              "!bg-black/40 !border-white/10 !text-white focus:!border-yellow-400",
            dropdown: "!bg-gray-900 !border !border-white/10",
            option: "!text-white",
          }}
        />

        <Textarea
          label="Additional details"
          placeholder="Add anything useful for review"
          minRows={3}
          value={details}
          onChange={(event) => setDetails(event.currentTarget.value)}
          classNames={{
            label: "!text-white/70 !mb-1.5 !text-sm",
            input:
              "!bg-black/40 !border-white/10 !text-white focus:!border-yellow-400",
          }}
        />

        <div className="flex gap-3 mt-2">
          <Button
            variant="light"
            color="gray"
            className="flex-1 bg-white/5 hover:bg-white/10 text-white"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            Submit Report
          </Button>
        </div>
      </div>
    </Modal>
  );
};
