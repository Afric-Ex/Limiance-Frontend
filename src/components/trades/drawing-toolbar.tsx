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
import { DRAWING_LABEL_KEYS } from "@/src/components/trades/drawing-primitives";
import { useTranslations } from "next-intl";

export type ToolbarTool = DrawingTool | "pointer";

type ToolEntry = { tool: ToolbarTool; labelKey: string; Icon: IconType; hintKey: string };

const POINTER: ToolEntry = {
  tool: "pointer",
  labelKey: "drawingSelectAndMove",
  Icon: FaHandPointer,
  hintKey: "drawingSelectAndMoveHint",
};

const TOOLS: ToolEntry[] = [
  { tool: "trendline", labelKey: DRAWING_LABEL_KEYS.trendline, Icon: FaArrowTrendUp, hintKey: "drawingHintTwoPoints" },
  { tool: "ray", labelKey: DRAWING_LABEL_KEYS.ray, Icon: FaChartLine, hintKey: "drawingHintAnchorDirection" },
  { tool: "extended", labelKey: DRAWING_LABEL_KEYS.extended, Icon: FaArrowsLeftRight, hintKey: "drawingHintTwoPointsBoth" },
  { tool: "hray", labelKey: DRAWING_LABEL_KEYS.hray, Icon: FaRulerHorizontal, hintKey: "drawingHintOnePrice" },
  { tool: "hline", labelKey: DRAWING_LABEL_KEYS.hline, Icon: FaRulerHorizontal, hintKey: "drawingHintPriceAcrossChart" },
  { tool: "vline", labelKey: DRAWING_LABEL_KEYS.vline, Icon: FaRulerVertical, hintKey: "drawingHintOneTime" },
  { tool: "rectangle", labelKey: DRAWING_LABEL_KEYS.rectangle, Icon: FaShapes, hintKey: "drawingHintOppositeCorners" },
  { tool: "channel", labelKey: DRAWING_LABEL_KEYS.channel, Icon: FaLayerGroup, hintKey: "drawingHintChannelWidth" },
  { tool: "fib", labelKey: DRAWING_LABEL_KEYS.fib, Icon: FaDivide, hintKey: "drawingHintFibAnchors" },
  { tool: "fibext", labelKey: DRAWING_LABEL_KEYS.fibext, Icon: FaChartArea, hintKey: "drawingHintFibExtension" },
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
  const t = useTranslations("Trading");
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
        aria-label={t("undo")}
        title={canUndo ? t("undoShortcut") : t("nothingToUndo")}
        className={`${BUTTON} ${canUndo ? IDLE : "text-white/20"}`}
      >
        <FaRotateLeft size={14} />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label={t("redo")}
        title={canRedo ? t("redoShortcut") : t("nothingToRedo")}
        className={`${BUTTON} ${canRedo ? IDLE : "text-white/20"}`}
      >
        <FaRotateRight size={14} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        aria-label={t("deleteSelectedDrawing")}
        title={canDelete ? t("deleteSelectedDrawing") : t("selectDrawingToDelete")}
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
  const t = useTranslations("Trading");
  const { tool, labelKey, hintKey, Icon } = entry;
  const label = t(labelKey);
  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      aria-label={label}
      aria-pressed={active}
      title={pending ? (pendingHint ?? t("nextAnchor")) + t("escapeToCancel") : label + " — " + t(hintKey)}
      className={`${BUTTON} ${active ? ACTIVE : IDLE}`}
    >
      <Icon size={14} />
    </button>
  );
}