"use client";
import { useEffect, useRef, useState } from "react";
import type { OrderBookEntry } from "@/src/hooks/use-order-book";

const INTERVALS = ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W"] as const;
type Interval = (typeof INTERVALS)[number];
type View = "chart" | "depth";

// Map our intervals to TradingView interval values
const TV_INTERVAL_MAP: Record<Interval, string> = {
  "1m":  "1",
  "5m":  "5",
  "15m": "15",
  "30m": "30",
  "1h":  "60",
  "4h":  "240",
  "1D":  "D",
  "1W":  "W",
};

const APP_CHART_BACKGROUND = "#181a20";

interface Props {
  symbol?: string;
  orderBook?: { buyOrders: OrderBookEntry[]; sellOrders: OrderBookEntry[] };
  orderLevels?: OrderLevel[];
  priceRange?: { min: number | null; max: number | null };
}

export type OrderLevel = {
  id: string;
  label: string;
  price: number;
  color: "entry" | "tp" | "sl";
  detail?: string;
};

const LEVEL_STYLES: Record<OrderLevel["color"], { line: string; bg: string }> = {
  entry: { line: "rgba(59, 130, 246, 0.9)", bg: "rgba(37, 99, 235, 0.95)" },
  tp: { line: "rgba(14, 203, 129, 0.9)", bg: "rgba(5, 150, 105, 0.95)" },
  sl: { line: "rgba(246, 70, 93, 0.9)", bg: "rgba(220, 38, 38, 0.95)" },
};

// ── Depth chart (canvas, unchanged) ──────────────────────────────────────────
function drawDepth(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  buyOrders: OrderBookEntry[],
  sellOrders: OrderBookEntry[]
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = APP_CHART_BACKGROUND;
  ctx.fillRect(0, 0, w, h);

  if (buyOrders.length === 0 && sellOrders.length === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No depth data", w / 2, h / 2);
    return;
  }

  const sortedBids = [...buyOrders].sort((a, b) => b.price - a.price);
  const sortedAsks = [...sellOrders].sort((a, b) => a.price - b.price);

  const cumBids: { price: number; cum: number }[] = [];
  const cumAsks: { price: number; cum: number }[] = [];
  let cum = 0;
  for (const o of sortedBids) { cum += o.quantity; cumBids.push({ price: o.price, cum }); }
  cum = 0;
  for (const o of sortedAsks) { cum += o.quantity; cumAsks.push({ price: o.price, cum }); }

  if (!cumBids.length || !cumAsks.length) return;

  const minPrice = cumBids[cumBids.length - 1].price;
  const maxPrice = cumAsks[cumAsks.length - 1].price;
  const maxCum = Math.max(cumBids[cumBids.length - 1].cum, cumAsks[cumAsks.length - 1].cum);
  const pad = 30;

  const px = (p: number) => pad + ((p - minPrice) / (maxPrice - minPrice)) * (w - pad * 2);
  const cy = (c: number) => h - pad - (c / maxCum) * (h - pad * 2);

  ctx.beginPath();
  ctx.moveTo(px(cumBids[0].price), h - pad);
  for (const { price, cum: c } of cumBids) ctx.lineTo(px(price), cy(c));
  ctx.lineTo(px(cumBids[cumBids.length - 1].price), h - pad);
  ctx.closePath();
  ctx.fillStyle = "rgba(38, 166, 154, 0.25)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(px(cumBids[0].price), cy(cumBids[0].cum));
  for (const { price, cum: c } of cumBids) ctx.lineTo(px(price), cy(c));
  ctx.strokeStyle = "#26a69a";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(px(cumAsks[0].price), h - pad);
  for (const { price, cum: c } of cumAsks) ctx.lineTo(px(price), cy(c));
  ctx.lineTo(px(cumAsks[cumAsks.length - 1].price), h - pad);
  ctx.closePath();
  ctx.fillStyle = "rgba(239, 83, 80, 0.25)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(px(cumAsks[0].price), cy(cumAsks[0].cum));
  for (const { price, cum: c } of cumAsks) ctx.lineTo(px(price), cy(c));
  ctx.strokeStyle = "#ef5350";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const midPrice = (minPrice + maxPrice) / 2;
  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.moveTo(px(midPrice), pad);
  ctx.lineTo(px(midPrice), h - pad);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(minPrice.toLocaleString(), pad, h - 8);
  ctx.textAlign = "center";
  ctx.fillText(midPrice.toLocaleString(), px(midPrice), h - 8);
  ctx.textAlign = "right";
  ctx.fillText(maxPrice.toLocaleString(), w - pad, h - 8);
}

