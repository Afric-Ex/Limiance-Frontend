import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { OtpInput } from "./otp-input";

describe("OtpInput", () => {
  const renderOtp = (props: {
    value: string;
    onChange: (v: string) => void;
    digits?: number;
    error?: boolean;
  }) => {
    const { value, onChange, ...rest } = props;
    return renderWithProviders(
      <OtpInput value={value} onChange={onChange} {...rest} />
    );
  };

  it("renders 6 inputs by default", () => {
    const onChange = vi.fn();
    renderOtp({ value: "", onChange });
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
  });

  it("renders the requested number of digits", () => {
    const onChange = vi.fn();
    renderOtp({ value: "", onChange, digits: 4 });
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
  });

  it("publishes a typed digit and auto-focuses the next input", () => {
    const onChange = vi.fn();
    renderOtp({ value: "", onChange });
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: "1" } });
    expect(onChange).toHaveBeenCalledWith("1");
    expect(inputs[1]).toHaveFocus();
  });

  it("ignores non-numeric input", () => {
    const onChange = vi.fn();
    renderOtp({ value: "", onChange });
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "a" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports pasting a full code", () => {
    const onChange = vi.fn();
    renderOtp({ value: "", onChange });
    fireEvent.paste(screen.getAllByRole("textbox")[0], {
      clipboardData: { getData: () => "123456" },
    });
    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("moves to the previous box on backspace over an empty box", () => {
    const onChange = vi.fn();
    renderOtp({ value: "1", onChange });
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    fireEvent.keyDown(inputs[1], { key: "Backspace" });
    expect(onChange).toHaveBeenCalledWith("");
    expect(inputs[0]).toHaveFocus();
  });

  it("applies an error style when error is true", () => {
    const onChange = vi.fn();
    const { container } = renderOtp({ value: "", onChange, error: true });
    expect(container.querySelectorAll("input[class*='border-red-500']")).toHaveLength(6);
  });
});