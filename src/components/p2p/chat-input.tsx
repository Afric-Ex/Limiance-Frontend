"use client";

import React, { useRef, useState } from "react";
import { ActionIcon, Textarea, Tooltip } from "@mantine/core";
import { MdSend, MdAttachFile, MdClose, MdInsertDriveFile } from "react-icons/md";
import { convertFileToBase64 } from "@/src/lib/convert-file-to-base64";
import toast from "react-hot-toast";

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSendMessage, onTypingChange, disabled }: ChatInputProps) => {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<AttachedFile | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsReadingFile(true);
      const dataUrl = await convertFileToBase64(file);
      setAttachment({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
      });
    } catch {
      toast.error("Failed to read selected file");
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = () => {
    if (disabled || isReadingFile) return;

    const trimmed = text.trim();
    if (!trimmed && !attachment) return;

    let messageContent = trimmed;
    if (attachment) {
      messageContent = trimmed ? `${trimmed}\n${attachment.dataUrl}` : attachment.dataUrl;
    }

    onSendMessage(messageContent);
    onTypingChange?.(false);
    setText("");
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !disabled && !isReadingFile && (Boolean(text.trim()) || Boolean(attachment));

  return (
    <div className="border-t border-white/[0.07] p-3 bg-black/30 rounded-b-xl flex flex-col gap-2 relative">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      {attachment && (
        <div className="flex items-center gap-2.5 bg-white/[0.06] border border-white/10 px-3 py-2 rounded-lg max-w-sm">
          {attachment.type.startsWith("image/") ? (
            <img
              src={attachment.dataUrl}
              alt="attachment preview"
              className="w-10 h-10 object-cover rounded border border-white/10 shrink-0"
            />
          ) : (
            <MdInsertDriveFile size={26} className="text-red-400 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{attachment.name}</div>
            <div className="text-white/40 text-2xs">
              {(attachment.size / 1024).toFixed(1)} KB
            </div>
          </div>

          <ActionIcon
            size="sm"
            variant="subtle"
            className="!text-white/50 hover:!text-white hover:!bg-white/10"
            onClick={removeAttachment}
          >
            <MdClose size={16} />
          </ActionIcon>
        </div>
      )}

      <div className="flex items-end gap-2">
        <Tooltip label="Attach image or receipt (Max 5MB)" withArrow position="top">
          <ActionIcon
            size="md"
            variant="subtle"
            className="mb-0.5 !text-white/60 hover:!text-white hover:!bg-white/[0.08] !rounded-lg !w-9 !h-9"
            disabled={disabled || isReadingFile}
            onClick={() => fileInputRef.current?.click()}
          >
            <MdAttachFile size={20} />
          </ActionIcon>
        </Tooltip>

        <Textarea
          className="flex-1"
          placeholder={attachment ? "Add a message (optional)..." : "Type a message to counterparty..."}
          minRows={1}
          maxRows={4}
          autosize
          value={text}
          onChange={(e) => {
            const value = e.currentTarget.value;
            setText(value);
            onTypingChange?.(value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          classNames={{
            input:
              "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.15] focus:!border-primary/60 !text-white !text-xs !rounded-lg !p-2.5 resize-none placeholder:!text-white/20",
          }}
        />

        <ActionIcon
          size="md"
          variant="filled"
          className="mb-0.5 !bg-primary hover:!bg-primary/90 !text-white disabled:!bg-white/[0.05] disabled:!text-white/20 !rounded-lg !w-9 !h-9"
          disabled={!canSend}
          onClick={handleSend}
        >
          <MdSend size={16} />
        </ActionIcon>
      </div>
    </div>
  );
};
