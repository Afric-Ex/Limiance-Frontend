import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: () => "/account/profile",
}));

import { AccountMobileTabs } from "./account-mobile-tabs";

describe("AccountMobileTabs", () => {
  it("renders every bottom tab", () => {
    renderWithProviders(<AccountMobileTabs />);
    expect(screen.getByRole("link", { name: /Profile/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Verification/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Security/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /API Keys/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Payments/ })).toBeInTheDocument();
  });

  it("marks the tab matching the current pathname as active", () => {
    renderWithProviders(<AccountMobileTabs />);
    expect(screen.getByRole("link", { name: /Profile/ })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: /Security/ })).not.toHaveAttribute(
      "aria-current"
    );
  });
});