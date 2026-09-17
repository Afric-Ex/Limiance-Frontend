import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import React from "react";

(globalThis as any).React = React;

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, priority, sizes, quality, ...rest } = props;
    return React.createElement("img", rest);
  },
}));

if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY = "test-vapid";
}

if (!process.env.NEXT_PUBLIC_WS_URL) {
  process.env.NEXT_PUBLIC_WS_URL = "ws://localhost:8080";
}

afterEach(() => {
  cleanup();
});