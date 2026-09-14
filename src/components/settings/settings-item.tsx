"use client";

import { ReactNode } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import clsx from "clsx";
import { modals } from "@mantine/modals";
import { SettingsModalContainer } from "./settings-modal-container";
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
    <div className="p-10 max-[1150px]:p-4 bg-primary/[0.04] backdrop-blur-md border border-primary/20 rounded-xl transition-all duration-300 hover:bg-primary/[0.06] hover:border-primary/40 hover:shadow-[0_0_20px_rgba(77,119,240,0.1)]">
      {isGroup ? (
        <div className="flex flex-col gap-[10px] max-[1150px]:gap-6">{children}</div>
      ) : (
        children
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
        <h2 className="text-base font-bold">{title}</h2>
        <p className={clsx(descMaxWidth, "text-sm text-white/55 max-[1150px]:max-w-full")}>
          {description}
        </p>
      </div>
      <div className="flex items-center gap-7 max-[1150px]:w-full max-[1150px]:justify-between max-[1150px]:gap-4">
        {rightSection}
        <button
          onClick={() =>
            modals.open({
              children: (
                <SettingsModalContainer>{modal}</SettingsModalContainer>
              ),
              ...DEFAULT_MODAL_SETTINGS,
            })
          }
          className="w-100px text-white h-37px bg-primary rounded flex justify-center items-center gap-2 transition-all hover:bg-primary/90 hover:shadow-[0_0_12px_rgba(77,119,240,0.3)] active:scale-[0.96]"
        >
          <span className="text-sm font-medium">{buttonText}</span>
          {withArrow && <MdKeyboardArrowDown />}
        </button>
      </div>
    </div>
  );
};
