import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { FCMInitializer } from "./fcm-initializer";

const useFCMMock = vi.hoisted(() => vi.fn());

vi.mock("@/src/hooks/use-fcm", () => ({
  useFCM: useFCMMock,
}));

describe("FCMInitializer", () => {
  it("invokes useFCM and renders nothing", () => {
    const { container } = render(<FCMInitializer />);
    expect(useFCMMock).toHaveBeenCalledTimes(1);
    expect(container.firstChild).toBeNull();
  });
});