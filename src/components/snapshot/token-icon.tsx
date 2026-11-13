"use client";

import { useEffect, useState } from "react";
import { useTokenIconMap } from "@/src/hooks/use-token-icons";
import { toDataUri } from "@/src/lib/snapshot/images";

export function symbolFromPair(pair?: string | null) {
  const value = String(pair ?? "").trim();
  if (!value) return "";
  return value.split(/[/\-_]/)[0]?.trim().toUpperCase() ?? "";
}

type SnapshotTokenIconProps = {
  symbol?: string;
  size?: number;
};

export function SnapshotTokenIcon({ symbol, size = 24 }: SnapshotTokenIconProps) {
  const icons = useTokenIconMap();
  const key = String(symbol ?? "").trim().toUpperCase();
  const url = key ? icons[key] : undefined;
  const [dataUri, setDataUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!url) {
      setDataUri(null);
      return;
    }
    toDataUri(url)
      .then((uri) => {
        if (active) setDataUri(uri);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [url]);

  if (!dataUri) return null;

  return (
    <img
      src={dataUri}
      alt=""
      width={size}
      height={size}
      style={{ display: "block", width: size, height: size, borderRadius: size / 2, objectFit: "contain" }}
    />
  );
}
