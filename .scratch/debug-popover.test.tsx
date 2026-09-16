import React from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { queryResults } from "@/src/test/react-query-mock";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

vi.mock("@/src/services/asset", () => ({
  asset: { fetchSupportedChains: vi.fn(() => Promise.resolve({ data: [] })) },
  assetKeys: { supportedChainsKey: (q: string) => ["assets", "supported-chains", q] },
}));

import { NetworksDropdown } from "@/src/components/assets/networks-dropdown";

const chains = [
  { name: "Bitcoin", symbol: "BTC", blockchain: "bitcoin", standard: "Bitcoin" },
  { name: "Ethereum", symbol: "ERC20", blockchain: "ethereum", standard: "ERC20" },
  { name: "Solana", symbol: "SOL", blockchain: "solana", standard: "SOL" },
];

it("debug popover dom", () => {
  vi.clearAllMocks();
  queryResults[JSON.stringify(["assets", "supported-chains", ""])] = { data: chains, isLoading: false };
  const { container } = renderWithProviders(
    <NetworksDropdown
      selectedNetwork={{ name: "Ethereum", symbol: "ERC20", blockchain: "ethereum" }}
      setSelectedNetwork={vi.fn()}
    />
  );
  fireEvent.click(screen.getByAltText("arrow"));
  const bodyHtml = document.body.innerHTML;
  expect(true).toBe(true);
  console.log("=== BODY LEN", bodyHtml.length);
  console.log("=== HAS WARNING", bodyHtml.includes("Ensure you select a network"));
  console.log("=== HAS SOL", bodyHtml.includes("SOL"));
  console.log("=== CONTAINER", container.innerHTML.slice(0, 2000));
});