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
        content: "!bg-[#181a20] !border !border-white/[0.08] !text-white !rounded-xl",
        header: "!bg-[#181a20] !border-b !border-white/[0.06] !text-white",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <p className="text-xs text-white/70">
          Tell us why you are reporting <strong className="text-white">{username}</strong>.
        </p>

        <Select
          label="Reason"
          data={reportReasons}
          value={reason}
          onChange={setReason}
          allowDeselect={false}
          classNames={{
            label: "!text-white/60 !mb-1.5 !text-xs font-medium",
            input:
              "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-primary/50 !h-10 !rounded-lg !text-xs",
            dropdown: "!bg-[#181a20] !border !border-white/[0.09] !text-white !rounded-lg !shadow-2xl",
            option:
              "hover:!bg-white/[0.08] data-[combobox-selected]:!bg-primary/20 data-[combobox-selected]:!text-primary !rounded-md !mx-1 !my-0.5 !text-xs !transition-colors",
          }}
        />

        <Textarea
          label="Additional Details"
          placeholder="Provide any context or evidence..."
          minRows={3}
          value={details}
          onChange={(event) => setDetails(event.currentTarget.value)}
          classNames={{
            label: "!text-white/60 !mb-1.5 !text-xs font-medium",
            input:
              "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-primary/50 !rounded-lg !text-xs !p-3",
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
            className="flex-1 !bg-primary hover:!bg-primary/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
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
