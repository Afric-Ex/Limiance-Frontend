import { describe, expect, it } from "vitest";
import { readList, readNumber, unwrapObject } from "./api-response";

describe("unwrapObject", () => {
  it("returns a bare object body", () => {
    expect(unwrapObject({ fee: "0.5" })).toEqual({ fee: "0.5" });
  });

  it("descends a data envelope", () => {
    expect(unwrapObject({ data: { fee: "0.5" } })).toEqual({ fee: "0.5" });
  });

  it("descends nested envelopes", () => {
    expect(unwrapObject({ data: { data: { fee: "0.5" } } })).toEqual({ fee: "0.5" });
  });

  it("returns null for arrays, nullish and primitives", () => {
    expect(unwrapObject([{ fee: 1 }])).toBeNull();
    expect(unwrapObject(undefined)).toBeNull();
    expect(unwrapObject(null)).toBeNull();
    expect(unwrapObject("nope")).toBeNull();
  });

  it("does not descend into a null data key", () => {
    expect(unwrapObject({ data: null, fee: "1" })).toEqual({ data: null, fee: "1" });
  });
});

describe("readNumber", () => {
  it("parses numeric strings and numbers", () => {
    expect(readNumber({ fee: "0.5" }, "fee")).toBe(0.5);
    expect(readNumber({ fee: 12 }, "fee")).toBe(12);
  });

  it("distinguishes a real zero from an absent field", () => {
    expect(readNumber({ fee: 0 }, "fee")).toBe(0);
    expect(readNumber({ fee: "0" }, "fee")).toBe(0);
    expect(readNumber({}, "fee")).toBeNull();
    expect(readNumber({ fee: null }, "fee")).toBeNull();
    expect(readNumber({ fee: "" }, "fee")).toBeNull();
  });

  it("rejects unparseable values", () => {
    expect(readNumber({ fee: "abc" }, "fee")).toBeNull();
    expect(readNumber({ fee: Infinity }, "fee")).toBeNull();
    expect(readNumber(null, "fee")).toBeNull();
  });
});

describe("readList", () => {
  it("reads the list out of a backend envelope", () => {
    expect(readList({ data: [{ id: 1 }], totalRecords: "1" })).toEqual([{ id: 1 }]);
  });

  it("reads the list out of an unwrapped AxiosResponse (the p2p shape)", () => {
    expect(readList({ data: { data: [{ id: 2 }], totalRecords: "1" } })).toEqual([{ id: 2 }]);
  });

  it("accepts a bare array", () => {
    expect(readList([{ id: 3 }])).toEqual([{ id: 3 }]);
  });

  it("returns an empty array for a swallowed error body", () => {
    // asset.transactionHistory catches 502s and returns the body as a success,
    // so this shape reaches the pagination loop and must not read as a page.
    expect(readList({ statusCode: 502, error: "Bad Gateway" })).toEqual([]);
    expect(readList({ message: "Unauthenticated" })).toEqual([]);
  });

  it("returns an empty array for nullish and primitive bodies", () => {
    expect(readList(null)).toEqual([]);
    expect(readList(undefined)).toEqual([]);
    expect(readList("nope")).toEqual([]);
    expect(readList({})).toEqual([]);
  });

  it("prefers the outer array over a nested one", () => {
    expect(readList({ data: [{ id: 1 }], nested: { data: [{ id: 9 }] } })).toEqual([{ id: 1 }]);
  });
});
