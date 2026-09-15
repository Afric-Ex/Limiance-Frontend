import React from "react";
(globalThis as any).React = React;
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { AnnouncementCard } from "./announcement-card";

describe("AnnouncementCard", () => {
  it("renders the announcement date and title", () => {
    renderWithProviders(<AnnouncementCard />);
    expect(screen.getByText("16/12/2024")).toBeInTheDocument();
    expect(screen.getByText("Afriq to list W-Coin for spot trading")).toBeInTheDocument();
  });
});