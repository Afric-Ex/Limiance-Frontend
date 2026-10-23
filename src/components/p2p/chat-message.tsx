"use client";

import React, { useState } from "react";
import { ImageLightbox } from "./image-lightbox";
import { MdDoneAll } from "react-icons/md";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    type?: "text" | "system" | "image";
    imageUrl?: string;
  };
  isOwn: boolean;
  delivered?: boolean;
}

export const ChatMessage = ({ message, isOwn, delivered }: ChatMessageProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (message.type === "system") {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-md text-[11px] text-white/50 text-center">
          {message.content}
        </div>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div className={`flex w-full mb-3 ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          <div
            className={`px-3.5 py-2 rounded-xl text-xs leading-relaxed relative ${
              isOwn
                ? "bg-primary text-white rounded-tr-xs"
                : "bg-white/[0.06] border border-white/[0.08] text-white rounded-tl-xs"
            }`}
          >
            {message.type === "image" && message.imageUrl ? (
              <div
                className="w-48 h-48 rounded-lg overflow-hidden cursor-pointer relative"
                onClick={() => setLightboxOpen(true)}
              >
                <img src={message.imageUrl} alt="Chat attachment" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/60 px-2 py-1 rounded">
                    View
                  </span>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            <div
              className={`text-[10px] font-mono mt-1 flex items-center gap-1 ${
                isOwn ? "justify-end text-white/70" : "justify-start text-white/40"
              }`}
            >
              <span>{formatTime(message.createdAt)}</span>
              {isOwn && delivered && <MdDoneAll size={12} className="text-white/80" />}
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