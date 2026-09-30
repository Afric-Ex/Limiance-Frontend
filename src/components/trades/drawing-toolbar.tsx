"use client";
import type { IconType } from "react-icons";
import {
  FaArrowTrendUp,
  FaChartLine,
  FaDivide,
  FaHandPointer,
  FaRotateLeft,
  FaRotateRight,
  FaRulerHorizontal,
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
  { tool: "hray", label: DRAWING_LABELS.hray, Icon: FaRulerHorizontal, hint: "Click one price" },
  { tool: "rectangle", label: DRAWING_LABELS.rectangle, Icon: FaShapes, hint: "Click two opposite corners" },
  { tool: "fib", label: DRAWING_LABELS.fib, Icon: FaDivide, hint: "Click the 0% and 100% anchors" },
];

const BUTTON =
  "flex items-center justify-center w-7 h-7 transition-colors disabled:cursor-not-allowed";
const IDLE = "text-white/60 hover:text-white hover:bg-white/10";
const ACTIVE = "bg-white/10 text-white";

/**
 * Vertical tool column for the lwc chart. Purely controlled: it holds no state,
 * so it only re-renders when the tool, the delete affordance, or the pending
 * flag changes. The button geometry and colour scale match the existing
 * "scroll to real-time" control in candlestick-chart-lwc.
 */
export function DrawingToolbar({
  tool,
  onSelectTool,
  canDelete,
  onDelete,
  pending,
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
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex flex-col rounded-md overflow-hidden border border-white/10 bg-[#181a20]/95">
      <ToolButton entry={POINTER} active={tool === "pointer"} onSelect={onSelectTool} />
      <div className="h-px bg-white/10" />
      {TOOLS.map((entry) => (
        <ToolButton
          key={entry.tool}
          entry={entry}
          active={tool === entry.tool}
          pending={pending && tool === entry.tool}
          onSelect={onSelectTool}
        />
      ))}
      <div className="h-px bg-white/10" />
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title={canUndo ? "Undo (Ctrl+Z)" : "Nothing to undo"}
        className={`${BUTTON} ${canUndo ? IDLE : "text-white/20"}`}
      >
        <FaRotateLeft size={13} />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title={canRedo ? "Redo (Ctrl+Shift+Z)" : "Nothing to redo"}
        className={`${BUTTON} ${canRedo ? IDLE : "text-white/20"}`}
      >
        <FaRotateRight size={13} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        aria-label="Delete selected drawing"
        title={canDelete ? "Delete selected drawing" : "Select a drawing to delete it"}
        className={`${BUTTON} ${canDelete ? IDLE : "text-white/20"}`}
      >
        <FaTrashCan size={13} />
      </button>
    </div>
  );
}

function ToolButton({
  entry,
  active,
  pending = false,
  onSelect,
}: {
  entry: ToolEntry;
  active: boolean;
  pending?: boolean;
  onSelect: (tool: ToolbarTool) => void;
}) {
  const { tool, label, hint, Icon } = entry;
  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      aria-label={label}
      aria-pressed={active}
      title={pending ? "Escape to cancel" : `${label} — ${hint}`}
      className={`${BUTTON} ${active ? ACTIVE : IDLE}`}
    >
      <Icon size={13} />
    </button>
  );
}
