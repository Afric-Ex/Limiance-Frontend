"use client";

import { useEffect, useRef, useState } from "react";

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // Fall through to the JSON strategy for non-cloneable payloads.
    }
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export function useFrozenValue<T>(value: T, active: boolean) {
  const latest = useRef(value);
  latest.current = value;

  const [frozen, setFrozen] = useState<{ value: T; frozenAt: Date } | null>(null);

  useEffect(() => {
    if (!active) return;
    setFrozen({ value: cloneValue(latest.current), frozenAt: new Date() });
  }, [active]);

  return {
    value: frozen ? frozen.value : value,
    frozenAt: frozen ? frozen.frozenAt : null,
  };
}
