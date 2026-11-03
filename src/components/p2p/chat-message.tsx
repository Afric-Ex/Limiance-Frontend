"use client";

import React, { useState } from "react";
import { ImageLightbox } from "./image-lightbox";
import { MdDoneAll, MdInsertDriveFile, MdDownload } from "react-icons/md";
import { formatChatTime } from "@/src/lib/chat-date";

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
      <div className="flex justify-center my-2">
        <div className="bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-md text-micro text-white/50 text-center">
          {message.content}
        </div>
      </div>
    );
  }

  const formatTime = (value: unknown) => formatChatTime(value) || "—";

  const rawContent = message.content || "";
  let extractedImageUrl = message.imageUrl;
  let textContent = rawContent;
  let pdfDataUrl = "";

  if (!extractedImageUrl) {
    if (rawContent.startsWith("data:image/")) {
      extractedImageUrl = rawContent;
      textContent = "";
    } else if (rawContent.includes("data:image/")) {
      const idx = rawContent.indexOf("data:image/");
      textContent = rawContent.slice(0, idx).trim();
      extractedImageUrl = rawContent.slice(idx).trim();
    } else if (rawContent.startsWith("data:application/pdf")) {
      pdfDataUrl = rawContent;
      textContent = "";
    } else if (rawContent.includes("data:application/pdf")) {
      const idx = rawContent.indexOf("data:application/pdf");
      textContent = rawContent.slice(0, idx).trim();
      pdfDataUrl = rawContent.slice(idx).trim();
    }
  }

  const hasImage = Boolean(extractedImageUrl || message.type === "image");
  const displayImage = extractedImageUrl || message.imageUrl;

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
            {textContent ? (
              <p className="whitespace-pre-wrap break-words mb-2">{textContent}</p>
            ) : null}

            {hasImage && displayImage ? (
              <div
                className="w-48 h-48 rounded-lg overflow-hidden cursor-pointer relative bg-black/40 group border border-white/10"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={displayImage}
                  alt="Chat attachment"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/60 px-2 py-1 rounded">
                    View
                  </span>
                </div>
              </div>
            ) : null}

            {pdfDataUrl ? (
              <a
                href={pdfDataUrl}
                download="payment_receipt.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 text-white transition-colors"
              >
                <MdInsertDriveFile size={22} className="text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">Payment Receipt (PDF)</div>
                  <div className="text-2xs text-white/60">Click to view/download</div>
                </div>
                <MdDownload size={16} className="text-white/70" />
              </a>
            ) : null}

            {!hasImage && !pdfDataUrl && !textContent ? (
              <p className="whitespace-pre-wrap break-words">{rawContent}</p>
            ) : null}

            <div
              className={`text-2xs font-mono mt-1 flex items-center gap-1 ${
                isOwn ? "justify-end text-white/70" : "justify-start text-white/40"
              }`}
            >
              <span>{formatTime(message.createdAt)}</span>
              {isOwn && delivered && <MdDoneAll size={12} className="text-white/80" />}
            </div>
          </div>
        </div>
      </div>

      {displayImage && (
        <ImageLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={displayImage}
        />
      )}
    </>
  );
};
