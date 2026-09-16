import React from "react";
(globalThis as any).React = React;
import { screen, fireEvent } from "@testing-library/react";
import { LanguageDropdown } from "./language-dropdown";
import { installTestGlobals, renderWithProviders } from "@/src/test/utils";
import { api } from "@/src/lib/axios";

installTestGlobals();

vi.mock("@/src/lib/axios", () => ({
  api: { get: vi.fn() },
}));

const mockGet = vi.mocked(api.get);

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockResolvedValue({ data: { data: [] } });
});

describe("LanguageDropdown", () => {
  it("renders the language tab by default", () => {
    renderWithProviders(<LanguageDropdown />, { withQuery: true });
    expect(screen.getByRole("tab", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
  });

  it("fetches languages from the /languages api", async () => {
    mockGet.mockResolvedValue({ data: { data: ["English", "Français", "Deutsch"] } });
    renderWithProviders(<LanguageDropdown />, { withQuery: true });
    expect(await screen.findByText("Français")).toBeInTheDocument();
    expect(screen.getByText("Deutsch")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("/languages");
  });

  it("renders object-shaped languages from the api", async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          { code: "en", name: "English" },
          { code: "fr", name: "Français" },
        ],
      },
    });
    renderWithProviders(<LanguageDropdown />, { withQuery: true });
    expect(await screen.findByText("Français")).toBeInTheDocument();
  });

  it("falls back to the static language array when the api fails", async () => {
    mockGet.mockRejectedValue(new Error("network"));
    renderWithProviders(<LanguageDropdown />, { withQuery: true });
    expect(await screen.findByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
  });

  it("highlights the default language", () => {
    renderWithProviders(<LanguageDropdown />, { withQuery: true });
    expect(screen.getByText("English").className).toContain("text-primary");
  });

  it("switches to the currency tab", () => {
    renderWithProviders(<LanguageDropdown />, { withQuery: true });
    fireEvent.click(screen.getByRole("tab", { name: "Currency" }));
    expect(screen.getByText("USD - $")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("renders without a fixed width when mobile", () => {
    const { container } = renderWithProviders(<LanguageDropdown isMobile />, {
      withQuery: true,
    });
    expect(container.firstChild?.className).not.toContain("w-[354px]");
  });
});