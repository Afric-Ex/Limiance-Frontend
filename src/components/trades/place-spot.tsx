import { Slider, Loader, Popover } from "@mantine/core";
import { modals } from "@mantine/modals";
import toast from "react-hot-toast";
import { MarginBorrowRepayModal } from "./margin-borrow-repay-modal";
import { MarginTransferModal } from "./margin-transfer-modal";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { MdExpandMore, MdRefresh } from "react-icons/md";
import { icons } from "../assets/icons";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { placeSpotOrderWs, placeMarginOrderWs, placeMarginOcoOrderWs } from "@/src/lib/order-ws";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import clsx from "clsx";

export type TpslPreview = {
  buyTp?: number;
  buySl?: number;
  sellTp?: number;
  sellSl?: number;
};

interface Props {
  pair?: string;          // "BTC/USDT"
  mode?: "spot" | "cross" | "isolated";
  leverage?: number;
  onLeverageChange?: (v: number) => void;
  marketPrice?: number | null;
  clickedPrice?: number | null;
  compactSide?: "buy" | "sell";
  // Bybit-style desktop form: one Buy/Sell toggle and a single stacked form.
  sideToggle?: boolean;
  onLeverageChangeEnd?: (val: number) => void;
  onTpslChange?: (preview: TpslPreview) => void;
  onFill?: (fill: {
    side: "buy" | "sell";
    price: number;
    quantity: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
}

type AdvancedTab = "tpsl" | "oco" | "conditional" | "trailing";
type AdvancedOption = { value: AdvancedTab; label: string; disabled?: boolean };

const PERCENT_MARKS = [
  { value: 0,   label: "0%" },
  { value: 25,  label: "25%" },
  { value: 50,  label: "50%" },
  { value: 75,  label: "75%" },
  { value: 100, label: "100%" },
];

// Stacked (Bybit-style) slider: dots every 25%, labels only at the two ends.
const STACKED_MARKS = [
  { value: 0, label: "0" },
  { value: 25 },
  { value: 50 },
  { value: 75 },
  { value: 100, label: "100%" },
];

// Full class strings (not built with template literals) so Tailwind can see them.
const STACKED_SLIDER = {
  buy: {
    bar: "!bg-success-6",
    thumb: "!border-2 !border-success-6 !bg-[#181a20] !w-3 !h-3",
    mark: "!w-2 !h-2 !rounded-full !border-2 !border-success-6/40 !bg-[#181a20] !-mt-[3px]",
  },
  sell: {
    bar: "!bg-error-1",
    thumb: "!border-2 !border-error-1 !bg-[#181a20] !w-3 !h-3",
    mark: "!w-2 !h-2 !rounded-full !border-2 !border-error-1/40 !bg-[#181a20] !-mt-[3px]",
  },
} as const;

const formatAmount = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "0";

const LEVERAGE_PRESETS = [1, 3, 5, 10, 20, 50, 100];

function FieldRow({
  label,
  value,
  onChange,
  unit,
  readOnly,
  color,
  showMax,
  onMax,
  floating,
}: {
  label: string;
  value: number | string;
  onChange?: (v: number | string) => void;
  unit: string;
  readOnly?: boolean;
  color?: "buy" | "sell";
  showMax?: boolean;
  onMax?: () => void;
  floating?: boolean;
}) {
  const focusBorder = color === "buy" ? "focus-within:border-success-6" : color === "sell" ? "focus-within:border-error-1" : "";
  if (floating) {
    // Bybit-style field: small label on top, value below, unit on the right.
    return (
      <div className={clsx("flex h-11 items-center rounded-lg border border-transparent bg-white/[0.05] px-3 transition-colors", !readOnly && focusBorder, readOnly && "opacity-80")}>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="text-2xs leading-none text-white/40">{label}</span>
          <input
            type="text"
            inputMode="decimal"
            readOnly={readOnly}
            value={value !== undefined && value !== null ? value : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d*\.?\d*$/.test(val)) onChange?.(val);
            }}
            className="mt-1 h-5 w-full min-w-0 border-none bg-transparent p-0 font-mono text-sm font-semibold tabular-nums text-white outline-none placeholder-white/20 focus:ring-0"
            placeholder="0.00"
          />
        </div>
        <span className="ml-2 shrink-0 text-xs font-semibold text-white/50">{unit}</span>
      </div>
    );
  }
  return (
    <div className={clsx("flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 h-10 transition-colors", !readOnly && focusBorder, readOnly && "opacity-70")}>
      <span className="text-xs text-white/40 w-10 shrink-0">{label}</span>
      <input
        type="text"
        readOnly={readOnly}
        value={value !== undefined && value !== null ? value : ""}
        onChange={(e) => {
          const val = e.target.value;
          // Allow empty, numbers, and one decimal point
          if (val === "" || /^\d*\.?\d*$/.test(val)) {
            onChange?.(val);
          }
        }}
        className={clsx("flex-1 min-w-0 outline-none bg-transparent h-full p-0 text-sm font-semibold font-mono tabular-nums text-white border-none text-right focus:ring-0 placeholder-white/20")}
        placeholder="0.00"
      />
      {showMax && (
        <button
          type="button"
          onClick={onMax}
          className="text-2xs font-bold text-primary hover:text-primary/80 transition-colors ml-1 shrink-0"
        >
          Max
        </button>
      )}
      <span className="text-xs font-semibold text-white/40 ml-1.5 shrink-0">{unit}</span>
    </div>
  );
}

