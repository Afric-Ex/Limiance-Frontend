import { theme } from "./theme";

describe("theme", () => {
  it("uses a pointer cursor", () => {
    expect(theme.cursorType).toBe("pointer");
  });

  it("uses primary as the primary color at shade 4", () => {
    expect(theme.primaryColor).toBe("primary");
    expect(theme.primaryShade).toBe(4);
  });

  it("defines the primary palette with 10 shades", () => {
    expect(theme.colors.primary).toHaveLength(10);
  });

  it("defines every design-system palette with 10 shades", () => {
    for (const name of [
      "surface",
      "elevated",
      "muted",
      "line",
      "secondary",
      "buy",
      "sell",
      "warning",
    ]) {
      expect(theme.colors[name]).toHaveLength(10);
    }
  });

  it("keeps the expected hex values for semantic colors", () => {
    expect(theme.colors.buy[0]).toBe("#25AB42");
    expect(theme.colors.sell[0]).toBe("#F6465D");
    expect(theme.colors.warning[0]).toBe("#FF9500");
    expect(theme.colors.primary[5]).toBe("#3561e8");
  });

  it("keeps surface and elevated shades consistent across the palette", () => {
    expect(new Set(theme.colors.surface).size).toBe(1);
    expect(theme.colors.surface[0]).toBe("#121212");
    expect(theme.colors.elevated[0]).toBe("#222222");
  });

  it("assigns each semantic palette a single repeated shade", () => {
    for (const name of ["muted", "line", "secondary", "buy", "sell", "warning"]) {
      expect(new Set(theme.colors[name]).size).toBe(1);
    }
  });
});