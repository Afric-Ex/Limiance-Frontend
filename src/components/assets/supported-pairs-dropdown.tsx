"use client";

import {
  Popover,
  PopoverTarget,
  PopoverDropdown,
  TextInput,
} from "@mantine/core";
import clsx from "clsx";
import Image from "next/image";
import { Search } from "../icons/search";
import { icons } from "./icons";
import { InlineLoading } from "../shared/inline-loading";
import { Dispatch, SetStateAction, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { SelectedCoin } from "@/src/hooks/use-deposit";
import { assetKeys, asset } from "@/src/services/asset";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/src/stores/user-store";

export const SupportedListingsDropdown = ({
  selectedCoin,
  setSelectedCoin,
}: {
  setSelectedCoin: Dispatch<SetStateAction<SelectedCoin>>;
  selectedCoin: SelectedCoin;
}) => {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [tokenQuery, setTokenQuery] = useState("");

  const { data: allTokens, isLoading: supportedTokensLoading } = useQuery({
    queryKey: assetKeys.supportedTokensKey("all"),
    queryFn: () => asset.fetchSupportedTokens({ limit: 200 }),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: Infinity,
  });

  const supportedTokens = tokenQuery.trim()
    ? allTokens?.filter(
        (t) =>
          t.symbol.toLowerCase().includes(tokenQuery.toLowerCase()) ||
          t.name.toLowerCase().includes(tokenQuery.toLowerCase())
      )
    : allTokens;

  const selectedCoinsHistory = useUserStore(
    (state) => state.selectedCoinsHistory
  );

  return (
    <Popover
      width="target"
      classNames={{
        dropdown:
          "!border-0 !flex !flex-col !max-h-[400px] overflow-auto !rounded-lg !p-0",
      }}
      opened={opened}
      onChange={close}
    >
      <PopoverTarget>
        <div
          onClick={toggle}
          className="bg-white/[0.03] border border-white/[0.08] cursor-pointer rounded-xl py-3 px-4 min-h-12 flex items-center justify-between hover:border-white/[0.18] transition-colors"
        >
          {supportedTokensLoading ? (
            <InlineLoading />
          ) : selectedCoin?.name ? (
            <span className="flex items-center gap-2">
              <img
                src={selectedCoin?.image}
                width={24}
                height={24}
                alt="selected coin"
              />
              <span className="flex items-center gap-1">
                <span className="text-xs font-bold">
                  {selectedCoin?.symbol}
                </span>
                <span className="text-8px">{selectedCoin?.name}</span>
              </span>
            </span>
          ) : (
            <div />
          )}
          <span className="p-1 pl-2 border-l border-l-white/[0.08] cursor-pointer">
            <Image src={icons.shortDownArrow} alt="arrow" />
          </span>
        </div>
      </PopoverTarget>
      <PopoverDropdown>
        <div className="bg-[#181a20] px-3 py-4 flex-1 overflow-auto rounded-xl border flex flex-col gap-2 border-white/[0.06]">
          <TextInput
            leftSection={<Search />}
            classNames={{
              input: "!h-[46px] !bg-white/[0.03] !border-white/[0.08] focus:!border-primary !rounded-xl !text-white",
            }}
            value={tokenQuery}
            onChange={(e) => setTokenQuery(e.target.value)}
          />
          {selectedCoinsHistory?.length ? (
            <>
                <span className="bg-white/[0.05] text-white/50 font-semibold text-[10px] py-2 px-2 rounded-lg">
                History
              </span>
              <div className="flex gap-2">
                {selectedCoinsHistory.map((item, index) => (
                  <span
                    key={index}
                    // onClick={() => setCoin(item)}
                    className={clsx(
                      // coin === item
                      //   ? "bg-blue-3 text-primary"
                      //   :
                      "bg-white/[0.06] text-white/60",
                      "w-[43px] py-1.5 flex items-center cursor-pointer justify-center rounded text-[10px]"
                    )}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </>
          ) : null}
          <div className="flex flex-col flex-1 overflow-auto gap-[2px]">
            <span className="bg-white/[0.05] text-white/50 font-semibold text-[10px] py-2 px-2 rounded-lg">
              Coin
            </span>
            <div className="flex flex-1 overflow-auto flex-col">
              {supportedTokensLoading ? (
                <InlineLoading />
              ) : (
                supportedTokens?.map((item: any, index: number) => (
                  <div
                    key={`${item.symbol}-${item.blockchain ?? "native"}-${index}`}
                    className="py-3 px-2 flex cursor-pointer border-b border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] items-center gap-2 transition-colors"
                    onClick={() => {
                      setSelectedCoin({
                        name: item.name,
                        symbol: item.symbol,
                        image: item.image,
                        contractAddress: item.contractAddress,
                        blockchain: item.blockchain,
                      });
                      close();
                    }}
                  >
                    <img src={item.image} width={16} height={16} alt="usdt" />
                    <span className="flex flex-col gap-[2px]">
                      <span className="text-10px font-bold">{item.symbol}</span>
                      <span className="text-8px">{item.name}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </PopoverDropdown>
    </Popover>
  );
};
