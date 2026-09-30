import {
  LineStyle,
  type Coordinate,
  type DrawingUtils,
  type IPrimitivePaneRenderer,
  type IPrimitivePaneView,
  type ISeriesPrimitive,
  type ISeriesPrimitiveAxisView,
  type PrimitiveHoveredItem,
  type PrimitivePaneViewZOrder,
  type SeriesAttachedParameter,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

/**
 * Chart drawing tools, rendered as lightweight-charts series primitives.
 *
 * Primitives rather than a hand-rolled overlay <canvas>: the library owns the
 * pan/zoom/resize invalidation, so a drawing stays glued to its time/price
 * anchors without any resize observers or viewport maths of our own. Same
 * reasoning as the order levels in candlestick-chart-lwc, which use the native
 * createPriceLine instead of manual canvas drawing.
 */

export type DrawingTool = "trendline" | "ray" | "hray" | "rectangle" | "fib";

/** Stroke widths the style bar offers. Kept narrow so a drawing never out-shouts the candles. */
export type DrawingLineWidth = 1 | 2 | 3 | 4;

export type DrawingPoint = { time: number; price: number };

/** Human names, shared by the toolbar's tooltips and the selected-drawing label. */
export const DRAWING_LABELS: Record<DrawingTool, string> = {
  trendline: "Trend line",
  ray: "Ray",
  hray: "Horizontal ray",
  rectangle: "Rectangle",
  fib: "Fibonacci retracement",
};


/**
 * Serialisable by design: plain JSON, no class instances, no Date, no Map. Time
 * is UTC epoch seconds — the same normalisation the candle feed already applies
 * — so a later persistence task can store and restore a record as-is.
 */
export type Drawing = {
  id: string;
  tool: DrawingTool;
  /** Denormalised so a per-symbol query never needs a join. */
  symbol: string;
  /** One point for hray, two for everything else. */
  points: DrawingPoint[];
  color?: string;
  lineWidth?: DrawingLineWidth;
};

export const DRAWING_TOOLS: readonly DrawingTool[] = ["trendline", "ray", "hray", "rectangle", "fib"];

/**
 * The ray is two-click like trendline/rectangle/fib: two points are the only
 * information that fully determines its slope, so a one-click ray would have to
 * invent a default the user cannot predict. It also buys a live preview between
 * the clicks, which is what makes Escape meaningful.
 */
export const CLICKS_REQUIRED: Record<DrawingTool, 1 | 2> = {
  hray: 1,
  trendline: 2,
  ray: 2,
  rectangle: 2,
  fib: 2,
};

export const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1] as const;

/** Presentation values the chart owns; passed in so the palette stays single-sourced. */
export type DrawingStyle = {
  color: string;
  /** Chart background, used to ring the anchor dots so they read over candles. */
  background: string;
  /** The chart's own price formatter, so axis labels match the price scale. */
  formatPrice: (value: number) => string;
};

const HIT_TOLERANCE_PX = 6;
const HIT_TOLERANCE_HRAY_PX = 5;
/** Grab radius for a single anchor handle, generous enough to hit without a magnifier. */
const ANCHOR_HIT_PX = 6;
/** A trendline is capped here past its anchors so the anchor dots sit on the ends. */
const ANCHOR_CAP_PX = 4;
const FILL_ALPHA = 0.08;
const ANCHOR_RADIUS_PX = 3;
const RING_WIDTH_PX = 1;
/** Ceiling on the +1px selection emphasis, so a 4px drawing does not become 5px. */
const MAX_STROKE_PX = 4;

const EMPTY_AXIS_VIEWS: readonly ISeriesPrimitiveAxisView[] = [];
const EMPTY_PANE_VIEWS: readonly IPrimitivePaneView[] = [];

// The canvas target type is not re-exported from the package root, but it is
// reachable through the renderer interface — no dependency on fancy-canvas.
type DrawingTarget = Parameters<IPrimitivePaneRenderer["draw"]>[0];

type Pt = { x: number; y: number };

/** A pixel position in pane CSS coordinates. */
export type PixelPoint = { x: number; y: number };

