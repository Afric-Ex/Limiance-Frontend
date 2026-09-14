"use client";

import React from "react";
import { Modal } from "@mantine/core";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export const ImageLightbox = ({ isOpen, onClose, imageUrl }: ImageLightboxProps) => {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      fullScreen
      withCloseButton={true}
      classNames={{
        content: "bg-black/95",
        header: "bg-transparent",
        close: "text-white hover:bg-white/10 w-10 h-10 mt-4 mr-4"
      }}
    >
      <div className="flex items-center justify-center h-full w-full p-4">
        <img 
          src={imageUrl} 
          alt="Full screen preview" 
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </Modal>
  );
};
