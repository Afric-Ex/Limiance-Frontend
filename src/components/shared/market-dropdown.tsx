import Image from "next/image";
import React, { useState } from "react";
import { icons } from "../assets/icons";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import Bitcoin from "@/public/bitcoin-icon.png";
import clsx from "clsx";
import { useRouter } from "next/navigation";

export const MarketDropdown = () => {
  const dropdownsList = [
    {
      title: 'Futures',
      icon: icons.futures,
      desc: 'Trade perpectual and futures contract',
      count: '0',
      link: '/trades/futures',
      rightSection: (
        <div className="py-14px w-[153px] rounded-lg bg-gray-7 px-6px">
          <Tabs
            defaultValue="USDT"
            classNames={{
              tab: '!px-0 !pt-0',
              tabLabel: '!text-8px',
              list: '!flex !items-center !gap-2',
              root: '!flex !flex-col !gap-3',
            }}
          >
            <TabsList>
              <TabsTab value="USDT">USDT</TabsTab>
              <TabsTab value="USDC">USDC</TabsTab>
              <TabsTab value="BTC">BTC</TabsTab>
              <TabsTab value="FDUSD">FDUSD</TabsTab>
            </TabsList>
            <TabsPanel value="USDT">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1">
                  <Image src={Bitcoin} alt="Bitcoin" width={10} height={10} />
                  <span className="text-8px font-semibold">BTC/USDT</span>
                </div>
              </div>
            </TabsPanel>
          </Tabs>
        </div>
      ),
    },
    {
      title: 'Spot Trading',
      icon: icons.spot,
      desc: 'Buy and sell crypto with advanced tools',
      link: '/trades/spot',
    },
    {
      title: 'Margin Trading',
      icon: icons.spot,
      desc: 'Trade with leverage to maximize your potential',
      link: '/trades/margin',
    },

    {
      title: 'Convert',
      icon: icons.p2p,
      desc: 'Quick conversion with zero fees',
    },
    {
      title: 'Trading Bots',
      icon: icons.p2p,
      desc: 'Automate your trading strategies 24/7',
      link: '/assets/trading-bots',
    },
  ];

  const [selected, setSelected] = useState("Futures");
  const { push } = useRouter();

  return (
    <div className="px-1 grid grid-cols-2 gap-1 bg-gray-17 pb-8 pt-3">
      <div className="flex flex-col gap-2">
        <h4 className="text-xs text-gray-14">Markets</h4>
        <ul className="bg-gray-7 rounded-lg flex flex-col pl-2 pr-1 py-2 max-w-[153px]">
          {dropdownsList.map((item) => (
            <li
              key={item.title}
              className={clsx(
                selected === item.title && "bg-gray-18",
                "pl-1 flex flex-col gap-6px pr-3 py-2 border-b-[0.5px] border-b-gray-19 hover:bg-gray-18 cursor-pointer"
              )}
              onMouseOver={() => setSelected(item.title)}
              onClick={item.link ? () => push(item.link) : undefined}
            >
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Image src={item.icon} alt={item.title} />
                  <span className="text-10px text-gray-14">{item.title}</span>
                </span>
                <span className="flex items-center gap-3">
                  {item.count ? (
                    <span className="text-6px px-6px py-1 bg-primary rounded-sm">
                      {item.count} fees
                    </span>
                  ) : null}
                  <Image src={icons.rightArrow} alt="right Arrow" />
                </span>
              </span>
              <span className="text-gray-9 text-6px">{item.desc}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="text-xs text-gray-14">Trading Pairs</h4>
        {dropdownsList.find((item) => item.title === selected)?.rightSection}
      </div>
    </div>
  );
};