export const PlaceSpot = ({ pair = "BTC/USDT", mode = "spot", leverage = 1, onLeverageChange, marketPrice, clickedPrice, compactSide, sideToggle = false, onLeverageChangeEnd, onTpslChange, onFill }: Props) => {
  const [activeTab, setActiveTab] = useState("market");
  const [advancedTab, setAdvancedTab] = useState<AdvancedTab | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [tpslTriggerType, setTpslTriggerType] = useState<"last" | "mark" | "index">("last");
  const [tpslExecType, setTpslExecType] = useState<"limit" | "market">("limit");
  const [buyTpslTrigger, setBuyTpslTrigger] = useState<number | string>("");
  const [sellTpslTrigger, setSellTpslTrigger] = useState<number | string>("");
  const [buyTpslPrice, setBuyTpslPrice] = useState<number | string>("");
  const [sellTpslPrice, setSellTpslPrice] = useState<number | string>("");
  const [buyTpslAmount, setBuyTpslAmount] = useState<number | string>("");
  const [sellTpslAmount, setSellTpslAmount] = useState<number | string>("");
  const [buyTpslPct, setBuyTpslPct] = useState(0);
  const [sellTpslPct, setSellTpslPct] = useState(0);
  const [buyPrice, setBuyPrice] = useState<number | string>("");
  const [buyAmount, setBuyAmount] = useState<number | string>("");
  const [buyPct, setBuyPct] = useState(0);
  const [sellPrice, setSellPrice] = useState<number | string>("");
  const [sellAmount, setSellAmount] = useState<number | string>("");
  const [sellPct, setSellPct] = useState(0);
  const [buyPriceEdited, setBuyPriceEdited] = useState(false);
  const [sellPriceEdited, setSellPriceEdited] = useState(false);
  const [tpslEnabled, setTpslEnabled] = useState(false);
  const [buyTp, setBuyTp] = useState<number | string>("");
  const [buySl, setBuySl] = useState<number | string>("");
  const [sellTp, setSellTp] = useState<number | string>("");
  const [sellSl, setSellSl] = useState<number | string>("");
  
  const [buyOcoPrice, setBuyOcoPrice] = useState<number | string>("");
  const [buyOcoStop, setBuyOcoStop] = useState<number | string>("");
  const [buyOcoLimit, setBuyOcoLimit] = useState<number | string>("");
  const [sellOcoPrice, setSellOcoPrice] = useState<number | string>("");
  const [sellOcoStop, setSellOcoStop] = useState<number | string>("");
  const [sellOcoLimit, setSellOcoLimit] = useState<number | string>("");
  const [buyStopPrice, setBuyStopPrice] = useState<number | string>("");
  const [sellStopPrice, setSellStopPrice] = useState<number | string>("");
  const [postOnly, setPostOnly] = useState(false);
  const [timeInForce, setTimeInForce] = useState<"GTC" | "IOC" | "FOK">("GTC");

  const effectiveTab = advancedTab ?? activeTab;

  const orderTypeOptions: AdvancedOption[] = [
    { value: "limit" as AdvancedTab, label: "Limit" },
    { value: "market" as AdvancedTab, label: "Market" },
    { value: "tpsl", label: "TP/SL" },
    { value: "conditional", label: "Conditional", disabled: true },
    { value: "stop" as AdvancedTab, label: "Stop Limit" },
    ...(mode !== "spot" ? [{ value: "oco" as AdvancedTab, label: "OCO" }] : []),
  ];

  const selectedOrderType = effectiveTab;
  const selectedOrderTypeLabel =
    selectedOrderType === "stop"
      ? "Stop Limit"
      : selectedOrderType === "tpsl"
        ? "TP/SL"
        : selectedOrderType === "oco"
          ? "OCO"
          : selectedOrderType.charAt(0).toUpperCase() + selectedOrderType.slice(1);

  const queryClient = useQueryClient();

  // reset edited flags when tab switches to limit or pair changes
  useEffect(() => {
    setBuyPriceEdited(false);
    setSellPriceEdited(false);
  }, [activeTab, pair]);

  // auto-fill limit price from market feed; skip if user has manually typed
  useEffect(() => {
    if (activeTab !== "limit" || !marketPrice) return;
    if (!buyPriceEdited) setBuyPrice(marketPrice);
    if (!sellPriceEdited) setSellPrice(marketPrice);
  }, [activeTab, marketPrice, pair, buyPriceEdited, sellPriceEdited]);

  // order book row click â€” always overrides both price fields and marks as user-set
  useEffect(() => {
    if (!clickedPrice) return;
    setBuyPrice(clickedPrice);
    setSellPrice(clickedPrice);
    setBuyPriceEdited(true);
    setSellPriceEdited(true);
  }, [clickedPrice]);

  // report live TP/SL preview so the chart can draw the levels
  useEffect(() => {
    const valid = (value: number | string) => {
      const n = parseFloat(String(value));
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };
    if (!tpslEnabled) {
      onTpslChange?.({});
      return;
    }
    onTpslChange?.({
      buyTp: valid(buyTp),
      buySl: valid(buySl),
      sellTp: valid(sellTp),
      sellSl: valid(sellSl),
    });
  }, [tpslEnabled, buyTp, buySl, sellTp, sellSl, onTpslChange]);

  const pairStr = String(pair || "");
  const [base, quote] = pairStr.includes("/") ? pairStr.split("/") : pairStr.match(/^([A-Z]+)([A-Z]{3,6})$/i)?.slice(1,3) || ["BTC", "USDT"];

  const { coins: portfolioResponse, refreshBalances, isRefreshing } = usePortfolioWs({ coins: true });

  const quoteAsset = portfolioResponse?.find((a: any) => a.symbol === quote);
  const baseAsset = portfolioResponse?.find((a: any) => a.symbol === base);

  const parseNum = (val: any) => {
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // Format a quantity number without scientific notation (e.g. 1e-7 → "0.0000001")
  // Trims trailing zeros after the decimal point, max 8 decimal places.
  const fmtQty = (val: number): string => {
    if (!Number.isFinite(val) || val === 0) return "";
    // toFixed(8) always gives fixed notation, then strip trailing zeros
    const fixed = val.toFixed(8);
    // Remove trailing zeros after decimal, keep at least 1 decimal if needed
    const trimmed = fixed.replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
    return trimmed;
  };

  const rawQuote = quoteAsset ? parseNum(mode === "spot" ? quoteAsset.spotBalance : quoteAsset.marginBalance) : 0;
  const rawBase = baseAsset ? parseNum(mode === "spot" ? baseAsset.spotBalance : baseAsset.marginBalance) : 0;
  const availQuote = rawQuote ? rawQuote.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00";
  const availBase  = rawBase  ? rawBase.toLocaleString("en-US",  { minimumFractionDigits: 6 }) : "0.00000000";

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const clampPct = (v: number) => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0));

  // Price each order type actually uses for sizing/total. Market never falls
  // back to a stale limit price; OCO uses its entry price.
  const effectivePriceFor = (side: "buy" | "sell"): number => {
    if (effectiveTab === "oco") return parseNum(side === "buy" ? buyOcoPrice : sellOcoPrice);
    if (effectiveTab === "market") return parseNum(marketPrice);
    return parseNum(side === "buy" ? buyPrice : sellPrice);
  };

  const totalFor = (side: "buy" | "sell"): number =>
    effectivePriceFor(side) * parseNum(side === "buy" ? buyAmount : sellAmount);

  // Percentage of available balance the current amount represents.
  const calcPct = (side: "buy" | "sell", price: number, amount: number) => {
    if (side === "buy") {
      return rawQuote > 0 ? clampPct(((amount * price) / rawQuote) * 100) : 0;
    }
    return rawBase > 0 ? clampPct((amount / rawBase) * 100) : 0;
  };

  const handleBuyMax = () => {
    const price = effectivePriceFor("buy");
    if (!price) return;
    setBuyAmount(fmtQty(rawQuote / price));
    setBuyPct(100);
  };

  const handleSellMax = () => {
    if (!rawBase) return;
    setSellAmount(fmtQty(rawBase));
    setSellPct(100);
  };

  const buyTotal = totalFor("buy");
  const sellTotal = totalFor("sell");

  const getOrderType = (side: "buy" | "sell") => {
    if (activeTab === "limit") return side === "buy" ? "buy_limit" as const : "sell_limit" as const;
    if (activeTab === "stop")  return side === "buy" ? "buy_stop"  as const : "sell_stop"  as const;
    if (activeTab === "oco")   return "oco" as const;
    return "market" as const;
  };

  const buildPayload = (side: "buy" | "sell") => {
    const price = side === "buy" ? (activeTab === "oco" ? +buyOcoPrice : +buyPrice) : (activeTab === "oco" ? +sellOcoPrice : +sellPrice);
    const stopPrice = side === "buy" ? (activeTab === "oco" ? +buyOcoStop : (activeTab === "stop" ? +buyStopPrice : +buyPrice)) : (activeTab === "oco" ? +sellOcoStop : (activeTab === "stop" ? +sellStopPrice : +sellPrice));
    const quantity = side === "buy" ? +buyAmount : +sellAmount;
    const type = getOrderType(side);
    return { side, base, quote, type, price, quantity, leverage, stopPrice };
  };

  // TP/SL are attached to the entry order (`takeProfit` / `stopLoss`),
  // per WEBSOCKET_MESSAGES.md §3.5 / §4.5, rather than placed as separate orders.
  const buildTpslPayload = (side: "buy" | "sell") => {
    if (!tpslEnabled) return {};
    const takeProfit = parseNum(side === "buy" ? buyTp : sellTp);
    const stopLoss = parseNum(side === "buy" ? buySl : sellSl);
    return {
      ...(takeProfit > 0 ? { takeProfit } : {}),
      ...(stopLoss > 0 ? { stopLoss } : {}),
    };
  };

  const placeOrder = async (side: "buy" | "sell") => {
    const payload = buildPayload(side);

    if (!Number.isFinite(Number(payload.quantity)) || Number(payload.quantity) <= 0) {
      errorMessageHandler(new Error("Quantity must be greater than zero"));
      return;
    }
    if (
      activeTab !== "market" &&
      (!Number.isFinite(Number(payload.price)) || Number(payload.price) <= 0)
    ) {
      errorMessageHandler(new Error("Price must be greater than zero"));
      return;
    }
    if (activeTab === "stop") {
      if (!Number.isFinite(Number(payload.stopPrice)) || Number(payload.stopPrice) <= 0) {
        errorMessageHandler(new Error("Stop trigger price must be greater than zero"));
        return;
      }
    }

    // Spot orders go over the trading WebSocket (place_spot_order frame),
    // or REST for Spot OCO (dedicated endpoint).
    if (mode === "spot") {
      if (activeTab === "oco") {
        return tradingService.placeSpotOCOOrder({
          pair: `${base}/${quote}`.toUpperCase(),
          quantity: String(payload.quantity),
          takeProfit: String(side === "buy" ? buyOcoPrice : sellOcoPrice),
          stopLoss: String(side === "buy" ? buyOcoStop : sellOcoStop),
        });
      }
      return placeSpotOrderWs({
        symbol: `${base}/${quote}`.toUpperCase(),
        side,
        type: activeTab === "stop" ? "stop" : activeTab === "market" ? "market" : "limit",
        quantity: Number(payload.quantity),
        price: activeTab === "market" ? marketPrice ?? undefined : Number(payload.price),
        stopPrice: Number(payload.stopPrice),
        postOnly: activeTab === "limit" ? postOnly : undefined,
        timeInForce: activeTab === "limit" ? timeInForce : undefined,
        ...buildTpslPayload(side),
      });
    }

    if (activeTab === "market") {
      return placeMarginOrderWs({
        ...payload,
        type: "market",
        price: marketPrice ?? undefined,
        ...buildTpslPayload(side),
      });
    }
    if (activeTab === "stop") {
      return placeMarginOrderWs({
        ...payload,
        type: payload.type as "buy_stop" | "sell_stop",
        price: Number(payload.price),
        stopPrice: Number(payload.stopPrice),
        ...buildTpslPayload(side),
      });
    }
    if (activeTab === "oco") {
      return placeMarginOcoOrderWs({
        symbol: `${base}/${quote}`.toUpperCase(),
        order_side: side.toUpperCase(),
        tp_trigger_price: String(payload.price), // simplified map for OCO payload
        sl_trigger_price: String(side === "buy" ? buyOcoStop : sellOcoStop),
        quantity: String(payload.quantity),
        tp_limit_price: String(payload.price),
        sl_limit_price: String(side === "buy" ? buyOcoLimit : sellOcoLimit),
      });
    }
    return placeMarginOrderWs({
      ...payload,
      type: payload.type as "buy_limit" | "sell_limit",
      postOnly,
      timeInForce,
      ...buildTpslPayload(side),
    });
  };

  const refreshTradingBalances = () => {
    queryClient.invalidateQueries({ queryKey: tradingKeys.openOrders() });
    queryClient.invalidateQueries({ queryKey: tradingKeys.openOrders(pair) });
    queryClient.invalidateQueries({ queryKey: ["order-history"] });
    refreshBalances();
  };

  const { mutate: placeBuy, isPending: buyLoading } = useMutation({
    mutationFn: () => placeOrder("buy"),
    onSuccess: (res: any) => {
      if (onFill) {
        const p = buildPayload("buy");
        const resPrice = Number(
          res?.data?.price ??
          res?.data?.avgPrice ??
          res?.data?.fillPrice ??
          res?.data?.executionPrice ??
          res?.price ??
          res?.avgPrice
        );
        const effectivePrice =
          Number.isFinite(resPrice) && resPrice > 0
            ? resPrice
            : activeTab === "market"
            ? (marketPrice ?? +p.price)
            : +p.price;
        onFill({
          side: "buy",
          price: effectivePrice,
          quantity: +p.quantity,
          takeProfit: parseNum(buyTp) || undefined,
          stopLoss: parseNum(buySl) || undefined,
        });
      }
      successNotification("Buy order placed");
      refreshTradingBalances();
      setBuyPrice(""); setBuyAmount(""); setBuyTp(""); setBuySl(""); setBuyPct(0);
      setBuyOcoPrice(""); setBuyOcoStop(""); setBuyOcoLimit(""); setBuyStopPrice("");
    },
    onError: (e) => errorMessageHandler(e),
  });

  const { mutate: placeSell, isPending: sellLoading } = useMutation({
    mutationFn: () => placeOrder("sell"),
    onSuccess: (res: any) => {
      if (onFill) {
        const p = buildPayload("sell");
        const resPrice = Number(
          res?.data?.price ??
          res?.data?.avgPrice ??
          res?.data?.fillPrice ??
          res?.data?.executionPrice ??
          res?.price ??
          res?.avgPrice
        );
        const effectivePrice =
          Number.isFinite(resPrice) && resPrice > 0
            ? resPrice
            : activeTab === "market"
            ? (marketPrice ?? +p.price)
            : +p.price;
        onFill({
          side: "sell",
          price: effectivePrice,
          quantity: +p.quantity,
          takeProfit: parseNum(sellTp) || undefined,
          stopLoss: parseNum(sellSl) || undefined,
        });
      }
      successNotification("Sell order placed");
      refreshTradingBalances();
      setSellPrice(""); setSellAmount(""); setSellTp(""); setSellSl(""); setSellPct(0);
      setSellOcoPrice(""); setSellOcoStop(""); setSellOcoLimit(""); setSellStopPrice("");
    },
    onError: (e) => errorMessageHandler(e),
  });

  const openBorrowModal = () => {
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      size: "lg",
      title: <span className="text-white font-bold text-base">Borrow / Repay Margin</span>,
      styles: {
        content: {
          backgroundColor: "#13151c",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
        },
        header: {
          backgroundColor: "transparent",
          padding: "16px 20px",
        },
        body: {
          padding: "0 20px 20px",
        },
      },
      children: <MarginBorrowRepayModal pair={pair} tradeMode={mode === "cross" ? "cross" : "isolated"} onClose={() => modals.closeAll()} />,
    });
  };

  const openTransferModal = () => {
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      size: "lg",
      title: <span className="text-white font-bold text-base">Transfer Assets</span>,
      styles: {
        content: {
          backgroundColor: "#13151c",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
        },
        header: {
          backgroundColor: "transparent",
          padding: "16px 20px",
        },
        body: {
          padding: "0 20px 20px",
        },
      },
      children: <MarginTransferModal pair={pair} initialMode={mode} onClose={() => modals.closeAll()} />,
    });
  };

  const [activeSide, setActiveSide] = useState<"buy" | "sell">("buy");

  // One side of the form, stacked Bybit-style. Uses the same state, payloads
  // and mutations as the split layout — only the presentation differs.
  const renderStackedSide = (side: "buy" | "sell") => {
    const isBuy = side === "buy";
    const tone = isBuy ? "buy" : "sell";
    const price = isBuy ? buyPrice : sellPrice;
    const amount = isBuy ? buyAmount : sellAmount;
    const pct = isBuy ? buyPct : sellPct;
    const total = isBuy ? buyTotal : sellTotal;
    const loading = isBuy ? buyLoading : sellLoading;
    const rawAvail = isBuy ? rawQuote : rawBase;
    const refPrice = effectivePriceFor(side);
    const maxAmount = isBuy ? (refPrice ? rawQuote / refPrice : 0) : rawBase;
    const sliderStyle = STACKED_SLIDER[tone];

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">Available Balance</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
            {isBuy ? availQuote : availBase} {isBuy ? quote : base}
            <button
              type="button"
              onClick={refreshBalances}
              aria-label="Refresh available balance"
              title="Refresh balance"
              className="text-white/40 transition-colors hover:text-white"
            >
              <MdRefresh size={14} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </span>
        </div>

        {effectiveTab === "oco" ? (
          <>
            <FieldRow floating label="Price" value={isBuy ? buyOcoPrice : sellOcoPrice} onChange={(v) => {
              if (isBuy) { setBuyOcoPrice(v); setBuyPct(calcPct("buy", parseNum(v), parseNum(buyAmount))); }
              else { setSellOcoPrice(v); setSellPct(calcPct("sell", parseNum(v), parseNum(sellAmount))); }
            }} unit={quote} color={tone} />
            <FieldRow floating label="Stop" value={isBuy ? buyOcoStop : sellOcoStop} onChange={isBuy ? setBuyOcoStop : setSellOcoStop} unit={quote} color={tone} />
            <FieldRow floating label="Limit" value={isBuy ? buyOcoLimit : sellOcoLimit} onChange={isBuy ? setBuyOcoLimit : setSellOcoLimit} unit={quote} color={tone} />
          </>
        ) : effectiveTab === "stop" ? (
          <>
            <FieldRow floating label="Stop Price" value={isBuy ? buyStopPrice : sellStopPrice} onChange={isBuy ? setBuyStopPrice : setSellStopPrice} unit={quote} color={tone} />
            <FieldRow
              floating
              label="Limit Price"
              value={price}
              onChange={(v) => {
                if (isBuy) { setBuyPriceEdited(true); setBuyPrice(v); setBuyPct(calcPct("buy", parseNum(v), parseNum(buyAmount))); }
                else { setSellPriceEdited(true); setSellPrice(v); setSellPct(calcPct("sell", parseNum(v), parseNum(sellAmount))); }
              }}
              unit={quote}
              color={tone}
            />
          </>
        ) : effectiveTab !== "market" ? (
          <FieldRow
            floating
            label="Price"
            value={price}
            onChange={(v) => {
              if (isBuy) { setBuyPriceEdited(true); setBuyPrice(v); setBuyPct(calcPct("buy", parseNum(v), parseNum(buyAmount))); }
              else { setSellPriceEdited(true); setSellPrice(v); setSellPct(calcPct("sell", parseNum(v), parseNum(sellAmount))); }
            }}
            unit={quote}
            color={tone}
          />
        ) : null}

        <FieldRow floating label="Quantity" value={amount} onChange={(v) => {
          if (isBuy) {
            setBuyAmount(v);
            setBuyPct(calcPct("buy", effectivePriceFor("buy"), parseNum(v)));
          } else {
            setSellAmount(v);
            setSellPct(calcPct("sell", 0, parseNum(v)));
          }
        }} unit={base} color={tone} />

        <div className="px-1.5 pb-5 pt-1">
          <Slider
            min={0}
            max={100}
            step={1}
            label={(v) => `${v}%`}
            value={pct}
            onChange={(v) => {
              if (isBuy) {
                setBuyPct(v);
                const p = effectivePriceFor("buy");
                if (p) setBuyAmount(fmtQty((rawQuote * v / 100) / p));
              } else {
                setSellPct(v);
                setSellAmount(fmtQty((rawBase || 0) * v / 100));
              }
            }}
            classNames={{
              track: "!h-1 before:!h-1 before:!bg-white/10",
              bar: sliderStyle.bar,
              thumb: sliderStyle.thumb,
              mark: sliderStyle.mark,
              markLabel: "!text-2xs !text-white/40 !mt-2",
            }}
            marks={STACKED_MARKS}
          />
        </div>

        <FieldRow floating label="Order Value" value={total || ""} unit={quote} readOnly />

        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">{isBuy ? "Max. buying amount" : "Max. selling amount"}</span>
          <span className="font-semibold text-white/90">{formatAmount(maxAmount)} {base}</span>
        </div>

        <label className="flex cursor-pointer items-center gap-2 self-start text-xs font-semibold text-white/70">
          <input
            type="checkbox"
            checked={tpslEnabled}
            onChange={() => setTpslEnabled((v) => !v)}
            className="h-3.5 w-3.5 cursor-pointer accent-primary"
          />
          TP/SL
        </label>
        {tpslEnabled && (
          <>
            <FieldRow floating label="Take Profit" value={isBuy ? buyTp : sellTp} onChange={isBuy ? setBuyTp : setSellTp} unit={quote} color={tone} />
            <FieldRow floating label="Stop Loss" value={isBuy ? buySl : sellSl} onChange={isBuy ? setBuySl : setSellSl} unit={quote} color={tone} />
          </>
        )}

        {effectiveTab === "limit" && (
          <div className="flex items-center justify-between text-xs text-white/60 px-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={postOnly}
                onChange={(e) => setPostOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-white/5 border border-white/20 accent-primary cursor-pointer"
              />
              Post-Only
            </label>
            <div className="flex items-center gap-1">
              <span className="text-2xs text-white/40">TIF:</span>
              {(["GTC", "IOC", "FOK"] as const).map((tif) => (
                <button
                  key={tif}
                  type="button"
                  onClick={() => setTimeInForce(tif)}
                  className={clsx(
                    "px-1.5 py-0.5 rounded text-2xs font-semibold transition-colors",
                    timeInForce === tif ? "bg-primary/20 text-primary border border-primary/40" : "text-white/40 hover:text-white/70"
                  )}
                >
                  {tif}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => (isBuy ? placeBuy() : placeSell())}
          disabled={
            loading ||
            parseNum(amount) <= 0 ||
            rawAvail === 0 ||
            (effectiveTab !== "market" && !(effectivePriceFor(side) > 0)) ||
            (isBuy
              ? rawQuote > 0 && round2(total) > round2(rawQuote)
              : rawBase > 0 && round2(parseNum(amount)) > round2(rawBase))
          }
          className={clsx(
            "flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50",
            isBuy ? "bg-buy hover:bg-buy/90" : "bg-sell hover:bg-sell/90"
          )}
        >
          {loading && <Loader size={13} color="white" />}
          {isBuy ? "Buy" : "Sell"} {base}
        </button>
      </div>
    );
  };

  const renderTpslForm = () => {
    const isBuy = activeSide === "buy";
    const tone = isBuy ? "buy" : "sell";
    const trigger = isBuy ? buyTpslTrigger : sellTpslTrigger;
    const setTrigger = isBuy ? setBuyTpslTrigger : setSellTpslTrigger;
    const price = isBuy ? buyTpslPrice : sellTpslPrice;
    const setPrice = isBuy ? setBuyTpslPrice : setSellTpslPrice;
    const amount = isBuy ? buyTpslAmount : sellTpslAmount;
    const setAmount = isBuy ? setBuyTpslAmount : setSellTpslAmount;
    const pct = isBuy ? buyTpslPct : sellTpslPct;
    const setPct = isBuy ? setBuyTpslPct : setSellTpslPct;
    const refPrice = parseNum(
      (tpslExecType === "limit" ? price : marketPrice) || marketPrice || 0
    );
    const total = refPrice * parseNum(amount);
    const sliderStyle = STACKED_SLIDER[tone];

    const showTpslToast = () => {
      toast(
        "TP/SL orders coming soon. Use the TP/SL checkbox on a Limit or Market order for now."
      );
    };

    return (
      <div className="flex flex-col gap-3">
        {!sideToggle && (
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/[0.05] p-1">
            {(["buy", "sell"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setActiveSide(side)}
                aria-pressed={activeSide === side}
                className={clsx(
                  "h-9 rounded-md text-sm font-bold capitalize transition-colors",
                  activeSide === side
                    ? side === "buy" ? "bg-buy text-white" : "bg-sell text-white"
                    : "text-white/50 hover:text-white/80"
                )}
              >
                {side}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">Trigger Type</span>
          <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-0.5">
            {(["last", "mark", "index"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTpslTriggerType(type)}
                className={clsx(
                  "rounded-md px-2 py-1 text-2xs font-bold capitalize transition-colors",
                  tpslTriggerType === type
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <FieldRow
          floating
          label="Trigger Price"
          value={trigger}
          onChange={setTrigger}
          unit={quote}
          color={tone}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">Order Type</span>
          <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-0.5">
            {(["limit", "market"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTpslExecType(type)}
                className={clsx(
                  "rounded-md px-2 py-1 text-2xs font-bold capitalize transition-colors",
                  tpslExecType === type
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {tpslExecType === "limit" && (
          <FieldRow
            floating
            label="Order Price"
            value={price}
            onChange={(v) => {
              setPrice(v);
              const p = parseNum(v) || parseNum(marketPrice);
              setPct(
                isBuy
                  ? rawQuote > 0 ? clampPct((parseNum(amount) * p / rawQuote) * 100) : 0
                  : rawBase > 0 ? clampPct((parseNum(amount) / rawBase) * 100) : 0
              );
            }}
            unit={quote}
            color={tone}
          />
        )}

        <FieldRow
          floating
          label="Quantity"
          value={amount}
          onChange={(v) => {
            setAmount(v);
            setPct(
              isBuy
                ? rawQuote > 0 ? clampPct((parseNum(v) * refPrice / rawQuote) * 100) : 0
                : rawBase > 0 ? clampPct((parseNum(v) / rawBase) * 100) : 0
            );
          }}
          unit={base}
          color={tone}
        />

        <div className="px-1.5 pb-5 pt-1">
          <Slider
            min={0}
            max={100}
            step={1}
            label={(v) => `${v}%`}
            value={pct}
            onChange={(v) => {
              setPct(v);
              if (refPrice) {
                if (isBuy) {
                  setAmount(fmtQty(((rawQuote || 0) * v / 100) / refPrice));
                } else {
                  setAmount(fmtQty(((rawBase || 0) * v / 100)));
                }
              }
            }}
            classNames={{
              track: "!h-1 before:!h-1 before:!bg-white/10",
              bar: sliderStyle.bar,
              thumb: sliderStyle.thumb,
              mark: sliderStyle.mark,
              markLabel: "!text-2xs !text-white/40 !mt-2",
            }}
            marks={STACKED_MARKS}
          />
        </div>

        <FieldRow
          floating
          label="Order Value"
          value={total ? fmtQty(total) : ""}
          unit={quote}
          readOnly
        />

        <button
          type="button"
          onClick={showTpslToast}
          className={clsx(
            "flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white transition-all active:scale-95",
            isBuy ? "bg-buy hover:bg-buy/90" : "bg-sell hover:bg-sell/90"
          )}
        >
          {isBuy ? "Buy" : "Sell"} {base}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Buy / Sell toggle (stacked layout only) */}
      {sideToggle && (
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/[0.05] p-1">
          {(["buy", "sell"] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setActiveSide(side)}
              aria-pressed={activeSide === side}
              className={clsx(
                "h-9 rounded-md text-sm font-bold capitalize transition-colors",
                activeSide === side
                  ? side === "buy" ? "bg-buy text-white" : "bg-sell text-white"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              {side}
            </button>
          ))}
        </div>
      )}

      {/* Unified order type selector: shared by desktop and mobile */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xs font-medium text-white/50"><span className="sm:hidden">Type</span><span className="hidden sm:inline">Order type</span></span>
          <Popover
            opened={moreOpen}
            onChange={setMoreOpen}
            position="bottom-start"
            withArrow={false}
            shadow="xl"
          >
            <Popover.Target>
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                aria-label={`Order type: ${selectedOrderTypeLabel}`}
                aria-expanded={moreOpen}
                className="flex h-9 min-w-[110px] max-w-[150px] sm:max-w-[190px] items-center justify-between gap-2 rounded-lg border border-white/[0.10] bg-white/[0.05] px-3 text-left text-xs font-semibold text-white transition-colors hover:bg-white/[0.08]"
              >
                <span className="truncate">{selectedOrderTypeLabel}</span>
                <MdExpandMore
                  size={16}
                  className={clsx("shrink-0 transition-transform", moreOpen && "rotate-180")}
                />
              </button>
            </Popover.Target>
            <Popover.Dropdown className="!z-[300] !w-[190px] !min-w-[190px] !rounded-xl !border !border-white/[0.08] bg-elevated !p-1 !shadow-xl">
              {orderTypeOptions.map((option) => {
                const value = option.value as string;
                const isSelected = selectedOrderType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      if (option.disabled) return;
                      if (value === "tpsl" || value === "oco") {
                        setActiveTab(value);
                        setAdvancedTab(value as AdvancedTab);
                      } else {
                        setActiveTab(value);
                        setAdvancedTab(null);
                      }
                      setMoreOpen(false);
                    }}
                    className={clsx(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      option.disabled
                        ? "cursor-not-allowed text-white/30"
                        : "text-white/80 hover:bg-white/[0.06]",
                      isSelected && "bg-primary/[0.10] !text-primary"
                    )}
                  >
                    <span>{option.label}</span>
                    {option.disabled && (
                      <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/40">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </Popover.Dropdown>
          </Popover>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mode !== "spot" && (
            <span 
              onClick={openBorrowModal}
              className="pr-3 text-xs text-[#f3ba2f] font-bold border-r border-r-white/[0.06] hover:text-[#f3ba2f]/80 cursor-pointer py-1 transition-colors"
            >
              Borrow
            </span>
          )}
          <span 
            onClick={openTransferModal}
            className="pr-3 text-xs text-primary border-r border-r-white/[0.06] hover:bg-white/5 cursor-pointer py-1 transition-colors"
          >
            Transfer
          </span>
          <Image src={icons.infoCircle} alt="" className="opacity-40 w-4 h-4" />
        </div>
      </div>

      {/* Leverage selector — cross / isolated only */}
      {mode !== "spot" && (
        <div className="flex flex-col gap-2 pb-1 border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Leverage</span>
            <span className="text-xs font-bold text-primary">{leverage}x</span>
          </div>
          <Slider
            min={1}
            max={mode === "cross" ? 10 : 125}
            step={1}
            value={leverage}
            onChange={(v) => onLeverageChange?.(v)}
            onChangeEnd={(v) => onLeverageChangeEnd ? onLeverageChangeEnd(v) : onLeverageChange?.(v)}
            classNames={{
              track: "!h-1 before:!h-1 before:!bg-white/10",
              bar: "!bg-primary",
              thumb: "!border-2 !border-primary !bg-[#181a20] !w-3 !h-3",
            }}
          />
          <div className="flex gap-1 mt-1">
            {LEVERAGE_PRESETS.filter(l => l <= (mode === "cross" ? 10 : 125)).map((l) => (
              <button
                key={l}
                onClick={() => {
                  onLeverageChange?.(l);
                  onLeverageChangeEnd?.(l);
                }}
                className={clsx(
                  "flex-1 text-2xs font-bold py-1 rounded transition-all",
                  leverage === l
                    ? "bg-primary/20 text-primary"
                    : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70"
                )}
              >
                {l}x
              </button>
            ))}
          </div>
        </div>
      )}

      {effectiveTab === "tpsl" ? (
        renderTpslForm()
      ) : sideToggle ? (
        renderStackedSide(activeSide)
      ) : (
      <div className={clsx("grid gap-x-4 gap-y-0", compactSide ? "grid-cols-1" : "grid-cols-2")}>
        {/* BUY COLUMN */}
        {(!compactSide || compactSide === "buy") && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs">Avail</span>
            <span className="flex items-center gap-1.5 text-micro text-white/90 font-semibold">
              {availQuote} {quote}
              <button
                type="button"
                onClick={refreshBalances}
                aria-label="Refresh available quote balance"
                title="Refresh balance"
                className="text-white/40 hover:text-white transition-colors"
              >
                <MdRefresh size={14} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </span>
          </div>

          {effectiveTab === "oco" ? (
            <>
              <FieldRow label="Price" value={buyOcoPrice} onChange={(v) => {
                setBuyOcoPrice(v);
                setBuyPct(calcPct("buy", parseNum(v), parseNum(buyAmount)));
              }} unit={quote} color="buy" />
              <FieldRow label="Stop" value={buyOcoStop} onChange={setBuyOcoStop} unit={quote} color="buy" />
              <FieldRow label="Limit" value={buyOcoLimit} onChange={setBuyOcoLimit} unit={quote} color="buy" />
            </>
          ) : effectiveTab === "stop" ? (
            <>
              <FieldRow label="Stop" value={buyStopPrice} onChange={setBuyStopPrice} unit={quote} color="buy" />
              <FieldRow label="Limit" value={buyPrice} onChange={(v) => {
                setBuyPriceEdited(true); setBuyPrice(v);
                setBuyPct(calcPct("buy", parseNum(v), parseNum(buyAmount)));
              }} unit={quote} color="buy" />
            </>
          ) : effectiveTab !== "market" ? (
            <FieldRow label="Price" value={buyPrice} onChange={(v) => {
              setBuyPriceEdited(true); setBuyPrice(v);
              setBuyPct(calcPct("buy", parseNum(v), parseNum(buyAmount)));
            }} unit={quote} color="buy" />
          ) : null}

          <FieldRow label="Qty" value={buyAmount} onChange={(v) => {
            setBuyAmount(v);
            setBuyPct(calcPct("buy", effectivePriceFor("buy"), parseNum(v)));
          }} unit={base} color="buy" showMax onMax={handleBuyMax} />

          <div className="px-1 pt-1 pb-3">
            <Slider
              min={0} max={100} step={25}
              value={buyPct}
              onChange={(v) => {
                setBuyPct(v);
                const p = effectivePriceFor("buy");
                if (p) setBuyAmount(fmtQty((rawQuote * v / 100) / p));
              }}
              classNames={{
                track: "!h-1 before:!h-1 before:!bg-white/10",
                bar: "!bg-success-6",
                thumb: "!border-2 !border-success-6 !bg-[#181a20] !w-3 !h-3",
                mark: "!w-2 !h-2 !rounded-full !border-2 !border-success-6/40 !bg-[#181a20] !-mt-[3px]",
                markLabel: "!text-2xs !text-white/30 !mt-1",
              }}
              marks={PERCENT_MARKS}
            />
          </div>

          <FieldRow label="Total" value={buyTotal || ""} unit={quote} readOnly />

          {/* TP/SL section */}
          {tpslEnabled && (
            <>
              <FieldRow label="TP" value={buyTp} onChange={setBuyTp} unit={quote} color="buy" />
              <FieldRow label="SL" value={buySl} onChange={setBuySl} unit={quote} color="buy" />
            </>
          )}

          <button
            onClick={() => placeBuy()}
            disabled={
              buyLoading ||
              !(Number(buyAmount) > 0) ||
              rawQuote === 0 ||
              (effectiveTab !== "market" && !(effectivePriceFor("buy") > 0)) ||
              (rawQuote > 0 && round2(buyTotal) > round2(rawQuote))
            }
            className="mt-0.5 bg-buy hover:bg-buy/90 disabled:opacity-50 transition-all text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 hover:shadow-[0_0_12px_rgba(37,171,66,0.3)] active:scale-95"
          >
            {buyLoading && <Loader size={13} color="white" />}
            Buy {base}
          </button>
        </div>
        )}

        {/* SELL COLUMN */}
        {(!compactSide || compactSide === "sell") && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs">Avail</span>
            <span className="flex items-center gap-1.5 text-micro text-white/90 font-semibold">
              {availBase} {base}
              <button
                type="button"
                onClick={refreshBalances}
                aria-label="Refresh available base balance"
                title="Refresh balance"
                className="text-white/40 hover:text-white transition-colors"
              >
                <MdRefresh size={14} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </span>
          </div>

          {effectiveTab === "oco" ? (
            <>
              <FieldRow label="Price" value={sellOcoPrice} onChange={(v) => {
                setSellOcoPrice(v);
                setSellPct(calcPct("sell", parseNum(v), parseNum(sellAmount)));
              }} unit={quote} color="sell" />
              <FieldRow label="Stop" value={sellOcoStop} onChange={setSellOcoStop} unit={quote} color="sell" />
              <FieldRow label="Limit" value={sellOcoLimit} onChange={setSellOcoLimit} unit={quote} color="sell" />
            </>
          ) : effectiveTab === "stop" ? (
            <>
              <FieldRow label="Stop" value={sellStopPrice} onChange={setSellStopPrice} unit={quote} color="sell" />
              <FieldRow label="Limit" value={sellPrice} onChange={(v) => {
                setSellPriceEdited(true); setSellPrice(v);
                setSellPct(calcPct("sell", parseNum(v), parseNum(sellAmount)));
              }} unit={quote} color="sell" />
            </>
          ) : effectiveTab !== "market" ? (
            <FieldRow label="Price" value={sellPrice} onChange={(v) => {
              setSellPriceEdited(true); setSellPrice(v);
              setSellPct(calcPct("sell", parseNum(v), parseNum(sellAmount)));
            }} unit={quote} color="sell" />
          ) : null}

          <FieldRow label="Qty" value={sellAmount} onChange={(v) => {
            setSellAmount(v);
            setSellPct(calcPct("sell", 0, parseNum(v)));
          }} unit={base} color="sell" showMax onMax={handleSellMax} />

          <div className="px-1 pt-1 pb-3">
            <Slider
              min={0} max={100} step={25}
              value={sellPct}
              onChange={(v) => {
                setSellPct(v);
                setSellAmount(fmtQty((rawBase || 0) * v / 100));
              }}
              classNames={{
                track: "!h-1 before:!h-1 before:!bg-white/10",
                bar: "!bg-error-1",
                thumb: "!border-2 !border-error-1 !bg-[#181a20] !w-3 !h-3",
                mark: "!w-2 !h-2 !rounded-full !border-2 !border-error-1/40 !bg-[#181a20] !-mt-[3px]",
                markLabel: "!text-2xs !text-white/30 !mt-1",
              }}
              marks={PERCENT_MARKS}
            />
          </div>

          <FieldRow label="Total" value={sellTotal || ""} unit={quote} readOnly />

          {tpslEnabled && (
            <>
              <FieldRow label="TP" value={sellTp} onChange={setSellTp} unit={quote} color="sell" />
              <FieldRow label="SL" value={sellSl} onChange={setSellSl} unit={quote} color="sell" />
            </>
          )}

          <button
            onClick={() => placeSell()}
            disabled={
              sellLoading ||
              !(Number(sellAmount) > 0) ||
              rawBase === 0 ||
              (rawBase > 0 && round2(parseNum(sellAmount)) > round2(rawBase))
            }
            className="mt-0.5 bg-sell hover:bg-sell/90 disabled:opacity-50 transition-all text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 hover:shadow-[0_0_12px_rgba(246,70,93,0.3)] active:scale-95"
          >
            {sellLoading && <Loader size={13} color="white" />}
            Sell {base}
          </button>
        </div>
        )}
      </div>
      )}

      {/* TP/SL toggle (split layout; the stacked layout has its own checkbox) */}
      {!sideToggle && (
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={() => setTpslEnabled((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors self-start"
          >
            <MdExpandMore className={clsx("transition-transform", tpslEnabled ? "rotate-180" : "")} size={16} />
            TP/SL
          </button>

          {effectiveTab === "limit" && (
            <div className="flex items-center gap-3 text-xs text-white/60">
              <label className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={postOnly}
                  onChange={(e) => setPostOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-white/5 border border-white/20 accent-primary cursor-pointer"
                />
                Post-Only
              </label>
              <div className="flex items-center gap-1">
                <span className="text-2xs text-white/40">TIF:</span>
                {(["GTC", "IOC", "FOK"] as const).map((tif) => (
                  <button
                    key={tif}
                    type="button"
                    onClick={() => setTimeInForce(tif)}
                    className={clsx(
                      "px-1.5 py-0.5 rounded text-2xs font-semibold transition-colors",
                      timeInForce === tif ? "bg-primary/20 text-primary border border-primary/40" : "text-white/40 hover:text-white/70"
                    )}
                  >
                    {tif}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};