/** What a pointer landed on: an anchor handle (draggable) or the drawing body. */
export type DrawingPick = { kind: "anchor"; index: number } | { kind: "body" } | null;

type AxisLabel = { price: number; text: string };

type FibLevel = { y: number; price: number; dashed: boolean };

/**
 * Painted geometry for one frame, in pane CSS pixels.
 *
 * `from`/`to` on a line are the *painted* endpoints (a ray's `to` is off the
 * right edge of the pane, a trendline's are capped a few px past the anchors),
 * so hit-testing and drawing always agree. `anchors` are the real anchors and
 * are the only places a dot is drawn.
 */
type Geometry =
  | { kind: "line"; from: Pt; to: Pt; anchors: Pt[]; labels: AxisLabel[]; tolerance: number }
  | {
      kind: "box";
      left: number;
      right: number;
      top: number;
      bottom: number;
      anchors: Pt[];
      labels: AxisLabel[];
      levels: readonly FibLevel[];
    };

let idCounter = 0;

function nextId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  idCounter += 1;
  return `d${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function createDrawing(tool: DrawingTool, symbol: string, points: DrawingPoint[]): Drawing {
  return { id: nextId(), tool, symbol, points: points.map((p) => ({ time: p.time, price: p.price })) };
}

function capSegment(a: Pt, b: Pt, cap: number): { from: Pt; to: Pt } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return { from: a, to: b };
  const ux = dx / len;
  const uy = dy / len;
  return { from: { x: a.x - ux * cap, y: a.y - uy * cap }, to: { x: b.x + ux * cap, y: b.y + uy * cap } };
}

/**
 * Extrapolates the anchor→direction pixel slope out to the right edge of the
 * pane. Deliberately pixel space rather than price-per-epoch-second: the time
 * axis is non-linear (session gaps, weekends, 1s vs 1D spacing), so a
 * price-per-second slope would visibly bend as the user pans.
 */
function extendRight(a: Pt, b: Pt, rightX: number): Pt {
  const dx = b.x - a.x;
  if (Math.abs(dx) < 1e-6) return { x: rightX, y: a.y };
  return { x: rightX, y: a.y + ((b.y - a.y) / dx) * (rightX - a.x) };
}

function distanceToSegment(px: number, py: number, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return Math.hypot(px - a.x, py - a.y);
  const t = Math.min(1, Math.max(0, ((px - a.x) * dx + (py - a.y) * dy) / lenSq));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
    if (full.length === 6) {
      const num = parseInt(full, 16);
      return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    }
  }
  if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  if (color.startsWith("rgba(")) return color.replace(/[\d.]+\)$/, `${alpha})`);
  return color;
}

class AxisLabelView implements ISeriesPrimitiveAxisView {
  constructor(
    private readonly price: number,
    private readonly label: string,
    private readonly labelColor: string,
    private readonly labelBackground: string,
    private readonly resolve: (price: number) => Coordinate | null
  ) {}

  coordinate(): number {
    return this.resolve(this.price) ?? -1;
  }

  text(): string {
    return this.label;
  }

  textColor(): string {
    return this.labelColor;
  }

  backColor(): string {
    return this.labelBackground;
  }

  visible(): boolean {
    return this.resolve(this.price) !== null;
  }
}

class DrawingRenderer implements IPrimitivePaneRenderer {
  constructor(private readonly owner: DrawingPrimitive) {}

  drawBackground(target: DrawingTarget): void {
    const geometry = this.owner.geometry;
    if (!geometry || geometry.kind !== "box") return;
    target.useBitmapCoordinateSpace((scope) => {
      const { context: ctx } = scope;
      ctx.save();
      ctx.fillStyle = withAlpha(this.owner.displayStyle.color, FILL_ALPHA);
      ctx.fillRect(geometry.left, geometry.top, geometry.right - geometry.left, geometry.bottom - geometry.top);
      ctx.restore();
    });
  }

  draw(target: DrawingTarget, utils?: DrawingUtils): void {
    const geometry = this.owner.geometry;
    if (!geometry) return;
    target.useBitmapCoordinateSpace((scope) => {
      const { context: ctx } = scope;
      const { color, background } = this.owner.displayStyle;
      const selected = this.owner.isDrawingSelected;
      // The context is pre-scaled by the device pixel ratio, so widths and radii
      // are in bitmap pixels and have to be scaled to stay crisp instead of
      // thinning out on HiDPI.
      const ratio = scope.horizontalPixelRatio || 1;

      ctx.save();
      ctx.lineWidth = this.owner.strokeWidthPx * ratio;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      if (geometry.kind === "line") {
        ctx.beginPath();
        ctx.moveTo(geometry.from.x, geometry.from.y);
        ctx.lineTo(geometry.to.x, geometry.to.y);
        ctx.stroke();
      } else {
        for (const level of geometry.levels) {
          ctx.beginPath();
          if (level.dashed && utils) utils.setLineStyle(ctx, LineStyle.Dashed);
          ctx.moveTo(geometry.left, level.y);
          ctx.lineTo(geometry.right, level.y);
          ctx.stroke();
          if (level.dashed && utils) utils.setLineStyle(ctx, LineStyle.Solid);
        }
        ctx.strokeRect(
          geometry.left,
          geometry.top,
          geometry.right - geometry.left,
          geometry.bottom - geometry.top
        );
      }

      if (selected) {
        for (const anchor of geometry.anchors) {
          ctx.beginPath();
          ctx.arc(anchor.x, anchor.y, ANCHOR_RADIUS_PX * ratio, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = RING_WIDTH_PX * ratio;
          ctx.strokeStyle = background;
          ctx.stroke();
        }
      }

      ctx.restore();
    });
  }
}

class DrawingPaneView implements IPrimitivePaneView {
  private rendererInstance: DrawingRenderer | null = null;

  constructor(private readonly owner: DrawingPrimitive) {}

  zOrder(): PrimitivePaneViewZOrder {
    // Above the series so a 1px stroke stays legible over candle bodies; the
    // grid is painted below series data, so this cannot hide the grid.
    return "top";
  }

  renderer(): IPrimitivePaneRenderer {
    if (!this.rendererInstance) this.rendererInstance = new DrawingRenderer(this.owner);
    return this.rendererInstance;
  }
}

/**
 * One instance per Drawing, attached to the candlestick series. The instance is
 * a thin view over a mutable record: selection and preview updates rewrite the
 * record in place and request a repaint rather than detaching and reattaching.
 */
export class DrawingPrimitive implements ISeriesPrimitive<Time> {
  private param: SeriesAttachedParameter<Time> | null = null;
  private view: DrawingPaneView | null = null;
  private views: readonly IPrimitivePaneView[] = EMPTY_PANE_VIEWS;
  private cached: Geometry | null = null;
  private dirty = true;
  private isSelected = false;
  private axisViews: readonly ISeriesPrimitiveAxisView[] = EMPTY_AXIS_VIEWS;
  private axisSignature = "";
  private cursorStyle: string | undefined = "move";

  constructor(
    private drawing: Drawing,
    private style: DrawingStyle
  ) {}

  get id(): string {
    return this.drawing.id;
  }

  get displayStyle(): DrawingStyle {
    return this.style;
  }

  get isDrawingSelected(): boolean {
    return this.isSelected;
  }

  /** The live anchor record, for a drag that has not been committed to state yet. */
  get points(): DrawingPoint[] {
    return this.drawing.points;
  }

  /**
   * Stroke width for this frame. Selection adds a pixel rather than forcing a
   * fixed 2, so a deliberately thick drawing still reads as selected without
   * changing the weight the user chose.
   */
  get strokeWidthPx(): number {
    const base = this.drawing.lineWidth ?? 1;
    return this.isSelected ? Math.min(base + 1, MAX_STROKE_PX) : base;
  }

  /**
   * Where a data label should sit for this drawing, in pane pixels, or null when
   * there is nothing painted. Each tool anchors at its own natural end: a line at
   * its far end (a ray's is the pane's right edge, where TradingView puts it), a
   * box at its top-right corner.
   */
  labelAnchor(): PixelPoint | null {
    const geometry = this.geometry;
    if (!geometry) return null;
    return geometry.kind === "line" ? { x: geometry.to.x, y: geometry.to.y } : { x: geometry.right, y: geometry.top };
  }

  /** Painted geometry for the current frame, or null when there is nothing to paint. */
  get geometry(): Geometry | null {
    if (this.dirty || this.cached === null) {
      this.cached = this.compute();
      this.dirty = false;
    }
    return this.cached;
  }

  setSelected(selected: boolean): void {
    if (this.isSelected === selected) return;
    this.isSelected = selected;
    this.invalidate();
  }

  setDrawing(drawing: Drawing, style: DrawingStyle): void {
    this.drawing = drawing;
    this.style = style;
    this.invalidate();
  }

  setPoints(points: DrawingPoint[]): void {
    this.drawing = { ...this.drawing, points };
    this.invalidate();
  }

  /** The library writes the hovered item's cursor as an inline style, so it has
   * to be told "crosshair" while a drawing tool owns the pointer. */
  setCursorStyle(cursorStyle: string | undefined): void {
    this.cursorStyle = cursorStyle;
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this.param = param;
    this.view = new DrawingPaneView(this);
    // The library caches pane views by array reference, so the array is built
    // once here rather than on every call.
    this.views = [this.view];
    this.dirty = true;
    param.requestUpdate();
  }

  detached(): void {
    this.param = null;
    this.view = null;
    this.views = EMPTY_PANE_VIEWS;
    this.cached = null;
    this.dirty = true;
    this.axisViews = EMPTY_AXIS_VIEWS;
    this.axisSignature = "";
  }

  /** Called by the library on every pan, zoom and resize, so only the cached
   * geometry is dropped — requesting an update from here would loop. */
  updateAllViews(): void {
    this.dirty = true;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return this.views;
  }

  priceAxisViews(): readonly ISeriesPrimitiveAxisView[] {
    const geometry = this.geometry;
    this.syncAxisViews(geometry ? geometry.labels : []);
    return this.axisViews;
  }

  hitTest(x: number, y: number): PrimitiveHoveredItem | null {
    const geometry = this.geometry;
    if (!geometry) return null;
    const hovered: PrimitiveHoveredItem = {
      externalId: this.drawing.id,
      zOrder: "top",
      cursorStyle: this.cursorStyle,
      itemType: "primitive",
    };
    if (geometry.kind === "line") {
      const distance = distanceToSegment(x, y, geometry.from, geometry.to);
      if (distance > geometry.tolerance) return null;
      return { ...hovered, distance, hitTestPriority: 1 };
    }
    if (x < geometry.left || x > geometry.right || y < geometry.top || y > geometry.bottom) return null;
    // Range-style hit: covered area, so the fill counts as a hit.
    return { ...hovered, distance: 0, hitTestPriority: 0, isBackground: true };
  }

  /**
   * Whether a pointer landed on a draggable handle or on the body. Anchors are
   * tested first and with a wider radius, so a handle always wins over the line
   * passing through it — otherwise a drag would move the whole drawing when the
   * user aimed for its endpoint.
   */
  pickAt(x: number, y: number): DrawingPick {
    const geometry = this.geometry;
    if (!geometry) return null;
    for (let i = 0; i < geometry.anchors.length; i += 1) {
      const anchor = geometry.anchors[i];
      if (Math.abs(x - anchor.x) <= ANCHOR_HIT_PX && Math.abs(y - anchor.y) <= ANCHOR_HIT_PX) {
        return { kind: "anchor", index: i };
      }
    }
    return this.hitTest(x, y) ? { kind: "body" } : null;
  }

  /**
   * Current anchor positions in pane pixels, or null when any anchor has no
   * coordinate. A body drag shifts these by the pointer delta and converts back,
   * which keeps the drawing rigid: shifting prices directly would change the
   * shape of a sloped line, because equal price offsets are not equal pixel
   * offsets on a non-linear price scale.
   */
  anchorPixels(): PixelPoint[] | null {
    const param = this.param;
    if (!param) return null;
    const timeScale = param.chart.timeScale();
    const out: PixelPoint[] = [];
    for (const point of this.drawing.points) {
      const x = timeScale.timeToCoordinate(point.time as UTCTimestamp);
      const y = param.series.priceToCoordinate(point.price);
      if (x === null || y === null) return null;
      out.push({ x, y });
    }
    return out;
  }

  private invalidate(): void {
    this.dirty = true;
    this.requestUpdate();
  }

  private requestUpdate(): void {
    this.param?.requestUpdate();
  }

  /**
   * The library caches axis views by array reference, so the array is only
   * rebuilt when its contents actually change.
   */
  private syncAxisViews(labels: readonly AxisLabel[]): void {
    const signature = `${this.drawing.id}|${labels.map((l) => l.text).join("|")}`;
    if (signature === this.axisSignature) return;
    this.axisSignature = signature;
    const series = this.param?.series;
    if (!series || labels.length === 0) {
      this.axisViews = EMPTY_AXIS_VIEWS;
      return;
    }
    this.axisViews = labels.map(
      (label) =>
        new AxisLabelView(label.price, label.text, this.style.color, this.style.background, (price) =>
          series.priceToCoordinate(price)
        )
    );
  }

  /**
   * Anchors are absolute UTC seconds. On draw they are always a real bar time of
   * the current interval, but an interval change moves the bar grid, so an
   * anchor can end up with no coordinate. In that case the frame paints nothing
   * rather than something in the wrong place at the wrong price.
   */
  private compute(): Geometry | null {
    const param = this.param;
    if (!param) return null;

    const required = CLICKS_REQUIRED[this.drawing.tool] ?? 2;
    if (this.drawing.points.length < required) return null;

    const { chart, series } = param;
    const timeScale = chart.timeScale();
    const anchors: Pt[] = [];
    const prices: number[] = [];
    for (const point of this.drawing.points) {
      const x = timeScale.timeToCoordinate(point.time as UTCTimestamp);
      const y = series.priceToCoordinate(point.price);
      if (x === null || y === null) return null;
      anchors.push({ x, y });
      prices.push(point.price);
    }

    const [first, second] = anchors;

    if (this.drawing.tool === "hray") {
      return {
        kind: "line",
        from: { x: 0, y: first.y },
        to: { x: chart.paneSize().width, y: first.y },
        anchors: [first],
        labels: [{ price: prices[0], text: this.style.formatPrice(prices[0]) }],
        tolerance: HIT_TOLERANCE_HRAY_PX,
      };
    }

    if (this.drawing.tool === "trendline") {
      const { from, to } = capSegment(first, second, ANCHOR_CAP_PX);
      return { kind: "line", from, to, anchors, labels: [], tolerance: HIT_TOLERANCE_PX };
    }

    if (this.drawing.tool === "ray") {
      return {
        kind: "line",
        from: first,
        to: extendRight(first, second, chart.paneSize().width),
        // Both ends stay grabbable: the second anchor is what the user drags to
        // re-aim the slope, which is otherwise impossible once the ray is drawn.
        anchors,
        labels: [],
        tolerance: HIT_TOLERANCE_PX,
      };
    }

    const levels: FibLevel[] = [];
    if (this.drawing.tool === "fib") {
      for (const ratio of FIB_LEVELS) {
        const price = prices[0] + (prices[1] - prices[0]) * ratio;
        const y = series.priceToCoordinate(price);
        if (y === null) continue;
        levels.push({ y, price, dashed: ratio === 0.5 });
      }
    }

    return {
      kind: "box",
      left: Math.min(first.x, second.x),
      right: Math.max(first.x, second.x),
      top: Math.min(first.y, second.y),
      bottom: Math.max(first.y, second.y),
      anchors,
      levels,
      labels: levels.map((level) => ({ price: level.price, text: this.style.formatPrice(level.price) })),
    };
  }
}
