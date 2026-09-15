import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageDropdown } from "./language-dropdown";
import { installTestGlobals, renderWithProviders } from "@/src/test/utils";

installTestGlobals();

describe("LanguageDropdown", () => {
  it("renders the language tab by default", () => {
    renderWithProviders(<LanguageDropdown />);
    expect(screen.getByRole("tab", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
  });

  it("highlights the default language", () => {
    renderWithProviders(<LanguageDropdown />);
    expect(screen.getByText("English").className).toContain("text-primary");
  });

  it("switches to the currency tab", () => {
    renderWithProviders(<LanguageDropdown />);
    fireEvent.click(screen.getByRole("tab", { name: "Currency" }));
    expect(screen.getByText("USD - $")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("renders without a fixed width when mobile", () => {
    const { container } = renderWithProviders(<LanguageDropdown isMobile />);
    expect(container.firstChild?.className).not.toContain("w-[354px]");
  });
});