import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: () => "/account/security",
}));

import { AccountSidebar } from "./account-sidebar";

describe("AccountSidebar", () => {
  it("renders the sidebar header", () => {
    renderWithProviders(<AccountSidebar />);
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Manage your account settings")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    renderWithProviders(<AccountSidebar />);
    expect(screen.getByRole("link", { name: /Profile/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Verification/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Security/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /API Keys/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Payment Methods/ })).toBeInTheDocument();
  });

  it("marks the active link (current pathname) with aria-current", () => {
    renderWithProviders(<AccountSidebar />);
    expect(screen.getByRole("link", { name: /Security/ })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: /Profile/ })).not.toHaveAttribute("aria-current");
  });
});