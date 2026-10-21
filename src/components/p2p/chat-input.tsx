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
    <div className="border-t border-white/10 p-4 bg-black/20 rounded-b-xl flex flex-col gap-2 relative">
      <div className="flex items-end gap-2">
        <Textarea
          className="flex-1"
          placeholder="Type a message..."
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
            input: "bg-black/40 border-white/10 text-white focus:border-primary resize-none"
          }}
        />

        <ActionIcon 
          size="lg" 
          variant="filled"
          className="mb-1 bg-emerald-500 hover:bg-emerald-400 text-white disabled:bg-emerald-500/20 disabled:text-white/20"
          disabled={disabled || !text.trim()}
          onClick={handleSend}
        >
          <MdSend size={20} />
        </ActionIcon>
      </div>
    </div>
  );
};
