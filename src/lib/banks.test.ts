import { fiatBanks, getBanksForFiat } from "./banks";

describe("fiatBanks", () => {
  it("exposes the expected fiat currency keys plus DEFAULT", () => {
    expect(Object.keys(fiatBanks).sort()).toEqual(
      ["DEFAULT", "EUR", "GBP", "GHS", "KES", "NGN", "RWF", "TZS", "UGX", "USD", "ZAR"].sort()
    );
  });

  it("gives every currency a non-empty list of non-empty bank names", () => {
    for (const [fiat, banks] of Object.entries(fiatBanks)) {
      expect(fiat.length).toBeGreaterThan(0);
      expect(banks.length).toBeGreaterThan(0);
      for (const bank of banks) {
        expect(typeof bank).toBe("string");
        expect(bank.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps banks unique within each currency list", () => {
    for (const banks of Object.values(fiatBanks)) {
      expect(new Set(banks).size).toBe(banks.length);
    }
  });

  it("places the local transfer option first for each currency", () => {
    expect(fiatBanks.NGN[0]).toBe("Bank Transfer (Nigeria)");
    expect(fiatBanks.USD[0]).toBe("Bank Transfer (US)");
    expect(fiatBanks.DEFAULT[0]).toBe("Bank Transfer");
  });

  it("contains the expected well-known banks", () => {
    expect(fiatBanks.NGN).toContain("Access Bank");
    expect(fiatBanks.NGN).toContain("Zenith Bank");
    expect(fiatBanks.KES).toContain("M-Pesa Kenya");
    expect(fiatBanks.ZAR).toContain("Capitec Bank");
    expect(fiatBanks.GHS).toContain("MTN Mobile Money");
    expect(fiatBanks.USD).toContain("PayPal");
    expect(fiatBanks.EUR).toContain("SEPA Transfer");
    expect(fiatBanks.GBP).toContain("Faster Payments");
  });
});

describe("getBanksForFiat", () => {
  it("returns the exact list for a supported currency code", () => {
    expect(getBanksForFiat("NGN")).toEqual(fiatBanks.NGN);
    expect(getBanksForFiat("USD")).toEqual(fiatBanks.USD);
  });

  it("falls back to the DEFAULT list for an unsupported currency", () => {
    expect(getBanksForFiat("XYZ")).toEqual(fiatBanks.DEFAULT);
    expect(getBanksForFiat("")).toEqual(fiatBanks.DEFAULT);
  });

  it("falls back to the DEFAULT list for null and undefined input", () => {
    expect(getBanksForFiat(null as unknown as string)).toEqual(fiatBanks.DEFAULT);
    expect(getBanksForFiat(undefined as unknown as string)).toEqual(fiatBanks.DEFAULT);
  });

  it("is case-sensitive when matching currency codes", () => {
    const lower = getBanksForFiat("ngn");
    expect(lower).toEqual(fiatBanks.DEFAULT);
    expect(lower).not.toEqual(fiatBanks.NGN);
  });

  it("always returns a valid array for any input", () => {
    for (const input of ["EUR", "erj", "  ", "usd", "NGN"]) {
      expect(getBanksForFiat(input).length).toBeGreaterThan(0);
    }
  });
});