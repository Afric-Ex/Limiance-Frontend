"use client";

import React, { useRef, useState } from "react";
import { Drawer, Radio, Textarea, Button, Checkbox, ActionIcon } from "@mantine/core";
import { MdUploadFile, MdClose, MdInsertDriveFile } from "react-icons/md";
import { useUpdateMatchedOrder } from "@/src/hooks/p2p/use-p2p";
import { P2PMatchStatus } from "@/src/lib/status-constants";
import { convertFileToBase64 } from "@/src/lib/convert-file-to-base64";
import toast from "react-hot-toast";

interface FileEntry {
  file: File;
  previewUrl: string;
}

interface DisputePanelProps {
  isOpen: boolean;
  onClose: () => void;
  orderMatchId: string;
  onSuccess?: () => void;
}

export const DisputePanel = ({ isOpen, onClose, orderMatchId, onSuccess }: DisputePanelProps) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: updateStatus, isPending } = useUpdateMatchedOrder();

  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    const newEntries: FileEntry[] = [];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 5MB size limit.`);
        continue;
      }
      // Check if already in list
      const exists = fileEntries.some(
        (f) => f.file.name === file.name && f.file.size === file.size
      );
      if (exists) continue;

      if (fileEntries.length + newEntries.length >= 5) {
        toast.error("You can upload a maximum of 5 files.");
        break;
      }

      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : "";
      newEntries.push({ file, previewUrl });
    }

    if (newEntries.length > 0) {
      setFileEntries((prev) => [...prev, ...newEntries]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFileEntries((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!reason || description.length < 20 || !agreed) return;

    try {
      setIsProcessingFiles(true);
      const evidenceBase64List: string[] = [];

      for (const entry of fileEntries) {
        try {
          const b64 = await convertFileToBase64(entry.file);
          evidenceBase64List.push(b64);
        } catch {
          // ignore individual read errors
        }
      }

      updateStatus(
        {
          orderMatchId,
          status: P2PMatchStatus.DISPUTED,
          reason,
          description,
          evidence: evidenceBase64List,
        },
        {
          onSuccess: () => {
            setReason("");
            setDescription("");
            fileEntries.forEach((entry) => {
              if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
            });
            setFileEntries([]);
            setAgreed(false);
            onSuccess?.();
            onClose();
          },
        }
      );
    } catch {
      toast.error("Failed to process dispute evidence files.");
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const isSubmitting = isPending || isProcessingFiles;

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
          <div className="text-white/40 text-2xs uppercase tracking-wider mb-0.5">Order Match ID</div>
          <div className="font-mono text-white text-xs truncate">{orderMatchId}</div>
        </div>

        <div>
          <div className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2.5">Dispute Reason</div>
          <Radio.Group value={reason} onChange={setReason} classNames={{ root: "flex flex-col gap-2.5" }}>
            <Radio value="payment_not_received" label="Payment not received" color="blue" classNames={{ label: "!text-white/80 !text-xs cursor-pointer" }} />
            <Radio value="payment_incorrect" label="Payment amount incorrect" color="blue" classNames={{ label: "!text-white/80 !text-xs cursor-pointer" }} />
            <Radio value="seller_unresponsive" label="Seller not responding" color="blue" classNames={{ label: "!text-white/80 !text-xs cursor-pointer" }} />
            <Radio value="buyer_unresponsive" label="Buyer not responding" color="blue" classNames={{ label: "!text-white/80 !text-xs cursor-pointer" }} />
            <Radio value="fraud" label="Suspected fraudulent activity" color="blue" classNames={{ label: "!text-white/80 !text-xs cursor-pointer" }} />
            <Radio value="other" label="Other issue" color="blue" classNames={{ label: "!text-white/80 !text-xs cursor-pointer" }} />
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
          <div className="text-right text-2xs text-white/35 mt-1">
            {description.length} characters (min 20)
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">
              Evidence / Receipts (Optional)
            </span>
            <span className="text-2xs text-white/40">{fileEntries.length}/5 files</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
            className="hidden"
            onChange={handleFilesChosen}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={fileEntries.length >= 5 || isSubmitting}
            className="w-full h-11 border border-dashed border-white/20 hover:border-white/40 disabled:border-white/10 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2 bg-white/[0.02] hover:bg-white/[0.05] text-xs text-white/70 transition-colors cursor-pointer"
          >
            <MdUploadFile size={18} className="text-primary" />
            <span>Click to upload screenshots or payment receipts (PNG, JPG, PDF)</span>
          </button>
          <div className="text-2xs text-white/35 mt-1">Max 5 files, up to 5MB each</div>

          {fileEntries.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {fileEntries.map((entry, i) => (
                <div
                  key={i}
                  className="bg-white/[0.04] border border-white/[0.08] p-2 rounded-lg flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {entry.previewUrl ? (
                      <img
                        src={entry.previewUrl}
                        alt="preview"
                        className="w-8 h-8 rounded object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <MdInsertDriveFile size={24} className="text-red-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs text-white/90 truncate font-medium">
                        {entry.file.name}
                      </div>
                      <div className="text-2xs text-white/40">
                        {(entry.file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    className="!text-white/40 hover:!text-white hover:!bg-white/[0.08]"
                    onClick={() => removeFile(i)}
                  >
                    <MdClose size={16} />
                  </ActionIcon>
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
            label: "!text-white/70 !text-xs leading-normal cursor-pointer",
            body: "items-start",
          }}
        />

        <div className="flex gap-2.5 mt-1">
          <Button
            variant="subtle"
            className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 !bg-[#F6465D] hover:!bg-[#F6465D]/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            disabled={!reason || description.length < 20 || !agreed || isSubmitting}
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            Submit Dispute
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
