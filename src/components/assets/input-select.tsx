"use client";

import { Input, Popover, PopoverDropdown, PopoverTarget } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Image from "next/image";
import React, { useState } from "react";

interface InputSelectProps {
  data: { name: string; logo: string; short: string }[];
  initialValue?: string;
  handleCurrencyUpdate?: (curr: string) => void;
}

export const InputSelect = ({
  data,
  initialValue,
  handleCurrencyUpdate,
}: InputSelectProps) => {
  const [currency, setCurrency] = useState(
    initialValue
      ? data?.find((item) => item.short === initialValue) ?? data[0]
      : data[0]
  );

  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <div className="flex bg-[#2B2F36E5] rounded-[4px] justify-between w-[268px] px-3 py-2.5">
      <Input
        placeholder="Enter Amount"
        classNames={{
          input:
            "!border-0 !bg-transparent focus:!border-0 !px-0 !py-0 placeholder:!text-13px placeholder:!text-[#848E9C] !flex-1",
        }}
      />
      <Popover
        opened={opened}
        onChange={close}
        classNames={{ dropdown: "!border-none !p-0" }}
      >
        <PopoverTarget>
          <div
            onClick={toggle}
            className="flex gap-1.5 items-center text-xs font-semibold pl-3 border-l border-l-gray-46 py-[5.5px] cursor-pointer"
          >
            <div className="flex gap-0.5 ">
              <Image
                src={currency.logo}
                width={16}
                height={16}
                alt={currency.name}
              />
              <span>{currency.short}</span>
            </div>
            <svg
              width="13"
              height="6"
              viewBox="0 0 13 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.511 5.605L0.891368 0.197498L12.1306 0.197498L6.511 5.605Z"
                fill="#848E9C"
              />
            </svg>
          </div>
        </PopoverTarget>
        <PopoverDropdown>
          <div className="flex flex-col">
            <div className="px-1 gap-1 bg-gray-17 pb-[9px] pt-3">
              <div className="flex flex-col gap-2">
                <h4 className="text-xs text-gray-14 pl-2">Currency</h4>
                <ul className="bg-gray-7 rounded-lg flex flex-col px-2 py-1.5 max-w-[234px] overflow-auto h-[200px]">
                  {data.map((item) => (
                    <li
                      onClick={() => {
                        setCurrency(item);
                        handleCurrencyUpdate?.(item.short.toLocaleLowerCase());
                        close();
                      }}
                      key={item.name}
                      className={
                        "pl-[13px] flex  gap-6px pr-[61px] py-4 border-b-[0.5px] border-b-gray-19 hover:bg-gray-18 cursor-pointer"
                      }
                    >
                      <Image
                        src={item.logo}
                        width={16}
                        height={16}
                        alt={item.name}
                      />
                      <span className="text-10px text-gray-14 text-nowrap">
                        {item.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </PopoverDropdown>
      </Popover>
    </div>
  );
};
