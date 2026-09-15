import * as assetStore from "./asset-store";

describe("asset-store", () => {
  it("loads as an empty module with no exports", () => {
    expect(Object.keys(assetStore)).toHaveLength(0);
  });
});