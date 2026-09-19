"use client";

import React, { ReactNode } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import clsx from "clsx";
import { modals } from "@mantine/modals";
import { SettingsModalContainer } from "./settings-modal-container";
import { Button } from "@/src/components/ui/button";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";

interface Props {
  title: string;
  description: string;
  rightSection?: ReactNode;
  modal: ReactNode;
  buttonText: string;
  descMaxWidth: string;
  withArrow: boolean;
  withContainer?: boolean;
}

export const SettingsItem = ({ withContainer = true, ...props }: Props) => {
  return withContainer ? (
    <SettingsItemContainer>
      <Setting {...props} />
    </SettingsItemContainer>
  ) : (
    <Setting {...props} />
  );
};

export const SettingsItemContainer = ({
  children,
  isGroup,
}: {
  children: ReactNode;
  isGroup?: boolean;
}) => {
  return (
    <div className="bg-[#181a20] border border-white/[0.06] rounded-2xl overflow-hidden transition-colors duration-300 hover:border-white/[0.12]">
      {isGroup ? (
        <div className="divide-y divide-white/[0.06]">
          {React.Children.map(children, (child) => (
            <div className="p-6 max-[1150px]:p-4">{child}</div>
          ))}
        </div>
      ) : (
        <div className="p-6 max-[1150px]:p-4">{children}</div>
      )}
    </div>
  );
};

const Setting = ({
  title,
  description,
  rightSection,
  buttonText,
  withArrow,
  descMaxWidth,
  modal,
}: Props) => {
  return (
    <div className="flex justify-between items-center gap-7 max-[1150px]:flex-col max-[1150px]:items-start max-[1150px]:gap-4">
      <div className="flex flex-col gap-4 max-[1150px]:gap-2">
        <h2 className="text-base font-bold text-white/90">{title}</h2>
        <p className={clsx(descMaxWidth, "text-sm text-white/55 max-[1150px]:max-w-full")}>
          {description}
        </p>
      </div>
      <div className="flex items-center gap-7 max-[1150px]:w-full max-[1150px]:justify-between max-[1150px]:gap-4">
        {rightSection}
        <Button
          variant="primary"
          size="small"
          className="shrink-0"
          onClick={() =>
            modals.open({
              children: (
                <SettingsModalContainer>{modal}</SettingsModalContainer>
              ),
              ...DEFAULT_MODAL_SETTINGS,
            })
          }
        >
          {buttonText}
          {withArrow && <MdKeyboardArrowDown />}
        </Button>
      </div>
    </div>
  );
};
