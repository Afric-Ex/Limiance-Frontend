"use client";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiPlus, FiMinus, FiChevronsRight } from "react-icons/fi";
import type { OrderBookEntry } from "@/src/hooks/use-order-book";
import { tradingKeys, tradingService } from "@/src/services/trading";
import type { KlineCandle } from "@/src/types/trading";

const INTERVALS = ["1s", "1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W"] as const;
type Interval = (typeof INTERVALS)[number];
type View = "chart" | "depth";

const APP_CHART_BACKGROUND = "#181a20";
const BULL_COLOR = "#25AB42";
const BEAR_COLOR = "#F6465D";
const DEFAULT_VISIBLE = 120;
const MIN_VISIBLE = 20;
const ZOOM_FACTOR = 1.25;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

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

// ── Backend kline normalisation ──────────────────────────────────────────────
// Accepts response envelopes of {Data:[...]}, {data:[...]}, {result:[...]} or raw arrays,
// and candles as either objects ({t,o,c,h,l,v} / {time,open,high,low,close,volume}) or Binance-style arrays.
const SLICE_VARIANTS = ["Data", "data", "result", "klines", "candles"] as const;

function unwrapKlines(raw: any): any[] {
  let value = raw;
  for (let i = 0; i < 2; i++) {
    if (value && typeof value === "object") {
      const inner = value?.data;
      if (Array.isArray(inner)) return inner;
      const found = SLICE_VARIANTS.find((k) => Array.isArray(value?.[k]));
      if (found) return value[found];
      if (typeof inner === "object" && inner !== null) value = inner;
      else break;
    }
  }
  return Array.isArray(value) ? value : [];
}

function normalizeKlines(raw: any): KlineCandle[] {
  return unwrapKlines(raw)
    .map((c: any): KlineCandle | null => {
      if (Array.isArray(c)) {
        const [time, open, high, low, close, volume] = c;
        if (typeof open === "string" && open.includes(":")) return null; // header row guard
        if (!Number.isFinite(Number(open))) return null;
        return {
          time: Number(time ?? 0) * (Number(time) < 1e12 ? 1000 : 1),
          open: Number(open),
          high: Number(high),
          low: Number(low),
          close: Number(close),
          volume: Number(volume ?? 0),
        };
      }
      if (c === null || typeof c !== "object") return null;
      if (!Number.isFinite(Number(c.open ?? c.o))) return null;
      const rawTime = Number(c.time ?? c.t ?? c.openTime ?? c.open_time ?? c.timestamp);
      const time =
        Number.isFinite(rawTime) && rawTime > 0 && rawTime < 1e12 ? rawTime * 1000 : rawTime;
      return {
        time,
        open: Number(c.open ?? c.o),
        high: Number(c.high ?? c.h),
        low: Number(c.low ?? c.l),
        close: Number(c.close ?? c.c),
        volume: Number(c.volume ?? c.v ?? 0),
      };
    })
    .filter((c): c is KlineCandle => c !== null && Number.isFinite(c.open) && Number.isFinite(c.close))
    .sort((a, b) => a.time - b.time);
}

function formatPrice(value: number, decimals: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatTime(t: number, interval: Interval) {
  const d = new Date(t);
  if (interval === "1D" || interval === "1W") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (interval === "1s") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ── Self-hosted candlestick chart drawn from backend klines ──────────────────
function drawCandles(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  candles: KlineCandle[],
  symbol: string,
  interval: Interval
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = APP_CHART_BACKGROUND;
  ctx.fillRect(0, 0, w, h);

  if (candles.length === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "13px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("No chart data", w / 2, h / 2);
    return;
  }

  const padL = 10;
  const padR = 68;
  const padT = 14;
  const padB = 26;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const volH = Math.round(plotH * 0.16);
  const priceH = plotH - volH - 8;

  const priceMin = Math.min(...candles.map((c) => c.low));
  const priceMax = Math.max(...candles.map((c) => c.high));
  const priceRange = priceMax - priceMin || 1;
  const calcY = (p: number) => padT + (1 - (p - priceMin) / priceRange) * priceH;

  const decimals = priceRange >= 100 ? 1 : priceRange >= 1 ? 2 : priceRange >= 0.01 ? 3 : 5;

  // Horizontal grid + price labels
  const priceTicks = 5;
  ctx.font = "10px ui-monospace, monospace";
  for (let i = 0; i <= priceTicks; i++) {
    const y = padT + (i / priceTicks) * priceH;
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    const price = priceMax - (i / priceTicks) * priceRange;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "left";
    ctx.fillText(formatPrice(price, decimals), w - padR + 6, y + 3);
  }

  // Candles + volume
  const candleW = plotW / candles.length;
  const bodyW = Math.max(1, Math.min(8, candleW * 0.7));
  const maxVol = Math.max(...candles.map((c) => c.volume), 1e-9);
  const volTop = padT + priceH + 8;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const x = padL + i * candleW + candleW / 2;
    const up = candle.close >= candle.open;
    const color = up ? BULL_COLOR : BEAR_COLOR;

    // Volume bar
    const vh = (candle.volume / maxVol) * volH;
    ctx.fillStyle = up ? "rgba(37,171,66,0.35)" : "rgba(246,70,93,0.35)";
    ctx.fillRect(x - bodyW / 2, volTop + (volH - vh), bodyW, vh);

    // Wick
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, calcY(candle.high));
    ctx.lineTo(x, calcY(candle.low));
    ctx.stroke();

    // Body
    const yO = calcY(candle.open);
    const yC = calcY(candle.close);
    const top = Math.min(yO, yC);
    ctx.fillStyle = color;
    ctx.fillRect(x - bodyW / 2, top, bodyW, Math.max(Math.abs(yO - yC), 1));
  }

  // Time labels
  const timeTicks = 6;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "center";
  for (let i = 0; i <= timeTicks; i++) {
    const idx = Math.min(candles.length - 1, Math.round((i / timeTicks) * (candles.length - 1)));
    const x = padL + idx * candleW + candleW / 2;
    ctx.fillText(formatTime(candles[idx].time, interval), x, h - padB + 15);
  }

  // Last price line
  const last = candles[candles.length - 1].close;
  const yLast = calcY(last);
  ctx.strokeStyle = "rgba(77,119,240,0.9)";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padL, yLast);
  ctx.lineTo(w - padR, yLast);
  ctx.stroke();
  ctx.setLineDash([]);

  const lastLabel = formatPrice(last, decimals);
  ctx.font = "10px ui-monospace, monospace";
  const tw = ctx.measureText(lastLabel).width + 8;
  ctx.fillStyle = "#4d77f0";
  ctx.fillRect(w - padR, yLast - 8, tw, 16);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(lastLabel, w - padR + tw / 2, yLast + 3);

  // Symbol summary (top-left)
  const first = candles[0];
  const change = ((last - first.open) / first.open) * 100;
  const changeColor = change >= 0 ? "#25AB42" : "#F6465D";
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(symbol, padL, padT - 2);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = changeColor;
  ctx.fillText(`${change >= 0 ? "+" : ""}${change.toFixed(2)}%`, padL + ctx.measureText(symbol + "  ").width, padT - 2);
}

