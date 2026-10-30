import Image from "next/image";
import React, { useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useMarketFeed } from "@/src/hooks/use-market-feed";
import { IoIosArrowForward } from "react-icons/io";
import { RiLineChartLine, RiExchangeDollarLine, RiRobot2Line } from "react-icons/ri";
import { LuRepeat2 } from "react-icons/lu";
import { Loader } from "@mantine/core";

const marketItems = [
  {
    key: "spot",
    title: "Spot",
    desc: "Buy and sell crypto with advanced tools",
    link: "/trades/spot",
    category: "spot",
    icon: RiLineChartLine,
    showPairs: true,
  },
  {
    key: "futures",
    title: "Futures",
    desc: "Trade perpetual and futures contracts",
    link: "/trades/futures",
    category: "futures",
    icon: RiExchangeDollarLine,
    showPairs: true,
  },
  {
    key: "margin",
    title: "Margin",
    desc: "Trade with leverage to maximize potential",
    link: "/trades/margin",
    category: "margin",
    icon: RiExchangeDollarLine,
    showPairs: true,
  },
  {
    key: "convert",
    title: "Convert",
    desc: "Quick conversion with zero fees",
    link: "/trades/convert",
    icon: LuRepeat2,
    showPairs: false,
  },
  {
    key: "bots",
    title: "Trading Bots",
    desc: "Automate your trading strategies 24/7",
    link: "/assets/trading-bots",
    icon: RiRobot2Line,
    showPairs: false,
  },
];

const getPairsForCategory = (markets: any[], category: string) => {
  if (!Array.isArray(markets)) return [];
  if (category === "futures") {
    const filtered = markets.filter((m: any) => {
      const symbol = (m.symbol || m.pair || "").toString().toUpperCase();
      const type = (m.type || m.market_type || m.contractType || "").toString().toLowerCase();
      return type.includes("perp") || type.includes("future") || symbol.includes("PERP");
    });
    if (filtered.length > 0) return filtered.slice(0, 6);
    return markets.filter((m: any) => {
      const symbol = (m.symbol || m.pair || "").toString().toUpperCase();
      return symbol.includes("USDT") || symbol.includes("USDC") || symbol.includes("FDUSD");
    }).slice(0, 6);
  }
  if (category === "margin") {
    const filtered = markets.filter((m: any) => {
      const type = (m.type || m.market_type || "").toString().toLowerCase();
      return type.includes("margin") || m.isMargin || m.margin || m.crossMargin || m.isolatedMargin;
    });
    if (filtered.length > 0) return filtered.slice(0, 6);
    return markets.filter((m: any) => {
      const symbol = (m.symbol || m.pair || "").toString().toUpperCase();
      return symbol.includes("USDT") || symbol.includes("BTC") || symbol.includes("ETH");
    }).slice(0, 6);
  }
  if (category === "spot") {
    const filtered = markets.filter((m: any) => {
      const type = (m.type || m.market_type || m.contractType || "").toString().toLowerCase();
      if (type.includes("perp") || type.includes("future") || type.includes("margin")) return false;
      if (m.isMargin || m.margin) return false;
      return true;
    });
    if (filtered.length > 0) return filtered.slice(0, 6);
    return markets.slice(0, 6);
  }
  return [];
};

const PairRow = ({ market }: { market: any }) => {
  const { push } = useRouter();
  const symbol = market.symbol || market.pair || "";
  const normalized = symbol.replace(/[_-]/g, "/");
  const base = market.base || (normalized.includes("/") ? normalized.split("/")[0] : symbol.replace(/(USDT|USDC|BTC|ETH|FDUSD|BUSD)$/, ""));
  const quote = market.quote || (normalized.includes("/") ? normalized.split("/")[1] : symbol.match(/(USDT|USDC|BTC|ETH|FDUSD|BUSD)$/)?.[0] || "USDT");
  const price = market.last_price ?? market.lastPrice ?? market.price ?? 0;
  const change = market.percent_change ?? market.priceChangePercent ?? market.changePercent24h ?? 0;
  const changeNum = typeof change === "number" ? change : parseFloat(change || "0");
  const isPositive = changeNum >= 0;
  const iconUrl = market.icon || market.logo || market.coinIcon;
  return (
    <div
      onClick={() => push(`/trades/spot?pair=${base}${quote}`)}
      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/[0.02] cursor-pointer"
    >
      <div className="flex items-center gap-2">
        {iconUrl ? (
          <Image src={iconUrl} alt={base} width={16} height={16} className="rounded-full" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white/70">{base?.slice(0,1)}</div>
        )}
        <span className="text-xs text-white/90">{base}/{quote}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/70">{Number(price).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
        <span className={clsx("text-xs", isPositive ? "text-[#0ECB81]" : "text-[#F6465D]")}>
          {isPositive ? "+" : ""}{changeNum.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export const MarketDropdown = () => {
  const [selected, setSelected] = useState("spot");
  const { push } = useRouter();
  const { markets, marketsLoading } = useMarketFeed("BTC-USDT");

  const selectedItem = marketItems.find((item) => item.key === selected) || marketItems[0];
  const pairs = selectedItem.showPairs && selectedItem.category ? getPairsForCategory(markets, selectedItem.category) : [];

  return (
    <div className="bg-[#181a20] border border-white/[0.06] rounded-xl overflow-hidden flex shadow-2xl">
      <div className="w-[260px] border-r border-white/[0.06]">
        <div className="px-4 pt-3 pb-2 text-xs text-white/40">Trade</div>
        <ul className="flex flex-col px-2 pb-2">
          {marketItems.map((item) => {
            const Icon = (item as any).icon;
            return (
              <li
                key={item.key}
                className={clsx(
                  selected === item.key && "bg-white/[0.03]",
                  "flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-white/[0.02] cursor-pointer"
                )}
                onMouseEnter={() => setSelected(item.key)}
                onClick={() => item.link && push(item.link)}
              >
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="text-white/70" size={16} />}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-white/90">{item.title}</span>
                    <span className="text-xs text-white/40">{item.desc}</span>
                  </div>
                </div>
                {(item as any).showPairs && <IoIosArrowForward className="text-white/30" size={14} />}
              </li>
            );
          })}
        </ul>
      </div>
      {(selectedItem as any).showPairs ? (
        <div className="w-[300px]">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <span className="text-xs text-white/40">Trading Pairs</span>
            {selectedItem.link && <button onClick={() => push(selectedItem.link)} className="text-xs text-white/40 hover:text-white/70">More</button>}
          </div>
          <div className="px-2 pb-3 flex flex-col min-h-[200px]">
            {marketsLoading && pairs.length === 0 ? (
              <div className="flex items-center justify-center h-[160px]">
                <Loader size="xs" color="gray" />
              </div>
            ) : pairs.length === 0 ? (
              <div className="px-2 py-2 text-xs text-white/40">No trading pairs available</div>
            ) : (
              pairs.map((market: any, idx: number) => <PairRow key={(market.symbol || market.poid || market.id || idx)} market={market} />)
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
