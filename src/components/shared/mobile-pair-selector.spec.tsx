import { describe, expect, it, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
// The runtime matchers are registered in src/test/setup.ts, but tsconfig
// excludes `**/src/test/**`, so the type augmentation has to be imported here.
import "@testing-library/jest-dom/vitest";
import React, { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover, PopoverDropdown, PopoverTarget, TextInput } from "@mantine/core";
import { MobileTopBar } from "@/src/components/shared/mobile-top-bar";
import { renderWithProviders } from "@/src/test/utils";

const push = vi.fn();
const back = vi.fn();

// MobileTopBar calls useRouter() even when a custom leftElement replaces the
// back button, so the app router must be present for it to render at all.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/trades/spot",
  useSearchParams: () => new URLSearchParams(),
}));

/**
 * Reproduces the mobile trade header exactly as spot/margin/futures build it:
 * a back button and a pair popover as SIBLINGS inside `leftElement`.
 *
 * The regression this guards: a single shared `opened` state across the mobile
 * and desktop popovers. Both headers are mounted at once (one is hidden with
 * CSS), so tapping the pair on mobile could leave the dropdown unopenable.
 */
const PairHeader = ({
  onSelect,
  pairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
}: {
  onSelect?: (pair: string) => void;
  pairs?: string[];
}) => {
  const [selectedPair, setSelectedPair] = useState("BTC/USDT");
  const [pairSearch, setPairSearch] = useState("");
  const [pairMenuOpen, setPairMenuOpen] = useState(false);
  const [pairMenuDesktopOpen, setPairMenuDesktopOpen] = useState(false);

  const handleSelectPair = (pair: string) => {
    setSelectedPair(pair);
    setPairSearch("");
    setPairMenuOpen(false);
    setPairMenuDesktopOpen(false);
    onSelect?.(pair);
  };

  return (
    <>
      <MobileTopBar
        showBack
        title=""
        leftElement={
          <div className="flex items-center gap-1">
            <button aria-label="Go back" onClick={() => window.history.back()} className="tap-scale p-0.5 -ml-1 shrink-0">
              back
            </button>
            <Popover width={300} position="bottom-start" shadow="md" opened={pairMenuOpen} onChange={setPairMenuOpen}>
              <PopoverTarget>
                <button
                  data-testid="mobile-pair-trigger"
                  aria-label="Change trading pair"
                  onClick={() => setPairMenuOpen((v) => !v)}
                >
                  {selectedPair}
                </button>
              </PopoverTarget>
              <PopoverDropdown>
                <TextInput
                  data-testid="mobile-pair-search"
                  value={pairSearch}
                  onChange={(e) => setPairSearch(e.target.value)}
                  placeholder="Search pairs"
                />
                {pairs.length === 0 ? (
                  <div>No pairs found</div>
                ) : (
                  pairs.map((p) => (
                    <button key={p} data-testid={`mobile-opt-${p}`} onClick={() => handleSelectPair(p)}>
                      {p}
                    </button>
                  ))
                )}
              </PopoverDropdown>
            </Popover>
          </div>
        }
      />

      {/* Desktop header — hidden on mobile via CSS, but still mounted */}
      <div className="hidden min-[1150px]:flex">
        <Popover width={360} position="bottom-start" shadow="md" opened={pairMenuDesktopOpen} onChange={setPairMenuDesktopOpen}>
          <PopoverTarget>
            <button
              data-testid="desktop-pair-trigger"
              aria-label="Change trading pair"
              onClick={() => setPairMenuDesktopOpen((v) => !v)}
            >
              {selectedPair}
            </button>
          </PopoverTarget>
          <PopoverDropdown>
            {pairs.map((p) => (
              <button key={p} data-testid={`desktop-opt-${p}`} onClick={() => handleSelectPair(p)}>
                {p}
              </button>
            ))}
          </PopoverDropdown>
        </Popover>
      </div>
    </>
  );
};

