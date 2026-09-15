import React from "react";
(globalThis as any).React = React;
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { SettingsModalContainer } from "./settings-modal-container";

describe("SettingsModalContainer", () => {
  it("renders its children inside the container", () => {
    renderWithProviders(
      <SettingsModalContainer>
        <span>modal body</span>
      </SettingsModalContainer>
    );
    expect(screen.getByText("modal body")).toBeInTheDocument();
  });
});