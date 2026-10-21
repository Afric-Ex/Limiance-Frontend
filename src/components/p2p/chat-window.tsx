"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { ActionIcon, Badge, Tooltip, Loader } from "@mantine/core";
import { MdWarning } from "react-icons/md";
import { useFetchChats, useSendChatMessage } from "@/src/hooks/p2p/use-p2p";
import { useChatWs, useTypingIndicator } from "@/src/hooks/use-chat-ws";
import { p2pKey } from "@/src/services/p2p";
import { P2PChatMessage } from "@/src/types/p2p";
import type { ChatWsMessage } from "@/src/lib/chat-ws";

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
}

export const ChatWindow = ({ chatId, currentUserId }: ChatWindowProps) => {
  const queryClient = useQueryClient();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                createdAt: message.createdAt,
              },
            ],
          };
        }
      );
    },
    [chatId, queryClient]
  );

  const { connected } = useChatWs(chatId, {
    onMessage: handleIncomingMessage,
    onTyping,
  });

  // WebSocket pushes are the live source. Poll only as a fallback while the
  // socket is down, and reconcile once on reconnect to pick up missed messages.
  const { data: chatsData, isLoading } = useFetchChats(chatId, {
    refetchInterval: connected ? false : 30_000,
  });
  const wasConnectedRef = useRef(connected);
  useEffect(() => {
    if (connected && !wasConnectedRef.current) {
      queryClient.invalidateQueries({ queryKey: p2pKey.chatMessages(chatId) });
    }
    wasConnectedRef.current = connected;
  }, [connected, chatId, queryClient]);
  const { mutate: sendMessage, isPending: isSending } = useSendChatMessage();

  const messages: P2PChatMessage[] = useMemo(
    () => chatsData?.data ?? [],
    [chatsData]
  );

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
              : "Reconnecting — messages keep refreshing in the background."}
          </div>
        </div>

        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Loader color="yellow" size="sm" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-white/30 text-sm">
            <div className="text-4xl mb-2 opacity-50">💬</div>
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map(msg => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              isOwn={msg.senderId === currentUserId} 
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
