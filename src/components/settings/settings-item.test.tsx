import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { SettingsItem } from "./settings-item";

const { modals } = vi.hoisted(() => ({
  modals: { open: vi.fn(), closeAll: vi.fn(), confirm: vi.fn() },
}));

vi.mock("@mantine/modals", () => ({ modals }));

const baseProps = {
  title: "Language",
  description: "Select your preferred language",
  buttonText: "Edit",
  descMaxWidth: "max-w-[200px]",
  withArrow: true,
  modal: <span>language modal</span>,
};

describe("SettingsItem", () => {
  it("renders title, description and action button", () => {
    renderWithProviders(<SettingsItem {...baseProps} />);
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("Select your preferred language")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Edit/ })).toBeInTheDocument();
  });

  it("opens a modal wrapping the provided content with default settings", () => {
    renderWithProviders(<SettingsItem {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(modals.open).toHaveBeenCalledTimes(1);
    const args = modals.open.mock.calls[0][0];
    expect(args.children).toBeTruthy();
    expect((args.children.type as any).name).toBe("SettingsModalContainer");
    expect(JSON.stringify(args.children)).toContain("language modal");
  });

  it("renders the rightSection content when provided", () => {
    renderWithProviders(
      <SettingsItem {...baseProps} rightSection={<span>right section</span>} />
    );
    expect(screen.getByText("right section")).toBeInTheDocument();
  });

  it("renders without a container when withContainer is false", () => {
    renderWithProviders(<SettingsItem {...baseProps} withContainer={false} />);
    expect(screen.getByRole("button", { name: /Edit/ })).toBeInTheDocument();
    expect(screen.queryByText("language modal")).not.toBeInTheDocument();
  });
});