"use client";

import {
  Popover,
  PopoverTarget,
  PopoverDropdown,
  TextInput,
} from "@mantine/core";
import clsx from "clsx";
import React, { useState } from "react";
import { icons } from "../assets/icons";
import { images } from "../assets/images";
import { Search } from "../icons/search";
import Image from "next/image";

const coins = ["BTC", "USDT", "USDC"];

export const CoinSelectDropdown = () => {
  const [coin, setCoin] = useState("USDT");

  return (
    <Popover
      width="target"
      classNames={{ dropdown: "!border-0 !rounded-lg !p-0" }}
    >
      <PopoverTarget>
        <div className="bg-gray-37 cursor-pointer rounded-lg py-18px px-14px flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Image src={images.usdt} alt="usdt" />
            <span className="flex items-center gap-1">
              <span className="text-xs font-bold">USDT</span>
              <span className="text-8px">Tether USDT</span>
            </span>
          </span>
          <span className="p-1 pl-2 border-l border-l-gray-46 cursor-pointer">
            <Image src={icons.shortDownArrow} alt="arrow" />
          </span>
        </div>
      </PopoverTarget>
      <PopoverDropdown>
        <div className="bg-gray-18 px-3 py-4 rounded-lg border flex flex-col gap-2 border-gray-45">
          <TextInput
            leftSection={<Search />}
            classNames={{
              input: "!h-[46px] !bg-gray-7 focus:!border-blue-2 !rounded-lg",
            }}
          />
          <span className="bg-gray-48 font-semibold text-8px py-10px px-2 rounded-lg">
            History
          </span>
          <div className="flex gap-2">
            {coins.map((item, index) => (
              <span
                key={index}
                onClick={() => setCoin(item)}
                className={clsx(
                  coin === item
                    ? "bg-blue-3 text-primary"
                    : "bg-gray-37 text-gray-21",
                  "w-[43px] py-5px flex items-center cursor-pointer justify-center rounded text-8px"
                )}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-[2px]">
            <span className="bg-gray-48 font-semibold text-8px py-10px px-2 rounded-lg">
              Coin
            </span>
            <div className="flex flex-col">
              <div className="py-3 px-2 flex border-b border-b-gray-49 bg-gray-48 items-center gap-2">
                <Image src={images.usdt} width={16} height={16} alt="usdt" />
                <span className="flex flex-col gap-[2px]">
                  <span className="text-10px font-bold">USDT</span>
                  <span className="text-8px">Tether USDT</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </PopoverDropdown>
    </Popover>
  );
};
