"use client";

import { useEffect, useRef } from "react";
import {
  createChart, CandlestickSeries, HistogramSeries, ColorType, CrosshairMode,
  type IChartApi, type ISeriesApi, type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "./landing-data";

const UP = "#25AB42";
const DOWN = "#F6465D";

/** Candles + volume from lightweight-charts (already a dependency). Hover reports the candle under the cursor. */
export function PriceChart({ candles, onHover }: { candles: Candle[]; onHover: (c: Candle | null) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const series = useRef<{ c: ISeriesApi<"Candlestick">; v: ISeriesApi<"Histogram"> } | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const byTime = useRef(new Map<number, Candle>());
  const hover = useRef(onHover);
  hover.current = onHover;

  useEffect(() => {
    const chart = createChart(box.current!, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#8A91A0", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.26 } },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      handleScale: false,
      handleScroll: false,
    });
    const c = chart.addSeries(CandlestickSeries, {
      upColor: UP, downColor: DOWN, borderVisible: false, wickUpColor: UP, wickDownColor: DOWN,
    });
    const v = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "vol", priceLineVisible: false, lastValueVisible: false });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    chart.subscribeCrosshairMove((p) => hover.current(p.time ? byTime.current.get(p.time as number) ?? null : null));
    chartRef.current = chart;
    series.current = { c, v };
    return () => { chart.remove(); chartRef.current = null; series.current = null; };
  }, []);

  useEffect(() => {
    if (!series.current) return;
    byTime.current = new Map(candles.map((c) => [c.time, c]));
    series.current.c.setData(candles.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })));
    series.current.v.setData(candles.map((c) => ({ time: c.time as UTCTimestamp, value: c.volume, color: c.close >= c.open ? "rgba(37,171,66,0.35)" : "rgba(246,70,93,0.35)" })));
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={box} className="h-full w-full" role="img" aria-label="Candlestick price chart" />;
}