function DepthChart({ buyOrders, sellOrders }: { buyOrders: OrderBookEntry[]; sellOrders: OrderBookEntry[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const redraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = wrapper.clientWidth;
      canvas.height = wrapper.clientHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) drawDepth(ctx, canvas.width, canvas.height, buyOrders, sellOrders);
    };
    redraw();
    const ro = new ResizeObserver(redraw);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [buyOrders, sellOrders]);

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

// ── TradingView Widget ────────────────────────────────────────────────────────
function TradingViewWidget({ symbol, interval }: { symbol: string; interval: Interval }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Convert "BTC/USDT" → "BINANCE:BTCUSDT"
  const tvSymbol = `BINANCE:${symbol.replace("/", "").toUpperCase()}`;
  const tvInterval = TV_INTERVAL_MAP[interval];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.width = "100%";
    widgetDiv.style.height = "100%";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#181a20",
      gridColor: "rgba(255, 255, 255, 0.04)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [tvSymbol, tvInterval]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
function OrderLevelOverlay({ levels, priceRange }: { levels: OrderLevel[]; priceRange?: Props["priceRange"] }) {
  const validLevels = levels.filter((level) => Number.isFinite(level.price) && level.price > 0);
  if (validLevels.length === 0) return null;

  const rangeValues = [
    ...validLevels.map((level) => level.price),
    ...(Number.isFinite(priceRange?.min) && priceRange?.min ? [priceRange.min] : []),
    ...(Number.isFinite(priceRange?.max) && priceRange?.max ? [priceRange.max] : []),
  ];
  const min = Math.min(...rangeValues);
  const max = Math.max(...rangeValues);
  const span = Math.max(max - min, max * 0.002, 1);
  const paddedMin = min - span * 0.25;
  const paddedMax = max + span * 0.25;

  const topForPrice = (price: number) => {
    const position = 1 - (price - paddedMin) / (paddedMax - paddedMin);
    return Math.min(92, Math.max(8, position * 100));
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 z-20 overflow-hidden">
      {validLevels.map((level) => {
        const style = LEVEL_STYLES[level.color];
        return (
          <div
            key={level.id}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: `${topForPrice(level.price)}%` }}
          >
            <div className="h-px flex-1 border-t border-dashed" style={{ borderColor: style.line }} />
            <div
              className="mr-2 rounded px-2 py-1 text-[10px] font-bold text-white shadow-lg"
              style={{ backgroundColor: style.bg }}
            >
              <span>{level.label}</span>
              <span className="ml-1 tabular-nums">
                {level.price.toLocaleString("en-US", { maximumFractionDigits: 6 })}
              </span>
              {level.detail && <span className="ml-1 opacity-80">{level.detail}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TradingViewChart({ symbol = "BTC/USDT", orderBook, orderLevels = [], priceRange }: Props) {
  const [interval, setIntervalVal] = useState<Interval>("15m");
  const [view, setView] = useState<View>("chart");

  const bids = orderBook?.buyOrders ?? [];
  const asks = orderBook?.sellOrders ?? [];

  return (
    <div className="w-full h-full bg-[#181a20] relative flex flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0 h-9">
        <div className="flex items-center">
          {(["chart", "depth"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs font-semibold px-3 h-9 border-b-2 transition-colors capitalize ${
                view === v
                  ? "text-white border-white"
                  : "text-white/40 border-transparent hover:text-white/70"
              }`}
            >
              {v === "chart" ? "Chart" : "Depth"}
            </button>
          ))}
        </div>

        {view === "chart" && (
          <div className="flex items-center gap-0.5">
            {INTERVALS.map((iv) => (
              <button
                key={iv}
                onClick={() => setIntervalVal(iv)}
                className={`text-[11px] font-semibold px-2 h-7 rounded transition-colors ${
                  interval === iv
                    ? "text-white bg-white/10"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {iv}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart views */}
      {view === "chart" ? (
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <TradingViewWidget symbol={symbol} interval={interval} />
          <OrderLevelOverlay levels={orderLevels} priceRange={priceRange} />
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <DepthChart buyOrders={bids} sellOrders={asks} />
        </div>
      )}
    </div>
  );
}