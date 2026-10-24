"use client";

import React, { useState } from "react";
import { ActionIcon, Textarea } from "@mantine/core";
import { MdSend } from "react-icons/md";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSendMessage, onTypingChange, disabled }: ChatInputProps) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (disabled) return;
    if (text.trim()) {
      onSendMessage(text.trim());
      onTypingChange?.(false);
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-white/[0.07] p-3 bg-black/30 rounded-b-xl flex flex-col gap-2 relative">
      <div className="flex items-end gap-2">
        <Textarea
          className="flex-1"
          placeholder="Type a message to counterparty..."
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
          disabled={disabled || !text.trim()}
          onClick={handleSend}
        >
          <MdSend size={16} />
        </ActionIcon>
      </div>
    </div>
  );
};