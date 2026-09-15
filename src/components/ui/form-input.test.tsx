import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { FormInput } from "./form-input";

describe("FormInput", () => {
  it("renders a labelled input with linked id", () => {
    render(<FormInput label="Email Address" />);
    const input = screen.getByLabelText("Email Address");
    expect(input).toHaveAttribute("id", "input-email-address");
  });

  it("uses a provided id", () => {
    render(<FormInput id="custom-id" label="Email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "custom-id");
  });

  it("renders without a label", () => {
    const { container } = render(<FormInput placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
    expect(container.querySelector("label")).not.toBeInTheDocument();
  });

  it("applies standard size by default and compact on request", () => {
    const standard = render(<FormInput label="A" />);
    expect(standard.getByLabelText("A").className).toContain(
      "h-[var(--size-input-standard)]"
    );
    const compact = render(<FormInput label="B" size="compact" />);
    expect(compact.getByLabelText("B").className).toContain(
      "h-[var(--size-input-compact)]"
    );
  });

  it("renders right icon and reserves right padding", () => {
    render(<FormInput label="Pwd" rightIcon={<span>EYE</span>} />);
    const input = screen.getByLabelText("Pwd");
    expect(input.className).toContain("pr-12");
    expect(screen.getByText("EYE")).toBeInTheDocument();
  });

  it("passes through input attributes", () => {
    render(<FormInput type="password" placeholder="secret" />);
    const input = screen.getByPlaceholderText("secret");
    expect(input).toHaveAttribute("type", "password");
  });

  it("supports value changes", () => {
    const onChange = vi.fn();
    render(<FormInput label="Search" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "abc" },
    });
    expect(onChange).toHaveBeenCalled();
  });
});