"use client";

import React, { useState } from "react";
import { Drawer, Radio, Textarea, Button, FileInput, Checkbox } from "@mantine/core";
import { MdUploadFile } from "react-icons/md";
import { useUpdateMatchedOrder } from "@/src/hooks/p2p/use-p2p";
import { P2PMatchStatus } from "@/src/lib/status-constants";

interface DisputePanelProps {
  isOpen: boolean;
  onClose: () => void;
  orderMatchId: string;
  onSuccess?: () => void;
}

export const DisputePanel = ({ isOpen, onClose, orderMatchId, onSuccess }: DisputePanelProps) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [agreed, setAgreed] = useState(false);

  const { mutate: updateStatus, isPending } = useUpdateMatchedOrder();

  const handleSubmit = () => {
    updateStatus(
      {
        orderMatchId,
        status: P2PMatchStatus.DISPUTED,
        reason,
        description,
      },
      {
        onSuccess: () => {
          setReason("");
          setDescription("");
          setFiles([]);
          setAgreed(false);
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="right"
      title="File a Dispute"
      size="md"
      classNames={{
        content: "!bg-[#181a20] !text-white",
        header: "!bg-[#181a20] !text-white !border-b !border-white/[0.06]",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col gap-5 pt-3">
        <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.06]">
          <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Order Match ID</div>
          <div className="font-mono text-white text-xs truncate">{orderMatchId}</div>
        </div>

        <div>
          <div className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2.5">Dispute Reason</div>
          <Radio.Group value={reason} onChange={setReason} classNames={{ root: "flex flex-col gap-2.5" }}>
            <Radio value="payment_not_received" label="Payment not received" color="blue" classNames={{ label: "!text-white/80 !text-xs" }} />
            <Radio value="payment_incorrect" label="Payment amount incorrect" color="blue" classNames={{ label: "!text-white/80 !text-xs" }} />
            <Radio value="seller_unresponsive" label="Seller not responding" color="blue" classNames={{ label: "!text-white/80 !text-xs" }} />
            <Radio value="buyer_unresponsive" label="Buyer not responding" color="blue" classNames={{ label: "!text-white/80 !text-xs" }} />
            <Radio value="fraud" label="Suspected fraudulent activity" color="blue" classNames={{ label: "!text-white/80 !text-xs" }} />
            <Radio value="other" label="Other issue" color="blue" classNames={{ label: "!text-white/80 !text-xs" }} />
          </Radio.Group>
        </div>

        <div>
          <div className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5">Description</div>
          <Textarea
            placeholder="Describe the issue in detail (min. 20 characters)..."
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            classNames={{
              input: "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-primary/50 !rounded-lg !text-xs !p-3",
            }}
          />
          <div className="text-right text-[10px] text-white/35 mt-1">
            {description.length} characters (min 20)
          </div>
        </div>

        <div>
          <div className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5">Evidence (Optional)</div>
          <FileInput
            multiple
            placeholder="Upload screenshots (PNG, JPG)"
            accept="image/png,image/jpeg"
            leftSection={<MdUploadFile size={16} />}
            value={files}
            onChange={setFiles}
            classNames={{
              input:
                "!bg-white/[0.04] !border-white/[0.08] !text-white hover:!border-white/[0.14] focus:!border-primary/50 !h-10 !rounded-lg !text-xs cursor-pointer",
            }}
          />
          <div className="text-[10px] text-white/35 mt-1">Max 5 files, up to 5MB each</div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {files.map((file, i) => (
                <div key={i} className="bg-white/[0.05] border border-white/[0.07] text-[11px] text-white/70 px-2 py-0.5 rounded">
                  {file.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full h-px bg-white/[0.06]" />

        <Checkbox
          label="By submitting this dispute, you agree to cooperate with Limiance's dispute resolution and provide further payment evidence upon request."
          checked={agreed}
          onChange={(e) => setAgreed(e.currentTarget.checked)}
          color="blue"
          classNames={{
            label: "!text-white/70 !text-xs leading-normal",
            body: "items-start",
          }}
        />

        <div className="flex gap-2.5 mt-1">
          <Button
            variant="subtle"
            className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 !bg-[#F6465D] hover:!bg-[#F6465D]/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            disabled={!reason || description.length < 20 || !agreed || isPending}
            onClick={handleSubmit}
            loading={isPending}
          >
            Submit Dispute
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
