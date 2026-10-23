"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { ActionIcon, Badge, Button, Tooltip, Loader } from "@mantine/core";
import { MdWarning, MdOutlineChat } from "react-icons/md";
import { useFetchChats, useSendChatMessage } from "@/src/hooks/p2p/use-p2p";
import { useChatWs, useTypingIndicator } from "@/src/hooks/use-chat-ws";
import { p2pKey } from "@/src/services/p2p";
import { P2PChatMessage } from "@/src/types/p2p";
import type { ChatWsMessage, ChatDeliveredEvent } from "@/src/lib/chat-ws";
import {
  chatDayKey,
  formatChatDayLabel,
  getChatTimestamp,
} from "@/src/lib/chat-date";

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
}

export const ChatWindow = ({ chatId, currentUserId }: ChatWindowProps) => {
  const queryClient = useQueryClient();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deliveredIds, setDeliveredIds] = useState<Set<string>>(new Set());

  const { peerTyping, onTyping, notifyTyping } = useTypingIndicator(
    chatId,
    currentUserId
  );

  const handleIncomingMessage = useCallback(
    (message: ChatWsMessage) => {
      queryClient.setQueryData<{ data: P2PChatMessage[] }>(
        p2pKey.chatMessages(chatId),
        (current) => {
          const list = current?.data ?? [];
          if (list.some((entry) => entry.id === message.id)) return current;
          return {
            data: [
              ...list,
              {
                id: message.id,
                content: message.content,
                senderId: message.senderId,
                senderName: message.senderName,
                createdAt: message.createdAt,
              },
            ],
          };
        }
      );
    },
    [chatId, queryClient]
  );

  const handleDelivered = useCallback(
    (event: ChatDeliveredEvent) => {
      setDeliveredIds((prev) => {
        const next = new Set(prev);
        next.add(event.chatId + ":" + event.createdAt);
        return next;
      });
    },
    []
  );

  const { connected } = useChatWs(chatId, {
    onMessage: handleIncomingMessage,
    onDelivered: handleDelivered,
    onTyping,
  });

  const {
    data: chatsData,
    isLoading,
    isError,
    refetch,
  } = useFetchChats(chatId);
  const wasConnectedRef = useRef(connected);
  useEffect(() => {
    if (connected && !wasConnectedRef.current) {
      refetch();
    }
    wasConnectedRef.current = connected;
  }, [connected, refetch]);
  const { mutate: sendMessage, isPending: isSending } = useSendChatMessage();

  const messages: P2PChatMessage[] = useMemo(
    () => chatsData?.data ?? [],
    [chatsData]
  );

  const scrollToBottom = (smooth = true) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, peerTyping]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    notifyTyping(false);
    sendMessage(
      { chatId, content },
      {
        onSuccess: () => {
          scrollToBottom();
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#181a20] rounded-xl border border-white/[0.07] overflow-hidden relative">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <span className="text-white font-semibold text-xs uppercase tracking-wider">Order Chat</span>
          {connected ? (
            <Badge size="xs" color="green" variant="dot" className="!bg-buy/10 !text-buy !border !border-buy/20 !font-medium">
              Live
            </Badge>
          ) : (
            <Badge size="xs" color="gray" variant="dot" className="!bg-white/[0.05] !text-white/50 !border !border-white/[0.08] !font-medium">
              Connecting…
            </Badge>
          )}
        </div>
        <Tooltip
          label="Never release crypto before verifying payment receipt directly in your bank app."
          withArrow
          arrowSize={6}
          color="#181a20"
          classNames={{ tooltip: "!text-xs !font-medium !border !border-white/[0.08]" }}
        >
          <ActionIcon variant="subtle" color="yellow" size="sm" className="hover:!bg-white/[0.06]">
            <MdWarning size={16} />
          </ActionIcon>
        </Tooltip>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col relative min-h-[300px]">
        <div className="flex justify-center mb-3">
          <div className="bg-white/[0.03] border border-white/[0.05] px-3 py-1 rounded-md text-[11px] text-white/50 text-center">
            {connected
              ? "Encrypted order chat connected. Real-time messages active."
              : "Connecting to secure order chat…"}
          </div>
        </div>

        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Loader color="blue" size="sm" />
          </div>
        ) : isError && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-white/40 text-xs gap-2.5">
            <span>Unable to load chat history.</span>
            <Button size="xs" variant="subtle" className="!bg-white/[0.05] !border !border-white/[0.08] !text-white !h-7 !text-xs" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-white/30 text-xs gap-1.5 py-8">
            <MdOutlineChat size={28} className="text-white/20 mb-1" />
            <p className="text-white/60 font-medium">No messages yet</p>
            <p className="text-[11px] text-white/30 text-center max-w-xs">
              Coordinate payment details or ask questions directly with the counterparty.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
              delivered={deliveredIds.has(`${chatId}:${msg.createdAt}`)}
            />
          ))
        )}

        {peerTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTypingChange={notifyTyping}
        disabled={isSending}
      />
    </div>
  );
};