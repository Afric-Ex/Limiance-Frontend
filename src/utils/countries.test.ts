import { countryData } from "./countries";

describe("countryData", () => {
  it("contains the full list of supported countries", () => {
    expect(countryData).toHaveLength(261);
  });

  it("gives every entry a non-empty value and label", () => {
    for (const entry of countryData) {
      expect(entry.value).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });

  it("gives every entry a cdn.jsdelivr.net flag image URL", () => {
    for (const entry of countryData) {
      expect(entry.image).toMatch(
        /^https:\/\/cdn\.jsdelivr\.net\/npm\/country-flag-emoji-json@2\.0\.0\/dist\/images\/.+\.svg$/
      );
    }
  });

  it("keeps labels unique", () => {
    const labels = countryData.map((entry) => entry.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("contains the expected common countries", () => {
    expect(countryData.find((entry) => entry.value === "Nigeria")?.label).toBe("NG");
    expect(countryData.find((entry) => entry.value === "Ghana")?.label).toBe("GH");
    expect(countryData.find((entry) => entry.value === "United States")?.label).toBe("US");
  });

  it("includes the home-nations flags used by the profile picker", () => {
    expect(countryData.find((entry) => entry.value === "England")?.label).toBe("ENGLAND");
    expect(countryData.find((entry) => entry.value === "Scotland")?.label).toBe("SCOTLAND");
    expect(countryData.find((entry) => entry.value === "Wales")?.label).toBe("WALES");
  });
});