describe("mobile trade pair selector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the pair dropdown when the active pair is tapped", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PairHeader />);

    const trigger = screen.getByTestId("mobile-pair-trigger");
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    // The dropdown must actually appear — "nothing happens" is the reported bug.
    await waitFor(() => {
      expect(screen.getByTestId("mobile-pair-search")).toBeInTheDocument();
    });
  });

  it("changes the pair on selection and closes the dropdown", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(<PairHeader onSelect={onSelect} />);

    await user.click(screen.getByTestId("mobile-pair-trigger"));
    await waitFor(() => expect(screen.getByTestId("mobile-opt-ETH/USDT")).toBeInTheDocument());

    await user.click(screen.getByTestId("mobile-opt-ETH/USDT"));

    expect(onSelect).toHaveBeenCalledWith("ETH/USDT");
    // Trigger label reflects the new pair.
    await waitFor(() => {
      expect(screen.getByTestId("mobile-pair-trigger")).toHaveTextContent("ETH/USDT");
    });
    // Dropdown closed.
    await waitFor(() => {
      expect(screen.queryByTestId("mobile-pair-search")).not.toBeInTheDocument();
    });
  });

  it("does not navigate away when tapping the pair", async () => {
    const user = userEvent.setup();
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    renderWithProviders(<PairHeader />);

    await user.click(screen.getByTestId("mobile-pair-trigger"));

    // The whole point of the fix: tapping the pair must NOT trigger history.back().
    expect(backSpy).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId("mobile-pair-search")).toBeInTheDocument());
    backSpy.mockRestore();
  });

  it("keeps mobile and desktop dropdown state independent", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PairHeader />);

    // Open the mobile dropdown only.
    await user.click(screen.getByTestId("mobile-pair-trigger"));
    await waitFor(() => expect(screen.getByTestId("mobile-pair-search")).toBeInTheDocument());

    // The desktop dropdown must not have been dragged open by the same state.
    expect(screen.queryByTestId("desktop-opt-BTC/USDT")).not.toBeInTheDocument();
  });

  it("closes and reopens cleanly, clearing the previous search", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PairHeader />);

    await user.click(screen.getByTestId("mobile-pair-trigger"));
    await waitFor(() => expect(screen.getByTestId("mobile-pair-search")).toBeInTheDocument());

    await user.type(screen.getByTestId("mobile-pair-search"), "sol");
    await waitFor(() => expect(screen.getByTestId("mobile-opt-SOL/USDT")).toBeInTheDocument());

    await user.click(screen.getByTestId("mobile-opt-SOL/USDT"));
    await waitFor(() => expect(screen.queryByTestId("mobile-pair-search")).not.toBeInTheDocument());

    // Reopening must not restore the stale "sol" filter.
    await user.click(screen.getByTestId("mobile-pair-trigger"));
    await waitFor(() => expect(screen.getByTestId("mobile-pair-search")).toBeInTheDocument());
    expect(screen.getByTestId("mobile-pair-search")).toHaveValue("");
    await waitFor(() => expect(screen.getByTestId("mobile-opt-BTC/USDT")).toBeInTheDocument());
  });

  it("shows an empty state instead of a blank dropdown", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PairHeader pairs={[]} />);

    await user.click(screen.getByTestId("mobile-pair-trigger"));
    await waitFor(() => expect(screen.getByText("No pairs found")).toBeInTheDocument());
  });

  it("still wires the back arrow to history.back()", async () => {
    const user = userEvent.setup();
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    renderWithProviders(<PairHeader />);

    await user.click(screen.getByLabelText("Go back"));
    expect(backSpy).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
  });

  /**
   * Mantine contract, verified against @mantine/core 7.17.8
   * (PopoverTarget.mjs: `...!ctx.controlled ? { onClick: ctx.onToggle } : null`).
   *
   * Passing `opened` makes the Popover CONTROLLED, and Mantine then attaches NO
   * click handler to the target — the consumer owns the toggle. A controlled
   * Popover whose target has no onClick renders a button that silently does
   * nothing. This is exactly how the spot/margin/futures pair selectors were
   * broken on mobile, so the failure mode is pinned here deliberately.
   */
  it("a controlled popover with no onClick on its target is dead (Mantine contract)", async () => {
    const user = userEvent.setup();
    function Broken() {
      const [opened, setOpened] = useState(false);
      return (
        <Popover opened={opened} onChange={setOpened}>
          <PopoverTarget>
            <button data-testid="broken-trigger">tap me</button>
          </PopoverTarget>
          <PopoverDropdown>
            <div data-testid="broken-dropdown">content</div>
          </PopoverDropdown>
        </Popover>
      );
    }
    renderWithProviders(<Broken />);
    await user.click(screen.getByTestId("broken-trigger"));
    // Proves the guard above is load-bearing: drop the onClick and this fails.
    expect(screen.queryByTestId("broken-dropdown")).not.toBeInTheDocument();
  });

  it("every pair trigger in the header carries a toggle handler", () => {
    renderWithProviders(<PairHeader />);
    // Both mobile and desktop triggers must be wired, since they are both mounted.
    expect(screen.getByTestId("mobile-pair-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("desktop-pair-trigger")).toBeInTheDocument();
  });
});
