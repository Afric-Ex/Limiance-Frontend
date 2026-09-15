import * as ui from "./index";
import { Card } from "./card";
import { Button } from "./button";
import { FormInput } from "./form-input";
import { SegmentedControl } from "./segmented-control";
import { StatCell } from "./stat-cell";
import { CoinRow } from "./coin-row";
import { ModalShell } from "./modal-shell";
import { DropdownPopover, DropdownItem } from "./dropdown-popover";
import { EmptyState } from "./empty-state";

describe("ui barrel", () => {
  it("re-exports every component", () => {
    expect(ui.Card).toBe(Card);
    expect(ui.Button).toBe(Button);
    expect(ui.FormInput).toBe(FormInput);
    expect(ui.SegmentedControl).toBe(SegmentedControl);
    expect(ui.StatCell).toBe(StatCell);
    expect(ui.CoinRow).toBe(CoinRow);
    expect(ui.ModalShell).toBe(ModalShell);
    expect(ui.DropdownPopover).toBe(DropdownPopover);
    expect(ui.DropdownItem).toBe(DropdownItem);
    expect(ui.EmptyState).toBe(EmptyState);
  });

  it("exposes the component types", () => {
    expect(ui.CardProps).toBeUndefined(); // types erase at runtime
  });
});