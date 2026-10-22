"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { ActionIcon, Badge, Button, Tooltip, Loader } from "@mantine/core";
import { MdWarning } from "react-icons/md";
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

  // Chat history is fetched over the socket (get_chat_messages) and kept live
  // by new_chat_message pushes. Refetch only once when the socket reconnects.
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

  // WhatsApp-style timeline: chronological messages with a day divider before
  // the first message of each local day.
  const timeline = useMemo(() => {
    const ordered = messages
      .map((message, index) => ({
        message,
        index,
        time: getChatTimestamp(message.createdAt),
      }))
      .sort((a, b) =>
        a.time === b.time ? a.index - b.index : a.time - b.time
      );

    const items: Array<
      | { kind: "day"; key: string; label: string }
      | { kind: "message"; key: string; message: P2PChatMessage }
    > = [];

    let currentDay: string | null = null;
    ordered.forEach(({ message }, index) => {
      const day = chatDayKey(message.createdAt);
      if (day !== currentDay) {
        currentDay = day;
        items.push({
          kind: "day",
          key: `day-${day}-${index}`,
          label: formatChatDayLabel(message.createdAt),
        });
      }
      items.push({ kind: "message", key: message.id, message });
    });

    return items;
  }, [messages]);

  // Scroll only the chat container to the bottom — NOT the whole page
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
          // The WS delivery push (or the next fallback poll) adds the message.
          scrollToBottom();
        }
      }
    );
  };


  return (
    <div className="flex flex-col h-full bg-elevated/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative">
      {/* Subtle inner highlight */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold">Live Chat</span>
          {connected ? (
            <Badge color="green" size="sm" variant="dot">Connected</Badge>
          ) : (
            <Badge color="gray" size="sm" variant="dot">Reconnecting…</Badge>
          )}
        </div>
        <Tooltip label="Never release crypto before verifying payment in your bank account.">
          <ActionIcon variant="subtle" color="yellow">
            <MdWarning size={20} />
          </ActionIcon>
        </Tooltip>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col relative">
        <div className="flex justify-center my-4">
          <div className="bg-white/10 px-4 py-1.5 rounded-full text-xs text-white/70 text-center">
            {connected
              ? "Live chat connected. Messages update in real time."
              : "Reconnecting to live chat…"}
          </div>
        </div>

        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Loader color="yellow" size="sm" />
          </div>
        ) : isError && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-white/40 text-sm gap-3">
            <span>Could not load chat messages.</span>
            <Button size="xs" variant="light" color="gray" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-white/30 text-sm">
            <div className="text-4xl mb-2 opacity-50">💬</div>
            No messages yet. Say hello!
          </div>
        ) : (
          timeline.map((item) =>
            item.kind === "day" ? (
              <div key={item.key} className="flex justify-center my-4">
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-medium text-white/45">
                  {item.label}
                </span>
              </div>
            ) : (
              <ChatMessage
                key={item.key}
                message={item.message}
                isOwn={item.message.senderId === currentUserId}
                delivered={deliveredIds.has(
                  `${chatId}:${item.message.createdAt}`
                )}
              />
            )
          )
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
