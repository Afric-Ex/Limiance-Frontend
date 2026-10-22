"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiBarChart2, FiChevronsRight } from "react-icons/fi";
import { FaXmark } from "react-icons/fa6";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
  type CandlestickData,
  type HistogramData,
} from "lightweight-charts";
import { useCandleFeed } from "@/src/components/trades/use-candle-feed";
import { calculateSMA, calculateSingleSMA } from "@/src/components/trades/indicators";
import {
  CLICKS_REQUIRED,
  DrawingPrimitive,
  createDrawing,
  DRAWING_LABELS,
  type Drawing,
  type DrawingLineWidth,
  type DrawingPick,
  type DrawingPoint,
  type DrawingStyle,
  type DrawingTool,
  type PixelPoint,
} from "@/src/components/trades/drawing-primitives";
import { DrawingToolbar, type ToolbarTool } from "@/src/components/trades/drawing-toolbar";
import type { ChartMarket } from "@/src/components/trades/use-candle-feed";
import type { KlineCandle } from "@/src/types/trading";
import type { OrderLevel } from "@/src/components/trades/candlestick-char";

const APP_CHART_BACKGROUND = "#181a20";
const BULL_COLOR = "#16c784";
const BEAR_COLOR = "#ea3943";

const LEVEL_COLORS: Record<OrderLevel["color"], { line: string; axis: string }> = {
  entry: { line: "#3b82f6", axis: "#2563eb" },
  tp: { line: "#0ecb81", axis: "#059669" },
  sl: { line: "#f6465d", axis: "#dc2626" },
  fill: { line: "#ff8a00", axis: "#ff8a00" },
};

// Drawing tools reuse the existing palette rather than introducing hues: three
// of them take a level colour, and fib falls back to the white opacity scale
// already used for chart text (fill.line and fill.axis are both #ff8a00, so it
// would otherwise be indistinguishable from the rectangle).
const TOOL_COLORS: Record<DrawingTool, string> = {
  trendline: LEVEL_COLORS.entry.line,
  ray: LEVEL_COLORS.tp.line,
  extended: LEVEL_COLORS.entry.line,
  hray: LEVEL_COLORS.sl.line,
  hline: LEVEL_COLORS.sl.line,
  vline: LEVEL_COLORS.entry.line,
  rectangle: LEVEL_COLORS.fill.line,
  channel: LEVEL_COLORS.tp.line,
  fib: "rgba(255,255,255,0.70)",
  fibext: "rgba(255,255,255,0.70)",
};

/**
 * Swatches reuse the order-level palette, so a drawing colour is never a hue
 * that means something else elsewhere in the app: blue/green/red/orange line up
 * with entry/tp/sl, and white is the same opacity scale the chart text uses.
 */
const DRAWING_SWATCHES: { value: string; label: string }[] = [
  { value: LEVEL_COLORS.entry.line, label: "Blue" },
  { value: LEVEL_COLORS.tp.line, label: "Green" },
  { value: LEVEL_COLORS.sl.line, label: "Red" },
  { value: LEVEL_COLORS.fill.line, label: "Orange" },
  { value: "rgba(255,255,255,0.85)", label: "White" },
];

const DRAWING_WIDTHS: readonly DrawingLineWidth[] = [1, 2, 3, 4];

/** Gap between a drawing and its label, and the label's own padding. */
const LABEL_OFFSET_PX = 10;

/** Stable identity for symbols with no drawings, so derived effects do not churn. */
const NO_DRAWINGS: readonly Drawing[] = Object.freeze([]);
const DRAWINGS_STORAGE_PREFIX = "limiance.chart.drawings.v1";

function readStoredDrawings(market: ChartMarket): Record<string, Drawing[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(
      localStorage.getItem(DRAWINGS_STORAGE_PREFIX + "." + market) ?? "{}"
    );
    if (!raw || typeof raw !== "object") return {};
    return Object.fromEntries(
      Object.entries(raw)
        .map(([symbol, value]) => [
          symbol,
          Array.isArray(value)
            ? value.filter(
                (drawing: any) =>
                  drawing &&
                  typeof drawing.id === "string" &&
                  typeof drawing.tool === "string" &&
                  Array.isArray(drawing.points) &&
                  drawing.points.every(
                    (point: any) =>
                      Number.isFinite(point?.time) && Number.isFinite(point?.price)
                  )
              )
            : [],
        ])
        .filter(([, value]) => Array.isArray(value))
    ) as Record<string, Drawing[]>;
  } catch {
    return {};
  }
}

/** Undo/redo stacks, one pair per symbol so history is not shared across pairs. */
type DrawingHistory = { past: Drawing[][]; future: Drawing[][] };

/**
 * A drag in progress. `origin`/`originPixels` are captured on mousedown rather
 * than re-read on every move: a body drag adds the pointer delta to a fixed set
 * of pixels, so reading the already-moved positions instead would compound the
 * offset and the drawing would run away from the pointer.
 */
type DrawingDrag = {
  id: string;
  part: "anchor" | "body";
  anchorIndex: number;
  startX: number;
  startY: number;
  origin: DrawingPoint[];
  originPixels: PixelPoint[];
};

type PendingDrawing = { tool: DrawingTool; points: DrawingPoint[] };

/** Grab radius of the OHLC magnet, in pane pixels. */
const MAGNET_PX = 6;

/**
 * Magnet snap: the nearest of the hovered bar's OHLC within MAGNET_PX, otherwise
 * the raw price. Thresholds are compared in pixels rather than price units
 * because the same price offset is a different visual distance at every zoom
 * level, and the pull should feel constant on screen.
 */
