"use client";
import type { IconType } from "react-icons";
import {
  FaArrowTrendUp,
  FaArrowsLeftRight,
  FaChartArea,
  FaChartLine,
  FaDivide,
  FaHandPointer,
  FaLayerGroup,
  FaRotateLeft,
  FaRotateRight,
  FaRulerHorizontal,
  FaRulerVertical,
  FaShapes,
  FaTrashCan,
} from "react-icons/fa6";
import type { DrawingTool } from "@/src/components/trades/drawing-primitives";
import { DRAWING_LABELS } from "@/src/components/trades/drawing-primitives";

export type ToolbarTool = DrawingTool | "pointer";

type ToolEntry = { tool: ToolbarTool; label: string; Icon: IconType; hint: string };

const POINTER: ToolEntry = {
  tool: "pointer",
  label: "Select and move",
  Icon: FaHandPointer,
  hint: "Select a drawing, or drag to pan and zoom",
};

const TOOLS: ToolEntry[] = [
  { tool: "trendline", label: DRAWING_LABELS.trendline, Icon: FaArrowTrendUp, hint: "Click two points" },
  { tool: "ray", label: DRAWING_LABELS.ray, Icon: FaChartLine, hint: "Click an anchor, then a direction" },
  { tool: "extended", label: DRAWING_LABELS.extended, Icon: FaArrowsLeftRight, hint: "Click two points; extend both directions" },
  { tool: "hray", label: DRAWING_LABELS.hray, Icon: FaRulerHorizontal, hint: "Click one price" },
  { tool: "hline", label: DRAWING_LABELS.hline, Icon: FaRulerHorizontal, hint: "Click one price; draw across the chart" },
  { tool: "vline", label: DRAWING_LABELS.vline, Icon: FaRulerVertical, hint: "Click one time; draw through the chart" },
  { tool: "rectangle", label: DRAWING_LABELS.rectangle, Icon: FaShapes, hint: "Click two opposite corners" },
  { tool: "channel", label: DRAWING_LABELS.channel, Icon: FaLayerGroup, hint: "Click base start, base end, then channel width" },
  { tool: "fib", label: DRAWING_LABELS.fib, Icon: FaDivide, hint: "Click the 0% and 100% anchors" },
  { tool: "fibext", label: DRAWING_LABELS.fibext, Icon: FaChartArea, hint: "Click A, B, then the extension origin" },
];

// Desktop (>=1150px): docked column with slightly larger hit targets.
const BUTTON =
  "flex items-center justify-center w-7 h-7 min-[1150px]:w-9 min-[1150px]:h-8 transition-colors disabled:cursor-not-allowed";
const DIVIDER = "h-px bg-white/10 min-[1150px]:my-1 min-[1150px]:w-5";
const IDLE = "text-white/60 hover:text-white hover:bg-white/10";
const ACTIVE = "bg-white/10 text-white";

/**
 * Vertical tool column for the lwc chart. Purely controlled: it holds no state,
 * so it only re-renders when the tool, the delete affordance, or the pending
 * flag changes. The button geometry and colour scale match the existing
 * "scroll to real-time" control in candlestick-chart-lwc.
 *
 * Desktop (>=1150px): docked as a flush column on the chart's left edge, with
 * the canvas starting after it. Below that width it keeps the original floating
 * overlay so mobile is unchanged.
 */
export function DrawingToolbar({
  tool,
  onSelectTool,
  canDelete,
  onDelete,
  pending,
  pendingHint,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  tool: ToolbarTool;
  onSelectTool: (tool: ToolbarTool) => void;
  canDelete: boolean;
  onDelete: () => void;
  pending: boolean;
  pendingHint?: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="absolute left-2 top-1/2 z-30 flex max-h-[78%] -translate-y-1/2 flex-col overflow-y-auto rounded-md border border-white/10 bg-[#181a20]/95 [scrollbar-width:none] min-[1150px]:static min-[1150px]:z-auto min-[1150px]:max-h-full min-[1150px]:w-10 min-[1150px]:shrink-0 min-[1150px]:translate-y-0 min-[1150px]:items-center min-[1150px]:rounded-none min-[1150px]:border-0 min-[1150px]:border-r min-[1150px]:border-white/[0.06] min-[1150px]:bg-transparent min-[1150px]:py-1">
      <ToolButton entry={POINTER} active={tool === "pointer"} onSelect={onSelectTool} />
      <div className={DIVIDER} />
      {TOOLS.map((entry) => (
        <ToolButton
          key={entry.tool}
          entry={entry}
          active={tool === entry.tool}
          pending={pending && tool === entry.tool}
          pendingHint={pending && tool === entry.tool ? pendingHint : undefined}
          onSelect={onSelectTool}
        />
      ))}
      <div className={DIVIDER} />
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title={canUndo ? "Undo (Ctrl+Z)" : "Nothing to undo"}
        className={`${BUTTON} ${canUndo ? IDLE : "text-white/20"}`}
      >
        <FaRotateLeft size={14} />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title={canRedo ? "Redo (Ctrl+Shift+Z)" : "Nothing to redo"}
        className={`${BUTTON} ${canRedo ? IDLE : "text-white/20"}`}
      >
        <FaRotateRight size={14} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        aria-label="Delete selected drawing"
        title={canDelete ? "Delete selected drawing" : "Select a drawing to delete it"}
        className={`${BUTTON} ${canDelete ? IDLE : "text-white/20"}`}
      >
        <FaTrashCan size={14} />
      </button>
    </div>
  );
}

function ToolButton({
  entry,
  active,
  pending = false,
  pendingHint,
  onSelect,
}: {
  entry: ToolEntry;
  active: boolean;
  pending?: boolean;
  pendingHint?: string;
  onSelect: (tool: ToolbarTool) => void;
}) {
  const { tool, label, hint, Icon } = entry;
  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      aria-label={label}
      aria-pressed={active}
      title={pending ? (pendingHint ?? "Next anchor") + " · Escape to cancel" : label + " — " + hint}
      className={`${BUTTON} ${active ? ACTIVE : IDLE}`}
    >
      <Icon size={14} />
    </button>
  );
}