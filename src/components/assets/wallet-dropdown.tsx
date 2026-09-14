import { Popover, PopoverTarget, PopoverDropdown } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React, { useState } from "react";
import { MdKeyboardArrowRight } from "react-icons/md";

export const WalletDropdown = ({
  setSelectedWallet,
}: {
  selectedWallet?: number;
  setSelectedWallet: any;
}) => {
  const [opened, { toggle, close }] = useDisclosure(false);

  const [selected, setSelected] = useState("Spot");

  return (
    <Popover
      opened={opened}
      onChange={toggle}
      classNames={{ dropdown: "!bg-gray-41 !px-1 !pt-3 !pb-2" }}
    >
      <PopoverTarget>
        <span
          onClick={toggle}
          className="flex items-center gap-1 cursor-pointer"
        >
          <span className="font-medium text-gray-14 text-10px">
            {selected} Wallet
          </span>
          <MdKeyboardArrowRight />
        </span>
      </PopoverTarget>
      <PopoverDropdown>
        <div className="flex gap-2 flex-col">
          <span className="pl-2 text-gray-14 text-xs">Deposit Channel</span>
          <div className="w-100px grid grid-rows-2 h-100px bg-gray-7 rounded-lg">
            <span
              onClick={() => {
                setSelectedWallet(0);
                setSelected("Spot");
                close();
              }}
              className="h-full flex cursor-pointer items-center border-b border-b-gray-19 px-1 text-10px text-gray-14"
            >
              Spot Wallet
            </span>
            <span
              onClick={() => {
                setSelectedWallet(1);
                setSelected("Funding");
                close();
              }}
              className="h-full flex cursor-pointer items-center border-b border-b-gray-19 px-1 text-10px text-gray-14"
            >
              Funding Wallet
            </span>
          </div>
        </div>
      </PopoverDropdown>
    </Popover>
  );
};