function snapToOhlc(
  bar: KlineCandle | undefined,
  series: ISeriesApi<"Candlestick">,
  price: number
): number {
  if (!bar) return price;
  const y = series.priceToCoordinate(price);
  if (y === null) return price;
  let best: number | null = null;
  let bestDistance = MAGNET_PX;
  for (const candidate of [bar.open, bar.high, bar.low, bar.close]) {
    if (!Number.isFinite(candidate)) continue;
    const candidateY = series.priceToCoordinate(candidate);
    if (candidateY === null) continue;
    const distance = Math.abs(candidateY - y);
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best ?? price;
}

function chartTimeToSeconds(time: Time | null | undefined): number | null {
  if (typeof time === "number") return Number.isFinite(time) ? time : null;
  if (typeof time === "string") {
    const parsed = Date.parse(time);
    return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
  }
  if (time && typeof time === "object") {
    const day = time as { year?: number; month?: number; day?: number };
    if (Number.isFinite(day.year) && Number.isFinite(day.month) && Number.isFinite(day.day)) {
      return Math.floor(Date.UTC(day.year!, day.month! - 1, day.day!) / 1000);
    }
  }
  return null;
}

/**
 * Screen point → time/price. Prefers param.time, which is a real bar time of the
 * current interval, so anchors are always snapped to a bar. coordinateToTime is
 * the fallback for the whitespace to the right of the last bar.
 *
 * `bars` enables the OHLC magnet for the placements and drags that go through
 * here; it is read from a ref at call time, so the chart-build effect does not
 * have to re-register on every tick.
 */
function pointFromParam(
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  param: MouseEventParams<Time>,
  bars?: Map<number, KlineCandle>
): DrawingPoint | null {
  if (!param.point) return null;
  const time = chartTimeToSeconds(param.time) ?? chartTimeToSeconds(chart.timeScale().coordinateToTime(param.point.x));
  if (time === null) return null;
  const price = series.coordinateToPrice(param.point.y);
  if (price === null || !Number.isFinite(price)) return null;
  if (!bars) return { time, price };
  const snapped = snapToOhlc(bars.get(time), series, price);
  return snapped === price ? { time, price } : { time, price: snapped };
}

function styleFor(drawing: Drawing): DrawingStyle {
  return {
    color: drawing.color ?? TOOL_COLORS[drawing.tool],
    background: APP_CHART_BACKGROUND,
    formatPrice,
  };
}

/**
 * While a drawing tool is active the library's drag-to-pan would swallow the
 * second click of a two-click drawing, so pressed-move panning and price-axis
 * dragging are off until the pointer tool is selected again. Wheel and pinch
 * zoom are untouched, and the pointer tool restores the original options.
 *
 * The same switch is flipped while the pointer rests on a drawing, so a press
 * there is a grab rather than a pan.
 */
function applyPanMode(chart: IChartApi, suppressed: boolean): void {
  chart.applyOptions({
    handleScroll: { pressedMouseMove: !suppressed, horzTouchDrag: true, vertTouchDrag: false },
    handleScale: { axisPressedMouseMove: !suppressed },
  });
}


// Lightweight Charts throws on unsorted or duplicate timestamps, so the feed is
// sanitized on the way in rather than trusted.
function toCandleData(candles: KlineCandle[]) {
  const seen = new Set<number>();
  // Sorted on the numeric stamp, since CandlestickData["time"] may be a BusinessDay.
  const out: { t: number; d: CandlestickData }[] = [];
  for (const c of candles) {
    if (!Number.isFinite(c.time) || c.time <= 0) continue;
    if (![c.open, c.high, c.low, c.close].every((v) => Number.isFinite(v) && v > 0)) continue;
    const time = Math.floor(c.time / 1000) as UTCTimestamp;
    if (seen.has(time)) continue;
    seen.add(time);
    out.push({ t: time, d: { time, open: c.open, high: c.high, low: c.low, close: c.close } });
  }
  return out.sort((a, b) => a.t - b.t).map((x) => x.d);
}

function toVolumeData(candles: KlineCandle[]): HistogramData[] {
  const seen = new Set<number>();
  const out: { t: number; d: HistogramData }[] = [];
  for (const c of candles) {
    if (!Number.isFinite(c.time) || c.time <= 0) continue;
    if (!Number.isFinite(c.volume)) continue;
    if (![c.open, c.high, c.low, c.close].every((v) => Number.isFinite(v) && v > 0)) continue;
    const time = Math.floor(c.time / 1000) as UTCTimestamp;
    if (seen.has(time)) continue;
    seen.add(time);
    out.push({
      t: time,
      d: {
        time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(37,171,66,0.35)" : "rgba(246,70,93,0.35)",
      },
    });
  }
  return out.sort((a, b) => a.t - b.t).map((x) => x.d);
}

const formatPrice = (value: number) => {
  const abs = Math.abs(value);
  const decimals = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const formatStamp = (time: number, interval: string) => {
  const d = new Date(time * 1000);
  if (["1d", "1w", "1mn", "6mh", "1y"].includes(interval)) {
    if (interval === "1y") {
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    ...(interval === "1s" ? { second: "2-digit" } : {}),
    hour12: false,
  });
};

export function LwcCandlestickChart({
  symbol,
  interval,
  market = "spot",
  orderLevels = [],
}: {
  symbol: string;
  interval: string;
  market?: ChartMarket;
  orderLevels?: OrderLevel[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma7SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma25SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma99SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const orderLevelsRef = useRef<OrderLevel[]>(orderLevels);
  // Live primitive per drawing id, and a symbol-keyed store of drawings that the
  // chart rebuild cannot touch. Drawings live in React state, not in the chart
  // instance, so they survive the teardown/rebuild on every symbol/interval change.
  const primitivesRef = useRef(new Map<string, DrawingPrimitive>());
  const drawingsRef = useRef<Record<string, Drawing[]>>({});
  const previewRef = useRef<DrawingPrimitive | null>(null);
  // Series the preview was attached to, so a rebuild never detaches from a
  // disposed series.
  const previewSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const toolRef = useRef<ToolbarTool>("pointer");
  const pendingRef = useRef<PendingDrawing | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const dragRef = useRef<DrawingDrag | null>(null);
  // True while the pointer rests on a drawing, which is also when a press has to
  // mean "grab" rather than "pan".
  const overDrawingRef = useRef(false);
  // The selected drawing's data label. Positioned by writing a transform straight
  // to the node: the label has to track its drawing through every pan, zoom and
  // tick, and routing that through React state would re-render the whole chart
  // per frame.
  const labelRef = useRef<HTMLDivElement>(null);
  const labelSizeRef = useRef({ width: 0, height: 0 });
  // Bar lookup for the magnet, rebuilt per feed change but read by handlers that
  // are registered once, so the identity churn never re-registers a listener.
  const barByTimeRef = useRef<Map<number, KlineCandle>>(new Map());
  // Last pair/interval the viewport was fitted to, so live ticks do not reset it.
  const fittedRef = useRef<string | null>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);
  const candleDataContextRef = useRef<string | null>(null);
  const candleDataSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  // Identity of the last REST history array rendered. A new identity means the
  // full dataset changed (initial load/refetch), so the incremental last-candle
  // update path is unsafe until setData has installed all of it.
  const appliedHistoryRef = useRef<KlineCandle[] | undefined>(undefined);
  const [legend, setLegend] = useState<{ o: number; h: number; l: number; c: number; v?: number; ma7?: number; ma25?: number; ma99?: number } | null>(null);
  const [drawingsBySymbol, setDrawingsBySymbol] = useState<Record<string, Drawing[]>>(() =>
    readStoredDrawings(market)
  );
  const [historyBySymbol, setHistoryBySymbol] = useState<Record<string, DrawingHistory>>({});
  const [tool, setToolState] = useState<ToolbarTool>("pointer");
  const [pending, setPendingState] = useState<PendingDrawing | null>(null);
  const [selectedId, setSelectedIdState] = useState<string | null>(null);

  // TradingView-style drawings are user annotations, not transient ticks:
  // keep them per market and symbol so pair switching/remounting does not erase
  // the analysis the trader just made.
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      DRAWINGS_STORAGE_PREFIX + "." + market,
      JSON.stringify(drawingsBySymbol)
    );
  }, [drawingsBySymbol, market]);

  const drawings = drawingsBySymbol[symbol] ?? NO_DRAWINGS;
  const history = historyBySymbol[symbol];
  const canUndo = (history?.past.length ?? 0) > 0;
  const canRedo = (history?.future.length ?? 0) > 0;

  // Ref-backed setters: the chart's click/crosshair/keydown handlers are
  // registered once per chart build, so they must not close over interaction state.
  const setTool = useCallback((next: ToolbarTool) => {
    toolRef.current = next;
    setToolState(next);
  }, []);
  const setPending = useCallback((next: PendingDrawing | null) => {
    pendingRef.current = next;
    setPendingState(next);
  }, []);
  const setSelectedId = useCallback((next: string | null) => {
    selectedIdRef.current = next;
    setSelectedIdState(next);
  }, []);

  /**
   * The single write path for the drawing list, so every mutation leaves an undo
   * snapshot behind. The snapshot is taken from `drawingsRef` outside the state
   * updater on purpose: a React state updater is not allowed to have side
   * effects, and StrictMode may invoke it twice, which would double-push history.
   */
  const commitDrawings = useCallback(
    (mutate: (current: readonly Drawing[]) => Drawing[]) => {
      const current = [...(drawingsRef.current[symbol] ?? NO_DRAWINGS)];
      setHistoryBySymbol((prev) => {
        const existing = prev[symbol] ?? { past: [], future: [] };
        // A new edit invalidates the redo branch, or redo would replay a future
        // that no longer follows from the present.
        return { ...prev, [symbol]: { past: [...existing.past, current], future: [] } };
      });
      setDrawingsBySymbol((prev) => ({ ...prev, [symbol]: mutate(current) }));
    },
    [symbol]
  );

  const addDrawing = useCallback(
    (drawing: Drawing) => {
      commitDrawings((current) => [...current, drawing]);
      setSelectedId(drawing.id);
    },
    [commitDrawings, setSelectedId]
  );

  const removeDrawing = useCallback(
    (id: string) => {
      // Guarded so the trash button and the Delete key cannot push a no-op undo
      // step for an id that is not in the list (stale selection after an undo).
      if (!drawingsRef.current[symbol]?.some((d) => d.id === id)) return;
      commitDrawings((current) => current.filter((d) => d.id !== id));
      if (selectedIdRef.current === id) setSelectedId(null);
    },
    [commitDrawings, setSelectedId, symbol]
  );

  /** Commits a drag, so a moved drawing is one undo step, not a per-move one. */
  const replacePoints = useCallback(
    (id: string, points: DrawingPoint[]) => {
      commitDrawings((current) => current.map((d) => (d.id === id ? { ...d, points } : d)));
    },
    [commitDrawings]
  );

  /** Restyle a single drawing, one undo step like any other edit. */
  const updateDrawing = useCallback(
    (id: string, patch: Partial<Drawing>) => {
      commitDrawings((current) => current.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    },
    [commitDrawings]
  );

  const undo = useCallback(() => {
    const existing = historyBySymbol[symbol];
    if (!existing || existing.past.length === 0) return;
    const current = [...(drawingsRef.current[symbol] ?? NO_DRAWINGS)];
    const restored = existing.past[existing.past.length - 1];
    setHistoryBySymbol((prev) => ({
      ...prev,
      [symbol]: { past: existing.past.slice(0, -1), future: [...existing.future, current] },
    }));
    setDrawingsBySymbol((prev) => ({ ...prev, [symbol]: restored }));
  }, [historyBySymbol, symbol]);

  const redo = useCallback(() => {
    const existing = historyBySymbol[symbol];
    if (!existing || existing.future.length === 0) return;
    const current = [...(drawingsRef.current[symbol] ?? NO_DRAWINGS)];
    const restored = existing.future[existing.future.length - 1];
    setHistoryBySymbol((prev) => ({
      ...prev,
      [symbol]: { past: [...existing.past, current], future: existing.future.slice(0, -1) },
    }));
    setDrawingsBySymbol((prev) => ({ ...prev, [symbol]: restored }));
  }, [historyBySymbol, symbol]);

  /**
   * Idempotent diff of the live primitives against the active drawing list.
   * Called both from the chart-build effect (so drawings are re-attached to a
   * freshly created series) and from the sync effect below (so a change to the
   * list is reflected without rebuilding the chart).
   */
  const syncPrimitives = useCallback((series: ISeriesApi<"Candlestick">, list: readonly Drawing[]) => {
    const live = primitivesRef.current;
    const wanted = new Set(list.map((d) => d.id));
    for (const [id, primitive] of live) {
      if (wanted.has(id)) continue;
      series.detachPrimitive(primitive);
      live.delete(id);
    }
    for (const drawing of list) {
      const existing = live.get(drawing.id);
      if (existing) {
        existing.setDrawing(drawing, styleFor(drawing));
        existing.setSelected(drawing.id === selectedIdRef.current);
      } else {
        const primitive = new DrawingPrimitive(drawing, styleFor(drawing));
        primitive.setSelected(drawing.id === selectedIdRef.current);
        series.attachPrimitive(primitive);
        live.set(drawing.id, primitive);
      }
    }
  }, []);

  /**
   * The single authority on press-to-pan. Pan is suppressed while a drawing tool
   * owns the pointer, and while the pointer is over a drawing that a press would
   * grab. Routing both through one function is what stops the tool effect and the
   * hover effect from overwriting each other's decision.
   */
  const syncPanMode = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    applyPanMode(chart, overDrawingRef.current || toolRef.current !== "pointer");
  }, []);

  /**
   * Places the selected drawing's label at that drawing's anchor.
   *
   * Writes a transform rather than setting state, and reads the node's size from
   * a ref instead of measuring, so following a drag or a pan costs one style
   * write and no layout. Hides the label when the drawing is scrolled out of the
   * pane, or when its anchor has no coordinate at all (the interval-change edge
   * where the primitive paints nothing).
   */
  const positionLabel = useCallback(() => {
    const node = labelRef.current;
    if (!node) return;
    // positionLabel runs on every pointer move, so an unchanged opacity is not
    // written back: a hidden label would otherwise invalidate style each frame.
    const setOpacity = (value: "0" | "1") => {
      if (node.style.opacity !== value) node.style.opacity = value;
    };
    const chart = chartRef.current;
    const id = selectedIdRef.current;
    const primitive = chart && id ? primitivesRef.current.get(id) : undefined;
    const anchor = primitive ? primitive.labelAnchor() : null;
    if (!chart || !anchor) {
      setOpacity("0");
      return;
    }
    const pane = chart.paneSize();
    if (anchor.x < 0 || anchor.x > pane.width || anchor.y < 0 || anchor.y > pane.height) {
      setOpacity("0");
      return;
    }
    const { width, height } = labelSizeRef.current;
    // Clamped inside the pane so a drawing at the very edge still has a usable
    // label, and placed above the anchor where there is room and below it
    // otherwise, so it never covers the line it describes.
    const left = Math.min(Math.max(anchor.x - width / 2, 0), Math.max(0, pane.width - width));
    const above = anchor.y - height - LABEL_OFFSET_PX;
    const top = above >= 0 ? above : Math.min(anchor.y + LABEL_OFFSET_PX, Math.max(0, pane.height - height));
    node.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    setOpacity("1");
  }, []);

  const detachPreview = useCallback(() => {
    const preview = previewRef.current;
    previewRef.current = null;
    const series = previewSeriesRef.current;
    previewSeriesRef.current = null;
    if (preview && series && series === candleSeriesRef.current) series.detachPrimitive(preview);
  }, []);

  const cancelPending = useCallback(() => {
    detachPreview();
    setPending(null);
  }, [detachPreview, setPending]);

  // Picking a different tool abandons an in-progress drawing, so a second click
  // can never land on a tool other than the one the preview was drawn for.
  const selectTool = useCallback(
    (next: ToolbarTool) => {
      if (pendingRef.current) cancelPending();
      setTool(next);
    },
    [cancelPending, setTool]
  );

  // Mirror for the chart-build effect, which must not depend on the drawings state.
  useEffect(() => {
    drawingsRef.current = drawingsBySymbol;
  }, [drawingsBySymbol]);

  const { candles, historyCandles, isLoading, isError, historyFetched, wsPending } = useCandleFeed(symbol, interval, market);
  const n = candles.length;
  const hasChartData = useMemo(() => toCandleData(candles).length > 0, [candles]);

  const syncPriceLines = useCallback((series: ISeriesApi<"Candlestick">, levels: readonly OrderLevel[]) => {
    for (const line of priceLinesRef.current) series.removePriceLine(line);
    priceLinesRef.current = levels
      .filter((level) => Number.isFinite(level.price) && level.price > 0)
      .map((level) =>
        series.createPriceLine({
          price: level.price,
          color: LEVEL_COLORS[level.color].line,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: level.detail ? level.label + " · " + level.detail : level.label,
        })
      );
  }, []);

  // Bar lookup for the magnet, keyed on the same UTC-seconds normalisation the
  // series data uses, so a snapped price always comes from the bar under the
  // pointer rather than a near-miss neighbour.
  useEffect(() => {
    const map = new Map<number, KlineCandle>();
    for (const candle of candles) {
      if (Number.isFinite(candle.time) && candle.time > 0) map.set(Math.floor(candle.time / 1000), candle);
    }
    barByTimeRef.current = map;
  }, [candles]);

  // Chart instance. Rebuilt per pair/interval so the viewport resets to the
  // latest candles, matching the canvas engine's behaviour.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // The map is only ever mutated, never replaced, so the effect and its
    // cleanup can share this reference.
    const livePrimitives = primitivesRef.current;

    const intraday = !["1d", "1w", "1mn", "6mh", "1y"].includes(interval);
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: APP_CHART_BACKGROUND },
        textColor: "rgba(255,255,255,0.45)",
        fontSize: 10,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        // The TradingView attribution logo is required by the Apache-2.0 licence.
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)", scaleMargins: { top: 0.12, bottom: 0.22 } },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        barSpacing: isMobile ? 3.5 : 5,
        minBarSpacing: 1.5,
        timeVisible: intraday,
        secondsVisible: interval === "1s",
        rightOffset: 4,
        tickMarkFormatter: (time) => {
          const seconds = chartTimeToSeconds(time);
          return seconds === null ? null : formatStamp(seconds, interval);
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.25)", labelBackgroundColor: "#3b3f4a", style: LineStyle.Dashed },
        horzLine: { color: "rgba(255,255,255,0.25)", labelBackgroundColor: "#3b3f4a", style: LineStyle.Dashed },
      },
      // Touch gestures come from the library: one-finger horizontal drag pans,
      // two-finger pinch zooms. No hand-rolled pointer handling needed.
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true, axisDoubleClickReset: true },
      localization: {
        priceFormatter: formatPrice,
        timeFormatter: (t: number) => formatStamp(t, interval),
      },
    });

    const candlesSeries = chart.addSeries(CandlestickSeries, {
      upColor: BULL_COLOR,
      downColor: BEAR_COLOR,
      wickUpColor: BULL_COLOR,
      wickDownColor: BEAR_COLOR,
      borderVisible: false,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineStyle: LineStyle.Dotted,
      priceLineWidth: 1,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candlesSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "",
      priceFormat: { type: "volume" },
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale("").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeriesRef.current = volumeSeries;

    const ma7Series = chart.addSeries(LineSeries, { color: "#F0B90B", lineWidth: 1, crosshairMarkerVisible: false, priceLineVisible: false });
    const ma25Series = chart.addSeries(LineSeries, { color: "#E040FB", lineWidth: 1, crosshairMarkerVisible: false, priceLineVisible: false });
    const ma99Series = chart.addSeries(LineSeries, { color: "#00BCD4", lineWidth: 1, crosshairMarkerVisible: false, priceLineVisible: false });
    ma7SeriesRef.current = ma7Series;
    ma25SeriesRef.current = ma25Series;
    ma99SeriesRef.current = ma99Series;

    priceLinesRef.current = [];
    syncPriceLines(candlesSeries, orderLevelsRef.current);

    // Drawings are keyed by symbol in React state, so the rebuild re-attaches
    // them to the new series rather than inheriting anything from the old chart.
    livePrimitives.clear();
    syncPrimitives(candlesSeries, drawingsRef.current[symbol] ?? NO_DRAWINGS);
    syncPanMode();

    const onCrosshair = (param: MouseEventParams<Time>) => {
      // Live preview of a drawing whose first point is already placed. The
      // primitive is left with a single point when the pointer leaves the pane,
      // which paints nothing rather than a stale segment.
      const pendingDrawing = pendingRef.current;
      if (pendingDrawing) {
        const cursor = pointFromParam(chart, candlesSeries, param, barByTimeRef.current);
        previewRef.current?.setPoints(
          cursor ? [...pendingDrawing.points, cursor] : pendingDrawing.points
        );
      }

      if (!param.time || !param.point) {
        setLegend(null);
        return;
      }
      const bar = param.seriesData.get(candlesSeries) as
        | { open: number; high: number; low: number; close: number }
        | undefined;
      if (!bar) {
        setLegend(null);
        return;
      }
      const volBar = param.seriesData.get(volumeSeries) as { value?: number } | undefined;
      const ma7Bar = param.seriesData.get(ma7Series) as { value?: number } | undefined;
      const ma25Bar = param.seriesData.get(ma25Series) as { value?: number } | undefined;
      const ma99Bar = param.seriesData.get(ma99Series) as { value?: number } | undefined;
      setLegend({
        o: bar.open, h: bar.high, l: bar.low, c: bar.close,
        v: volBar?.value,
        ma7: ma7Bar?.value,
        ma25: ma25Bar?.value,
        ma99: ma99Bar?.value,
      });
    };
    chart.subscribeCrosshairMove(onCrosshair);

    const onChartClick = (param: MouseEventParams<Time>) => {
      const point = pointFromParam(chart, candlesSeries, param, barByTimeRef.current);
      if (!point) return;
      const activeTool = toolRef.current;

      if (activeTool === "pointer") {
        const hovered = param.hoveredInfo;
        const id =
          hovered && hovered.sourceKind === "series-primitive" && typeof hovered.objectId === "string"
            ? hovered.objectId
            : typeof param.hoveredObjectId === "string"
              ? param.hoveredObjectId
              : null;
        setSelectedId(id && primitivesRef.current.has(id) ? id : null);
        return;
      }

      const pendingDrawing = pendingRef.current;
      if (!pendingDrawing) {
        // Start every multi-click tool with a live preview. The preview receives
        // the current cursor point on crosshair moves, so channels and fib
        // extensions remain understandable before the final click.
        if (CLICKS_REQUIRED[activeTool] > 1) {
          const previewDrawing = createDrawing(activeTool, symbol, [point]);
          const preview = new DrawingPrimitive(previewDrawing, styleFor(previewDrawing));
          preview.setCursorStyle("crosshair");
          candlesSeries.attachPrimitive(preview);
          previewRef.current = preview;
          previewSeriesRef.current = candlesSeries;
          setPending({ tool: activeTool, points: [point] });
        } else {
          addDrawing(createDrawing(activeTool, symbol, [point]));
        }
        return;
      }

      const nextPoints = [...pendingDrawing.points, point];
      const required = CLICKS_REQUIRED[pendingDrawing.tool];
      const lastPoint = pendingDrawing.points[pendingDrawing.points.length - 1];
      const isDuplicate = point.time === lastPoint.time && point.price === lastPoint.price;
      if (isDuplicate) return;

      if (nextPoints.length >= required) {
        addDrawing(createDrawing(pendingDrawing.tool, symbol, nextPoints.slice(0, required)));
        detachPreview();
        setPending(null);
      } else {
        // Multi-stage tools (channel/fib extension) keep the first anchors and
        // wait for the next semantic click instead of finalising too early.
        previewRef.current?.setPoints(nextPoints);
        setPending({ tool: pendingDrawing.tool, points: nextPoints });
      }
    };
    chart.subscribeClick(onChartClick);

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshair);
      chart.unsubscribeClick(onChartClick);
      priceLinesRef.current = [];
      // The primitives die with the disposed series; only the references are dropped.
      livePrimitives.clear();
      previewRef.current = null;
      previewSeriesRef.current = null;
      // The drag targets a primitive that dies with this series, so a rebuild
      // abandons it rather than committing points onto a fresh primitive.
      dragRef.current = null;
      overDrawingRef.current = false;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ma7SeriesRef.current = null;
      ma25SeriesRef.current = null;
      ma99SeriesRef.current = null;
      chartRef.current = null;
      chart.remove();
    };
  }, [symbol, interval, addDrawing, detachPreview, setPending, setSelectedId, syncPanMode, syncPrimitives, syncPriceLines]);

  // Full loads/history changes replace the series; live updates touch only the
  // latest bar so the current candle can move without resetting the whole chart.
  useEffect(() => {
    const candlesSeries = candleSeriesRef.current;
    const chart = chartRef.current;
    if (!candlesSeries || !chart) return;
    
    const candleData = toCandleData(candles);
    const key = `${symbol}|${interval}`;
    const latestIndex = candleData.length - 1;
    const lastCandle = candleData[latestIndex] ?? null;
    const previousLastCandle = lastCandleRef.current;
    const lastCandleTime = lastCandle ? chartTimeToSeconds(lastCandle.time) : null;
    const previousLastCandleTime = previousLastCandle
      ? chartTimeToSeconds(previousLastCandle.time)
      : null;
    const historyChanged = appliedHistoryRef.current !== historyCandles;
    const canUpdateLastCandle =
      !historyChanged &&
      candleDataSeriesRef.current === candlesSeries &&
      candleDataContextRef.current === key &&
      previousLastCandleTime !== null &&
      lastCandle !== null &&
      lastCandleTime !== null &&
      lastCandleTime >= previousLastCandleTime;
    if (canUpdateLastCandle) {
      candlesSeries.update(lastCandle);
      const volumeSeries = volumeSeriesRef.current;
      if (volumeSeries) {
        const lastVolCandle = candles[candles.length - 1];
        if (
          lastVolCandle &&
          Number.isFinite(lastVolCandle.time) &&
          lastVolCandle.time > 0 &&
          Number.isFinite(lastVolCandle.volume) &&
          [lastVolCandle.open, lastVolCandle.high, lastVolCandle.low, lastVolCandle.close].every((v) => Number.isFinite(v) && v > 0)
        ) {
          volumeSeries.update({
            time: Math.floor(lastVolCandle.time / 1000) as UTCTimestamp,
            value: lastVolCandle.volume,
            color: lastVolCandle.close >= lastVolCandle.open ? "rgba(37,171,66,0.35)" : "rgba(246,70,93,0.35)",
          });
        }
      }

      const ma7Series = ma7SeriesRef.current;
      const ma25Series = ma25SeriesRef.current;
      const ma99Series = ma99SeriesRef.current;
      if (ma7Series) {
        const pt = calculateSingleSMA(candleData, 7);
        if (pt) ma7Series.update(pt);
      }
      if (ma25Series) {
        const pt = calculateSingleSMA(candleData, 25);
        if (pt) ma25Series.update(pt);
      }
      if (ma99Series) {
        const pt = calculateSingleSMA(candleData, 99);
        if (pt) ma99Series.update(pt);
      }
    } else {
      candlesSeries.setData(candleData);
      const volumeSeries = volumeSeriesRef.current;
      if (volumeSeries) volumeSeries.setData(toVolumeData(candles));

      const ma7Series = ma7SeriesRef.current;
      const ma25Series = ma25SeriesRef.current;
      const ma99Series = ma99SeriesRef.current;
      if (ma7Series) ma7Series.setData(calculateSMA(candleData, 7));
      if (ma25Series) ma25Series.setData(calculateSMA(candleData, 25));
      if (ma99Series) ma99Series.setData(calculateSMA(candleData, 99));
    }
    lastCandleRef.current = lastCandle;
    candleDataContextRef.current = key;
    candleDataSeriesRef.current = candlesSeries;
    appliedHistoryRef.current = historyCandles;
    // Only reset the viewport when the pair/interval changes. Doing this on
    // every tick would yank the view back on each WS message and make panning
    // and pinch-zoom impossible; the library already keeps the right edge
    // pinned when the user is already at it.
    if (fittedRef.current !== key) {
      fittedRef.current = key;
      const total = candleData.length;
      const initialVisibleBars = window.matchMedia("(max-width: 640px)").matches ? 150 : 130;
      chart.timeScale().setVisibleLogicalRange({
        from: Math.max(0, total - initialVisibleBars),
        to: total + 4,
      });
    }
  }, [candles, historyCandles, symbol, interval]);

  // Keep the latest levels in a ref so an interval/pair chart rebuild can
  // replay them immediately, then update the current series without rebuilding
  // the chart when an order or TP/SL changes.
  useEffect(() => {
    orderLevelsRef.current = orderLevels;
    const series = candleSeriesRef.current;
    if (!series) return;
    syncPriceLines(series, orderLevels);
  }, [orderLevels, syncPriceLines]);

  // Drawings for the active symbol. This is the second of the two attach points:
  // the chart-build effect handles the teardown/rebuild, this one handles the
  // list changing while the chart is already up. syncPrimitives is idempotent,
  // so running it from both is free.
  useEffect(() => {
    const node = labelRef.current;
    if (!node) return;
    // Measured here rather than inside positionLabel: reading offsetWidth on every
    // crosshair move would force a layout on every frame.
    const observer = new ResizeObserver(() => {
      labelSizeRef.current = { width: node.offsetWidth, height: node.offsetHeight };
      positionLabel();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [positionLabel]);

  const selectedDrawing = selectedId ? drawings.find((d) => d.id === selectedId) ?? null : null;

  // The label's content comes from state, but its position is imperative, so
  // repaint it whenever the selection, the drawing, or the viewport changes.
  useEffect(() => {
    positionLabel();
  }, [positionLabel, selectedDrawing, selectedId]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    positionLabel();
  }, [candles, positionLabel]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Everything that can move a drawing without changing state has to be
    // listened to, because the label's position is imperative:
    //  - window mousemove covers panning, dragging a drawing, and dragging the
    //    price scale, which has no change subscription of its own;
    //  - the visible logical range covers wheel and pinch zoom;
    //  - the container observer covers a resize (IChartApi has no size
    //    subscription, and timeScale().subscribeSizeChange misses height only).
    const onChange = () => positionLabel();
    const observer = new ResizeObserver(onChange);
    observer.observe(container);
    const timeScale = chartRef.current?.timeScale();
    timeScale?.subscribeVisibleLogicalRangeChange(onChange);
    window.addEventListener("mousemove", onChange);
    return () => {
      observer.disconnect();
      timeScale?.unsubscribeVisibleLogicalRangeChange(onChange);
      window.removeEventListener("mousemove", onChange);
    };
  }, [interval, positionLabel, symbol]);

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;
    syncPrimitives(series, drawings);
    // An undo can restore a snapshot that no longer holds the selected drawing,
    // which would leave the trash button live on a selection that is not there.
    if (selectedIdRef.current && !drawings.some((d) => d.id === selectedIdRef.current)) setSelectedId(null);
    positionLabel();
  }, [drawings, symbol, setSelectedId, syncPrimitives, positionLabel]);

  /**
   * Claims the press before it becomes a pan.
   *
   * Done by flipping the library's own press-to-pan option while the pointer is
   * over a drawing, rather than by swallowing mousedown in the capture phase:
   * where the library binds its pan handler is an internal detail, and
   * applyOptions is the supported way to say "this press is not a pan". Only
   * edges crossing a drawing boundary reapply the options, so ordinary panning
   * and zooming are untouched.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const setOverDrawing = (next: boolean) => {
      if (overDrawingRef.current === next) return;
      overDrawingRef.current = next;
      syncPanMode();
    };

    const onHover = (event: MouseEvent) => {
      // A drag owns the press, and the claim it was granted still holds, so the
      // hover must not hand panning back mid-gesture.
      if (dragRef.current) return;
      if (toolRef.current !== "pointer") {
        setOverDrawing(false);
        return;
      }
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      let hit = false;
      for (const primitive of primitivesRef.current.values()) {
        if (primitive.pickAt(x, y)) {
          hit = true;
          break;
        }
      }
      setOverDrawing(hit);
    };

    const onLeave = () => setOverDrawing(false);
    container.addEventListener("mousemove", onHover);
    container.addEventListener("mouseleave", onLeave);
    return () => {
      container.removeEventListener("mousemove", onHover);
      container.removeEventListener("mouseleave", onLeave);
      setOverDrawing(false);
    };
  }, [syncPanMode]);

  /**
   * Move and resize by dragging a drawing, with the pointer tool active. The
   * press is already claimed by the hover effect above, so this only has to
   * decide what is being grabbed and then track the pointer on the window, which
   * keeps a drag alive when the pointer leaves the pane.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const endDrag = () => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("mouseleave", endDrag);
      // The primitive holds the live drag result, so that is what gets recorded.
      // A press that never moved the pointer is just a selection, and committing
      // it would cost a pointless undo step for the most common interaction.
      const primitive = primitivesRef.current.get(drag.id);
      if (!primitive) return;
      const points = primitive.points;
      const moved =
        points.length !== drag.origin.length ||
        points.some((p, i) => p.time !== drag.origin[i].time || p.price !== drag.origin[i].price);
      if (moved) replacePoints(drag.id, points);
    };

    const onDragMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      const chart = chartRef.current;
      const series = candleSeriesRef.current;
      if (!drag || !chart || !series) return;
      const primitive = primitivesRef.current.get(drag.id);
      if (!primitive) return;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (drag.part === "anchor" && drag.anchorIndex >= 0) {
        const time = chart.timeScale().coordinateToTime(x);
        const price = series.coordinateToPrice(y);
        // coordinateToTime is typed as Time, which can be a BusinessDay; an
        // anchor has to be a real bar stamp, so anything else is off the grid.
        if (typeof time !== "number" || price === null) return;
        const next = drag.origin.slice();
        next[drag.anchorIndex] = { time, price: snapToOhlc(barByTimeRef.current.get(time), series, price) };
        primitive.setPoints(next);
        return;
      }

      // Body drag: the pointer delta is added in pixels, not as a price offset,
      // because equal price offsets are unequal pixel offsets on a non-linear
      // price scale and a sloped line would visibly change shape.
      const next: DrawingPoint[] = [];
      for (let i = 0; i < drag.originPixels.length; i += 1) {
        const targetX = drag.originPixels[i].x + (x - drag.startX);
        const targetY = drag.originPixels[i].y + (y - drag.startY);
        const time = chart.timeScale().coordinateToTime(targetX);
        const price = series.coordinateToPrice(targetY);
        if (typeof time !== "number" || price === null) return;
        // hray is horizontal by definition, so it tracks the dragged price and
        // keeps its bar rather than sliding sideways to one that means nothing.
        next.push(drag.origin.length === 1 ? { time: drag.origin[0].time, price } : { time, price });
      }
      primitive.setPoints(next);
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0 || toolRef.current !== "pointer") return;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Iterating to the end without breaking, so the last primitive to report a
      // hit wins: that is the one the user sees on top, and therefore the one
      // they think they grabbed.
      let hit: { id: string; pick: NonNullable<DrawingPick> } | null = null;
      for (const [id, primitive] of primitivesRef.current) {
        const pick = primitive.pickAt(x, y);
        if (pick) hit = { id, pick };
      }
      if (!hit) return;
      const primitive = primitivesRef.current.get(hit.id);
      const originPixels = primitive?.anchorPixels();
      if (!primitive || !originPixels) return;

      // Stops the browser starting a text selection for the length of the drag.
      event.preventDefault();
      setSelectedId(hit.id);
      dragRef.current = {
        id: hit.id,
        part: hit.pick.kind,
        anchorIndex: hit.pick.kind === "anchor" ? hit.pick.index : -1,
        startX: x,
        startY: y,
        origin: primitive.points,
        originPixels,
      };
      window.addEventListener("mousemove", onDragMove);
      window.addEventListener("mouseup", endDrag);
      window.addEventListener("mouseleave", endDrag);
    };

    container.addEventListener("mousedown", onMouseDown);
    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("mouseleave", endDrag);
    };
  }, [replacePoints, setSelectedId]);

  useEffect(() => {
    for (const [id, primitive] of primitivesRef.current) primitive.setSelected(id === selectedId);
  }, [selectedId]);

  useEffect(() => {
    syncPanMode();
    // The library writes the hovered drawing's cursor as an inline style, so a
    // primitive hit has to report crosshair while a tool owns the pointer. With
    // the pointer tool it reports "move", which is honest: a hit is draggable.
    const cursor = tool === "pointer" ? "move" : "crosshair";
    for (const primitive of primitivesRef.current.values()) primitive.setCursorStyle(cursor);
  }, [syncPanMode, tool]);

  // A tool choice or a selection belongs to the pair it was made on.
  useEffect(() => {
    setTool("pointer");
    setSelectedId(null);
    cancelPending();
  }, [symbol, interval, cancelPending, setSelectedId, setTool]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "Escape") {
        if (pendingRef.current) cancelPending();
        else if (selectedIdRef.current) setSelectedId(null);
        return;
      }
      // Undo/redo before the Delete check, and only with a modifier, so plain z
      // and y stay available as type-ahead characters.
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
          return;
        }
        if (key === "y") {
          event.preventDefault();
          redo();
          return;
        }
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedIdRef.current) {
        event.preventDefault();
        removeDrawing(selectedIdRef.current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelPending, redo, removeDrawing, setSelectedId, undo]);

  const first = candles[0];
  const last = candles[candles.length - 1];
  const changePct = first && last && first.open ? ((last.close - first.open) / first.open) * 100 : null;

  const waitingForInitialData = !historyFetched && wsPending;
  const showSpinner = !hasChartData && (isLoading || waitingForInitialData);
  const showLoadError = isError && !hasChartData && !isLoading;
  const showEmptyState =
    !hasChartData &&
    !isLoading &&
    !isError &&
    (historyFetched || !wsPending);
  const drawing = tool !== "pointer";

  return (
    <div className="relative w-full h-full select-none">
      {/* The library removes its inline cursor when nothing is hovered, so this
          covers the crosshair feedback for the empty parts of the pane. */}
      <div ref={containerRef} className={`absolute inset-0 ${drawing ? "cursor-crosshair" : ""}`} />

      {(legend || changePct !== null) && (
        <div className="pointer-events-none absolute top-1 left-2 z-10 flex flex-wrap items-center gap-x-2 text-[10px] font-mono">
          <span className="font-bold text-white/90">{symbol}</span>
          {changePct !== null && (
            <span className={changePct >= 0 ? "text-[#25AB42]" : "text-[#F6465D]"}>
              {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(2)}%
            </span>
          )}
          {legend && (
            <span className="flex gap-2 text-white/50 flex-wrap">
              <span>O <span className="text-white/80">{formatPrice(legend.o)}</span></span>
              <span>H <span className="text-white/80">{formatPrice(legend.h)}</span></span>
              <span>L <span className="text-white/80">{formatPrice(legend.l)}</span></span>
              <span>C <span className="text-white/80">{formatPrice(legend.c)}</span></span>
              {legend.v !== undefined && <span>V <span className="text-white/80">{legend.v.toLocaleString("en-US")}</span></span>}
              {legend.ma7 !== undefined && <span style={{ color: "#F0B90B" }}>MA(7) <span className="text-white/80">{formatPrice(legend.ma7)}</span></span>}
              {legend.ma25 !== undefined && <span style={{ color: "#E040FB" }}>MA(25) <span className="text-white/80">{formatPrice(legend.ma25)}</span></span>}
              {legend.ma99 !== undefined && <span style={{ color: "#00BCD4" }}>MA(99) <span className="text-white/80">{formatPrice(legend.ma99)}</span></span>}
            </span>
          )}
        </div>
      )}

      {showSpinner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-white/40">
            {waitingForInitialData ? "Connecting to live chart..." : "Loading chart data..."}
          </span>
        </div>
      )}

      {(showEmptyState || showLoadError) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
          <div className="flex max-w-xs flex-col items-center gap-2 text-center">
            <FiBarChart2 size={24} className="text-white/25" />
            <span className="text-sm font-semibold text-white/60">
              {showLoadError ? "Unable to load chart data" : "No chart data available"}
            </span>
            <span className="text-xs leading-relaxed text-white/35">
              {showLoadError
                ? "Please try again later."
                : `There is no candle data for ${symbol} at this interval. Try another interval.`}
            </span>
          </div>
        </div>
      )}

      {n > 0 && !isLoading && (
        <div className="absolute bottom-2 right-2 z-10 flex flex-col rounded-md overflow-hidden border border-white/10 bg-black/50">
          <button
            aria-label="Show most recent candles"
            onClick={() => chartRef.current?.timeScale().scrollToRealTime()}
            className="flex items-center justify-center w-7 h-7 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <FiChevronsRight size={13} />
          </button>
        </div>
      )}

      {selectedDrawing && (
        <>
          {/* Data label. The wrapper ignores pointer events so a press over the
              label never reaches the chart, while the close button opts back in
              so it can actually be clicked. Position is a transform written by
              positionLabel; opacity 0 until the first successful placement. */}
          <div
            ref={labelRef}
            style={{ opacity: 0 }}
            className="pointer-events-none absolute top-0 left-0 z-20 flex items-stretch rounded border border-white/15 bg-[#181a20]/95 shadow-lg shadow-black/40"
          >
            <div className="flex min-w-0 flex-col justify-center px-1.5 py-0.5">
              <span className="text-[9px] leading-tight text-white/45">{DRAWING_LABELS[selectedDrawing.tool]}</span>
              <span className="whitespace-nowrap font-mono text-[10px] leading-tight text-white/90">
                {selectedDrawing.points.map((p) => formatPrice(p.price)).join(" → ")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeDrawing(selectedDrawing.id)}
              aria-label={`Delete ${DRAWING_LABELS[selectedDrawing.tool]}`}
              title="Delete this drawing"
              className="pointer-events-auto flex w-5 items-center justify-center border-l border-white/10 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <FaXmark size={10} />
            </button>
          </div>

          {/* Style bar, bottom-left so it does not lengthen the already tall
              vertical tool column. Swatches and widths write straight to the
              drawing record, so a restyle is one undo step. */}
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 rounded-md border border-white/10 bg-[#181a20]/95 px-1.5 py-1">
            {DRAWING_SWATCHES.map((swatch) => {
              const active = (selectedDrawing.color ?? TOOL_COLORS[selectedDrawing.tool]) === swatch.value;
              return (
                <button
                  key={swatch.value}
                  type="button"
                  onClick={() => updateDrawing(selectedDrawing.id, { color: swatch.value })}
                  aria-label={swatch.label}
                  aria-pressed={active}
                  title={swatch.label}
                  className={`h-4 w-4 rounded-full transition-transform ${
                    active ? "scale-110 ring-1 ring-white/70" : "ring-1 ring-white/20 hover:ring-white/50"
                  }`}
                  style={{ backgroundColor: swatch.value }}
                />
              );
            })}
            <div className="mx-0.5 h-4 w-px bg-white/10" />
            {DRAWING_WIDTHS.map((width) => {
              const active = (selectedDrawing.lineWidth ?? 1) === width;
              return (
                <button
                  key={width}
                  type="button"
                  onClick={() => updateDrawing(selectedDrawing.id, { lineWidth: width })}
                  aria-label={`${width}px line`}
                  aria-pressed={active}
                  title={`${width}px`}
                  className={`flex h-4 w-4 items-center justify-center rounded transition-colors ${
                    active ? "bg-white/15 text-white" : "text-white/45 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="block w-3.5 rounded-full bg-current" style={{ height: width }} />
                </button>
              );
            })}
          </div>
        </>
      )}

      <DrawingToolbar
        tool={tool}
        onSelectTool={selectTool}
        canDelete={selectedId !== null}
        onDelete={() => selectedIdRef.current && removeDrawing(selectedIdRef.current)}
        pending={pending !== null}
        pendingHint={pending ? "Click anchor " + (pending.points.length + 1) + " of " + CLICKS_REQUIRED[pending.tool] : undefined}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
    </div>
  );
}
