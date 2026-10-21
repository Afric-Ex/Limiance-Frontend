"use client";

import React, { useState } from "react";
import { ImageLightbox } from "./image-lightbox";

// Our backend doesn't support images/system types yet, 
// but we leave room for it if the payload structure changes.
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
}

export const ChatMessage = ({ message, isOwn }: ChatMessageProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (message.type === "system") {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-white/10 px-4 py-1.5 rounded-full text-xs text-white/70 text-center">
          {message.content}
        </div>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className={`flex w-full mb-4 ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          
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
              {formatTime(message.createdAt)}
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