function CandlestickChart({ symbol, interval }: { symbol: string; interval: Interval }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startEnd: number } | null>(null);

  // View window over the fetched candles: count = visible candles, end = right-edge index (0 = most recent)
  const [count, setCount] = useState(DEFAULT_VISIBLE);
  const [end, setEnd] = useState(0);

  const { data: candles, isLoading, isError } = useQuery({
    queryKey: tradingKeys.klineData(symbol, interval),
    queryFn: () => tradingService.klineData({ symbol, interval, limit: 500 }),
    select: (res) => normalizeKlines(res),
    staleTime: 60_000,
    retry: 1,
    throwOnError: false,
  });

  const n = candles?.length ?? 0;
  const effEnd = end === 0 ? Math.min(count, n) : Math.min(end, n);
  const visible = candles?.slice(Math.max(0, effEnd - count), effEnd) ?? [];

  const zoom = (factor: number) => {
    if (!n) return;
    const next = clamp(Math.round(count * factor), MIN_VISIBLE, n);
    setCount(next);
    setEnd(clamp(effEnd, next, n)); // preserve right edge while zooming
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!n) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const factor = e.deltaY > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const next = clamp(Math.round(count * factor), MIN_VISIBLE, n);
      const anchor = effEnd - count + ratio * count; // candle under the cursor
      setCount(next);
      setEnd(clamp(Math.round(anchor + next * (1 - ratio)), next, n));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: e.clientX, startEnd: effEnd };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !n) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const delta = Math.round((e.clientX - drag.startX) * (count / rect.width));
    setEnd(clamp(drag.startEnd - delta, count, n));
  };
  const handlePointerUp = () => {
    dragRef.current = null;
  };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const redraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = wrapper.getBoundingClientRect();
      canvas.width = Math.max(1, width * dpr);
      canvas.height = Math.max(1, height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawCandles(ctx, width, height, visible, symbol, interval);
      }
    };

    redraw();
    const ro = new ResizeObserver(redraw);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [candles, symbol, interval, count, end, visible]);

  return (
    <div
      ref={wrapperRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
    >
      <canvas ref={canvasRef} className="block" />
      {(isLoading || isError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-white/40">
            {isLoading ? "Loading chart data..." : "Failed to load chart data"}
          </span>
        </div>
      )}
      {n > 0 && !isLoading && (
        <div className="absolute bottom-2 right-2 z-10 flex flex-col rounded-md overflow-hidden border border-white/10 bg-black/50">
          <button
            aria-label="Zoom in"
            onClick={() => zoom(1 / ZOOM_FACTOR)}
            className="flex items-center justify-center w-7 h-7 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <FiPlus size={13} />
          </button>
          <button
            aria-label="Zoom out"
            onClick={() => zoom(ZOOM_FACTOR)}
            className="flex items-center justify-center w-7 h-7 text-white/60 hover:text-white hover:bg-white/10 transition-colors border-t border-white/10"
          >
            <FiMinus size={13} />
          </button>
          <button
            aria-label="Show most recent candles"
            onClick={() => setEnd(0)}
            className="flex items-center justify-center w-7 h-7 text-white/60 hover:text-white hover:bg-white/10 transition-colors border-t border-white/10"
          >
            <FiChevronsRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Depth chart (canvas, order book from backend WS) ─────────────────────────
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
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = wrapper.getBoundingClientRect();
      canvas.width = Math.max(1, width * dpr);
      canvas.height = Math.max(1, height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawDepth(ctx, width, height, buyOrders, sellOrders);
      }
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
          <CandlestickChart symbol={symbol} interval={interval} />
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