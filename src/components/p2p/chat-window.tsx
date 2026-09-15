"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { ActionIcon, Badge, Tooltip, Loader } from "@mantine/core";
import { MdWarning } from "react-icons/md";
import { useFetchChats, useSendChatMessage } from "@/src/hooks/p2p/use-p2p";
import { P2PChatMessage } from "@/src/types/p2p";
import toast from "react-hot-toast";

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
}

export const ChatWindow = ({ chatId, currentUserId }: ChatWindowProps) => {
  const [isTyping, setIsTyping] = useState(false); // Mock typing for now until WS is fully integrated
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for messages every 3 seconds to simulate real-time chat
  const { data: chatsData, isLoading, refetch } = useFetchChats(chatId);
  const { mutate: sendMessage, isPending: isSending } = useSendChatMessage();

  // If we had a websocket connection state
  const isConnected = true;

  const responseMessages = (chatsData?.data as any)?.data;
  const messages: P2PChatMessage[] = Array.isArray(responseMessages) ? responseMessages : [];

  // Poll interval
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Scroll only the chat container to the bottom — NOT the whole page
  const scrollToBottom = (smooth = true) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    sendMessage(
      { chatId, content },
      {
        onSuccess: () => {
          // Message will appear on next poll, or invalidateQueries handles it
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
          {isConnected ? (
            <Badge color="green" size="sm" variant="dot">Connected</Badge>
          ) : (
            <Badge color="gray" size="sm" variant="dot">Connecting...</Badge>
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
            Chat connected. Messages are end-to-end encrypted.
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
        
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput 
        onSendMessage={handleSendMessage}
        disabled={isSending}
      />
    </div>
  );
};
