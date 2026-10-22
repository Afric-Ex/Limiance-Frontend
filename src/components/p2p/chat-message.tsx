"use client";

import React, { useState } from "react";
import { ImageLightbox } from "./image-lightbox";
import { MdDoneAll } from "react-icons/md";
import { formatChatTime } from "@/src/lib/chat-date";

// Image/system flags are optional; system messages are also inferred from
// senderId so the live frames and history render consistently.
interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    senderName?: string;
    createdAt: string;
    type?: "text" | "system" | "image";
    imageUrl?: string;
  };
  isOwn: boolean;
  delivered?: boolean;
}

export const ChatMessage = ({ message, isOwn, delivered }: ChatMessageProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isSystem =
    message.type === "system" ||
    message.senderId?.trim().toUpperCase() === "SYSTEM";

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="max-w-[85%] rounded-2xl border border-primary/25 bg-primary/10 px-4 py-2 text-center shadow-sm">
          <div className="mb-1 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <span>{message.senderName || "Limiance Support"}</span>
            <span className="rounded bg-primary/20 px-1 py-0.5 text-[8px] tracking-normal">
              System
            </span>
          </div>
          <p className="whitespace-pre-wrap break-words text-xs text-white/80">
            {message.content}
          </p>
          <div className="mt-1 text-[10px] text-white/40">
            {formatChatTime(message.createdAt)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`flex w-full mb-4 ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          
          {!isOwn && message.senderName && (
            <span className="mb-1 px-1 text-[10px] font-medium text-white/45">
              {message.senderName}
            </span>
          )}

          <div className={`px-4 py-2 rounded-2xl relative group shadow-md ${
            isOwn 
              ? "bg-gradient-to-br from-[#0ECB81] to-emerald-600 text-white rounded-br-sm shadow-[0_4px_15px_rgba(14,203,129,0.3)]" 
              : "bg-white/10 backdrop-blur-md border border-white/5 text-white rounded-bl-sm"
          }`}>
            
            {message.type === "image" && message.imageUrl ? (
              <div 
                className="w-48 h-48 rounded-lg overflow-hidden cursor-pointer relative"
                onClick={() => setLightboxOpen(true)}
              >
                <img src={message.imageUrl} alt="Chat attachment" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-2 py-1 rounded">View</span>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            <div className={`text-[10px] mt-1 flex items-center gap-1 ${isOwn ? "justify-end text-white/70" : "justify-start text-white/50"}`}>
              {formatChatTime(message.createdAt)}
              {isOwn && delivered && <MdDoneAll size={12} className="text-green-400" />}
            </div>

          </div>

        </div>
      </div>

      {message.type === "image" && message.imageUrl && (
        <ImageLightbox 
          isOpen={lightboxOpen} 
          onClose={() => setLightboxOpen(false)} 
          imageUrl={message.imageUrl} 
        />
      )}
    </>
  );
};
