import React from "react";
(globalThis as any).React = React;
import { screen } from "@testing-library/react";
import { InlineLoading } from "./inline-loading";
import { renderWithProviders } from "@/src/test/utils";

describe("InlineLoading", () => {
  it("renders a loader and label", () => {
    const { container } = renderWithProviders(<InlineLoading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(container.querySelector('[class*="Loader"]')).toBeInTheDocument();
  });
});