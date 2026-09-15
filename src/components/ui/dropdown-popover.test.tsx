import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { DropdownPopover, DropdownItem } from "./dropdown-popover";

describe("DropdownPopover", () => {
  it("renders children with default min width", () => {
    const { container } = render(
      <DropdownPopover>Menu content</DropdownPopover>
    );
    expect(screen.getByText("Menu content")).toBeInTheDocument();
    expect(container.firstChild).toHaveStyle({ minWidth: "280px" });
  });

  it("honours a custom minWidth and className", () => {
    const { container } = render(
      <DropdownPopover minWidth={200} className="custom-pop">
        Content
      </DropdownPopover>
    );
    expect(container.firstChild).toHaveStyle({ minWidth: "200px" });
    expect(container.firstChild?.className).toContain("custom-pop");
  });
});

describe("DropdownItem", () => {
  it("renders children as a button", () => {
    render(<DropdownItem>Item one</DropdownItem>);
    const btn = screen.getByRole("button", { name: "Item one" });
    expect(btn).toHaveAttribute("type", "button");
  });

  it("renders icon and description", () => {
    render(
      <DropdownItem icon={<span>IC</span>} description="A description">
        Item
      </DropdownItem>
    );
    expect(screen.getByText("IC")).toBeInTheDocument();
    expect(screen.getByText("A description")).toBeInTheDocument();
  });

  it("triggers onClick", () => {
    const onClick = vi.fn();
    render(<DropdownItem onClick={onClick}>Click me</DropdownItem>);
    fireEvent.click(screen.getByRole("button", { name: "Click me" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});