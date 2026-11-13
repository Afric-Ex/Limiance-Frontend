"use client";

import { useEffect, useRef, type RefObject } from "react";
import { SnapshotFrame } from "@/src/components/snapshot/snapshot-frame";
import { useSnapshotOptions } from "@/src/components/snapshot/share-sheet";
import { sanitizeText } from "@/src/lib/snapshot/redact";

type GenericScreenCardProps = {
  sourceRef: RefObject<HTMLElement | null>;
  title: string;
  subtitle?: string;
  timestamp: Date;
  maskedUid?: string;
};

const REMOVE_SELECTOR = '[data-snapshot-hide], button, input, select, textarea, [role="button"], [role="switch"]';
const NUMERIC_TOKEN = /(?<![A-Za-z0-9])[+\-−]?\s*\d[\d,]*(?:\.\d+)?/g;

function maskNumericText(text: string): string {
  return text.replace(NUMERIC_TOKEN, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 2) return match;
    return "****";
  });
}

function scrubNode(root: HTMLElement, hideValues: boolean) {
  root.querySelectorAll(REMOVE_SELECTOR).forEach((node) => node.remove());

  root.querySelectorAll("a").forEach((anchor) => {
    anchor.replaceWith(document.createTextNode(anchor.textContent ?? ""));
  });

  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    element.removeAttribute("id");
    element.removeAttribute("name");
    element.removeAttribute("autocomplete");
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const value = sanitizeText(node.nodeValue ?? "");
    node.nodeValue = hideValues ? maskNumericText(value) : value;
  }
}

export function GenericScreenCard({
  sourceRef,
  title,
  subtitle,
  timestamp,
  maskedUid,
}: GenericScreenCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { hideValues } = useSnapshotOptions();

  useEffect(() => {
    const container = containerRef.current;
    const source = sourceRef.current;
    if (!container || !source) return;

    const clone = source.cloneNode(true) as HTMLElement;
    scrubNode(clone, hideValues);

    clone.style.width = "100%";
    clone.style.maxWidth = "100%";
    clone.style.overflow = "hidden";
    clone.style.background = "transparent";
    clone.style.boxShadow = "none";

    container.replaceChildren(clone);
    return () => container.replaceChildren();
  }, [sourceRef, hideValues]);

  return (
    <SnapshotFrame title={title} subtitle={subtitle} timestamp={timestamp} maskedUid={maskedUid}>
      <div ref={containerRef} style={{ width: "100%" }} />
    </SnapshotFrame>
  );
}
