"use client";

import React from "react";
import { Drawer } from "@mantine/core";

export interface MobileBottomSheetProps {
  opened: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  opened,
  onClose,
  title,
  children,
}) => {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="auto"
      withCloseButton={false}
      classNames={{
        content: "!bg-[#181a20] !rounded-t-3xl !border-t !border-t-white/[0.08]",
        body: "!p-0"
      }}
    >
      <div className="flex flex-col max-h-[85vh]">
        {/* Drag Handle */}
        <div className="w-full flex justify-center py-3">
          <div className="w-12 h-1 rounded-full bg-white/20" />
        </div>
        
        {/* Title */}
        {title && (
          <div className="px-5 pb-3">
            <h3 className="text-lg font-bold text-white/90">{title}</h3>
          </div>
        )}
        
        {/* Body */}
        <div className="overflow-y-auto px-5 pb-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </Drawer>
  );
};
