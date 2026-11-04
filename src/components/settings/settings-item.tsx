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
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#1a1d25] to-[#14161c] shadow-[0_12px_36px_rgba(0,0,0,0.16)] transition-colors duration-300 hover:border-white/[0.12]">
      {isGroup ? (
        <div className="divide-y divide-white/[0.07]">
          {React.Children.map(children, (child) => (
            <div className="p-6 max-[1150px]:p-5 max-[640px]:p-4">{child}</div>
          ))}
        </div>
      ) : (
        <div className="p-6 max-[1150px]:p-5 max-[640px]:p-4">{children}</div>
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
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(150px,auto)_auto] items-center gap-x-8 gap-y-4 max-[900px]:grid-cols-[minmax(0,1fr)_auto] max-[900px]:gap-x-5 max-[640px]:grid-cols-1 max-[640px]:gap-3">
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-white/95">{title}</h2>
        <p className={clsx(descMaxWidth, "text-[13px] leading-5 text-white/50 max-[1150px]:max-w-full")}>
          {description}
        </p>
      </div>
      <div className="flex min-w-0 items-center justify-start max-[640px]:order-2">
        {rightSection && (
          <div className="max-w-[280px] text-sm font-medium leading-5 text-white/75 max-[640px]:max-w-full">
            {rightSection}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end max-[640px]:order-3 max-[640px]:justify-start">
        <Button
          variant="primary"
          size="small"
          className="min-w-[76px] shrink-0"
          aria-label={`${buttonText} ${title}`}
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
