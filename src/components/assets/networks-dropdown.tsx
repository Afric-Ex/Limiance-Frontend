import {
  Popover,
  PopoverTarget,
  PopoverDropdown,
  TextInput,
} from "@mantine/core";
import { Search } from "../icons/search";
import { icons } from "./icons";
import { Info } from "./info";
import Image from "next/image";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { SelectedNetwork } from "@/src/hooks/use-deposit";
import { InlineLoading } from "../shared/inline-loading";
import { assetKeys, asset } from "@/src/services/asset";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const NetworksDropdown = ({
  selectedNetwork,
  setSelectedNetwork,
}: {
  setSelectedNetwork: React.Dispatch<React.SetStateAction<SelectedNetwork>>;
  selectedNetwork: SelectedNetwork;
}) => {
  const [opened, { toggle, close }] = useDisclosure(false);

  const [chainQuery, setChainQuery] = useState("");

  // Debounced so each keystroke doesn't fire its own request; the query
  // already runs server-side via `q`.
  const [debouncedChainQuery] = useDebouncedValue(chainQuery.trim(), 350);

  const { data: supportedChains, isLoading: supportedChainsLoading } = useQuery(
    {
      queryKey: assetKeys.supportedChainsKey(debouncedChainQuery),
      queryFn: () => asset.fetchSupportedChains({ q: debouncedChainQuery }),
      select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    }
  );

  return (
    <Popover
      width="target"
      classNames={{ dropdown: "!border-0 !max-h-[400px] overflow-auto !flex !flex-col !rounded-lg !p-0" }}
      opened={opened}
      onChange={close}
    >
      <PopoverTarget>
        <div
          onClick={toggle}
          className="bg-gray-37 cursor-pointer rounded-lg py-18px px-14px flex items-center justify-between"
        >
          {supportedChainsLoading ? (
            <InlineLoading />
          ) : (
            <>
              <span className="text-xs font-bold">{selectedNetwork?.name}</span>
              <span className="p-1 pl-2 border-l border-l-gray-46 cursor-pointer">
                <Image src={icons.shortDownArrow} alt="arrow" />
              </span>
            </>
          )}
        </div>
      </PopoverTarget>
      <PopoverDropdown>
        <div className="bg-gray-18 px-3 !flex-1 overflow-auto py-4 rounded-lg border flex flex-col gap-2 border-gray-45">
          <TextInput
            leftSection={<Search />}
            classNames={{
              input: "!h-[46px] !bg-gray-7 focus:!border-blue-2 !rounded-lg",
            }}
            value={chainQuery}
            onChange={(e) => setChainQuery(e.target.value)}
          />
          <div className="p-10px bg-gray-47 rounded-lg flex items-start gap-1">
            <Info />
            <span className="flex-1 text-10px font-medium">
              Ensure you select a network that matches the withdrawal platform
              of the coin you are withdrawing to avoid permanent loss of assets.
            </span>
          </div>
          <div className="flex flex-1 overflow-auto flex-col gap-[2px]">
            <span className="bg-gray-48 font-semibold text-8px py-10px px-2 rounded-lg">
              Network
            </span>
            <div className="flex flex-1 overflow-auto flex-col">
              {supportedChains?.map((item: any, index: number) => (
                <span
                  key={`${item.symbol}-${item.name}-${index}`}
                  onClick={() => {
                    setSelectedNetwork({
                      name: item.name,
                      symbol: item.symbol,
                      blockchain: item.blockchain,
                    });
                    close();
                  }}
                  className="flex py-3 border-b border-b-gray-49 bg-gray-48 hover:bg-gray-48/50 cursor-pointer px-2 flex-col gap-[2px]"
                >
                  <span className="text-10px font-bold">{item.symbol}</span>
                  <span className="text-8px">
                    {item.name} ({item.standard})
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </PopoverDropdown>
    </Popover>
  );
};
