import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const mocks = vi.hoisted(() => ({
  createBot: vi.fn(() => Promise.resolve({ data: {} })),
  successNotification: vi.fn(),
  errorMessageHandler: vi.fn(),
  modalsCloseAll: vi.fn(),
}));

vi.mock("@/src/services/bot", () => ({
  botService: { createBot: mocks.createBot },
  botKeys: { activeBots: (type: string) => ["active-bots", type] },
}));

vi.mock("@/src/lib/notification-handler", () => ({
  successNotification: mocks.successNotification,
  errorNotification: vi.fn(),
}));

vi.mock("@/src/lib/error-handler", () => ({ errorMessageHandler: mocks.errorMessageHandler }));

vi.mock("@mantine/modals", () => ({
  modals: { closeAll: mocks.modalsCloseAll },
}));

import { CreateBotModal } from "./create-bot-modal";

describe("CreateBotModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with default DCA strategy info and disabled launch button", () => {
    renderWithProviders(<CreateBotModal type="spot" />);
    expect(screen.getByText("Trading Pair")).toBeInTheDocument();
    expect(screen.getByText("Strategy")).toBeInTheDocument();
    expect(screen.getByText("DCA Strategy")).toBeInTheDocument();
    expect(screen.getByText("Investment Amount (USDT)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Launch Bot" })).toBeDisabled();
  });

  it("switches the strategy description panel", async () => {
    renderWithProviders(<CreateBotModal type="spot" />);
    expect(screen.getByText("DCA Strategy")).toBeInTheDocument();
    const strategyInputs = screen.getAllByDisplayValue("DCA");
    fireEvent.click(strategyInputs[strategyInputs.length - 1]);
    const gridOption = await screen.findByText("Grid");
    fireEvent.click(gridOption);
    expect(await screen.findByText("Grid Strategy")).toBeInTheDocument();
  });

  it("launches the bot once an amount is entered", async () => {
    renderWithProviders(<CreateBotModal type="spot" />);
    fireEvent.change(screen.getByPlaceholderText("100.00"), { target: { value: "500" } });
    const launch = screen.getByRole("button", { name: "Launch Bot" });
    expect(launch).not.toBeDisabled();
    fireEvent.click(launch);

    await waitFor(() => {
      expect(mocks.createBot).toHaveBeenCalledWith({
        type: "spot",
        pair: "BTC/USDT",
        strategy: "DCA",
        investmentAmount: 500,
        asset: "USDT",
      });
    });
    expect(mocks.successNotification).toHaveBeenCalledWith("DCA bot created for BTC/USDT!");
    expect(mocks.modalsCloseAll).toHaveBeenCalled();
  });

  it("reports errors from the service", async () => {
    mocks.createBot.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<CreateBotModal type="futures" />);
    fireEvent.change(screen.getByPlaceholderText("100.00"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Launch Bot" }));

    await waitFor(() => {
      expect(mocks.errorMessageHandler).toHaveBeenCalledWith(expect.any(Error));
    });
    expect(mocks.modalsCloseAll).not.toHaveBeenCalled();
  });
});