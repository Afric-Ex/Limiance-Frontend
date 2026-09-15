import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import React from "react";

(globalThis as any).React = React;

if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY = "test-vapid";
}

afterEach(() => {
  cleanup();
});