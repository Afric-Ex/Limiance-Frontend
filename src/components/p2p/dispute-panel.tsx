"use client";

import React, { useState } from "react";
import { Drawer, Radio, Textarea, Button, FileInput, Checkbox, Loader } from "@mantine/core";
import { MdUploadFile } from "react-icons/md";
import { useUpdateMatchedOrder } from "@/src/hooks/p2p/use-p2p";

interface DisputePanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** The matched-order ID — used as the body key for PATCH /update_matched_order */
  orderMatchId: string;
  /** Called after the dispute is successfully submitted */
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
        status: "DISPUTED",
        reason,
        description,
      },
      {
        onSuccess: () => {
          // Reset form
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
        content: "bg-gray-900 text-white",
        header: "bg-gray-900 text-white border-b border-white/10",
        title: "text-lg font-bold",
        close: "text-white hover:bg-white/10",
      }}
    >
      <div className="flex flex-col gap-6 pt-4">
        <div>
          <div className="text-white/50 text-sm mb-1">Order ID</div>
          <div className="font-mono text-white text-sm break-all">{orderMatchId}</div>
        </div>

        <div>
          <div className="text-white font-medium mb-3">Reason</div>
          <Radio.Group
            value={reason}
            onChange={setReason}
            classNames={{ root: "flex flex-col gap-3" }}
          >
            <Radio value="payment_not_received" label="Payment not received" color="blue" />
            <Radio value="payment_incorrect"    label="Payment amount incorrect" color="blue" />
            <Radio value="seller_unresponsive"  label="Seller not responding" color="blue" />
            <Radio value="buyer_unresponsive"   label="Buyer not responding" color="blue" />
            <Radio value="fraud"                label="Suspected fraud" color="blue" />
            <Radio value="other"                label="Other" color="blue" />
          </Radio.Group>
        </div>

        <div>
          <div className="text-white font-medium mb-2">Description</div>
          <Textarea
            placeholder="Describe the issue in detail..."
            minRows={4}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            classNames={{
              input: "bg-black/40 border-white/10 text-white focus:border-primary",
            }}
          />
          <div className="text-right text-xs text-white/40 mt-1">
            {description.length} characters (min 20)
          </div>
        </div>

        <div>
          <div className="text-white font-medium mb-2">Evidence (Optional)</div>
          <FileInput
            multiple
            placeholder="Upload Screenshots"
            accept="image/png,image/jpeg"
            leftSection={<MdUploadFile size={18} />}
            value={files}
            onChange={setFiles}
            classNames={{
              input: "bg-black/40 border-white/10 text-white hover:border-white/20 focus:border-primary cursor-pointer",
            }}
          />
          <div className="text-xs text-white/40 mt-1">Max 5 files, up to 5MB each</div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {files.map((file, i) => (
                <div key={i} className="bg-white/10 text-xs px-2 py-1 rounded">
                  {file.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full h-px bg-white/10 my-2" />

        <Checkbox
          label="By submitting this dispute, you agree to cooperate with Limiance's review process and provide further evidence if requested."
          checked={agreed}
          onChange={(e) => setAgreed(e.currentTarget.checked)}
          color="blue"
          classNames={{
            label: "text-white/70 text-sm leading-tight",
            body: "items-start",
          }}
        />

        <div className="flex gap-3 mt-4">
          <Button
            variant="light"
            color="gray"
            className="flex-1 bg-white/5 hover:bg-white/10 text-white"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#F6465D] hover:bg-[#F6465D]/90 text-white"
            disabled={!reason || description.length < 20 || !agreed || isPending}
            onClick={handleSubmit}
            leftSection={isPending ? <Loader size={14} color="white" /> : null}
          >
            {isPending ? "Submitting..." : "Submit Dispute"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
