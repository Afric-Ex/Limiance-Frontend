import { createOrderSchema } from "./p2p-schema";

describe("createOrderSchema", () => {
  const validPayload = {
    asset: "USDT",
    fiat: "USD",
    quantity: 100,
    minQuantity: 10,
    maxQuantity: 50,
    remark: "Fast trade",
    paymentMethod: ["bank", "card"],
  };

  it("accepts a fully valid payload", () => {
    const result = createOrderSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validPayload);
  });

  it("accepts boundary-valid quantities", () => {
    const boundary = {
      ...validPayload,
      quantity: 2,
      minQuantity: 1,
      maxQuantity: 2,
    };
    const result = createOrderSchema.safeParse(boundary);
    expect(result.success).toBe(true);
  });

  it("rejects an empty asset", () => {
    const result = createOrderSchema.safeParse({ ...validPayload, asset: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["asset"]);
      expect(result.error.flatten().fieldErrors.asset).toContain("Coin is required");
    }
  });

  it("rejects a missing asset", () => {
    const { asset, ...rest } = validPayload;
    const result = createOrderSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an empty fiat", () => {
    const result = createOrderSchema.safeParse({ ...validPayload, fiat: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.fiat).toContain("Fiat is required");
    }
  });

  it("rejects an empty remark", () => {
    const result = createOrderSchema.safeParse({ ...validPayload, remark: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.remark).toContain("Remark is required");
    }
  });

  it("rejects quantity below the minimum", () => {
    for (const quantity of [0, -1]) {
      const result = createOrderSchema.safeParse({ ...validPayload, quantity });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.quantity).toContain("Total quantity is required");
      }
    }
  });

  it("rejects a missing quantity", () => {
    const { quantity, ...rest } = validPayload;
    const result = createOrderSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects minQuantity below the minimum", () => {
    for (const minQuantity of [0, -5]) {
      const result = createOrderSchema.safeParse({ ...validPayload, minQuantity });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.minQuantity).toContain("Minimum amount is required");
      }
    }
  });

  it("rejects maxQuantity below the minimum", () => {
    for (const maxQuantity of [0, -100]) {
      const result = createOrderSchema.safeParse({ ...validPayload, maxQuantity });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.maxQuantity).toContain("Maximum amount is required");
      }
    }
  });

  it("rejects an empty payment method list", () => {
    const result = createOrderSchema.safeParse({ ...validPayload, paymentMethod: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.paymentMethod).toContain(
        "Select at least one payment method"
      );
    }
  });

  it("rejects paymentMethod entries that are not strings", () => {
    const result = createOrderSchema.safeParse({ ...validPayload, paymentMethod: ["bank", 5] });
    expect(result.success).toBe(false);
  });

  it("rejects a maxQuantity that is not greater than minQuantity", () => {
    for (const maxQuantity of [10, 5]) {
      const result = createOrderSchema.safeParse({ ...validPayload, minQuantity: 10, maxQuantity });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.join(".") === "maxQuantity");
        expect(issue?.message).toBe("Maximum limit must be greater than minimum");
      }
    }
  });

  it("rejects a maxQuantity that exceeds total quantity", () => {
    const result = createOrderSchema.safeParse({ ...validPayload, quantity: 100, maxQuantity: 150 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join(".") === "maxQuantity");
      expect(issue?.message).toBe("Maximum limit cannot exceed total quantity");
    }
  });

  it("rejects a minQuantity that exceeds total quantity", () => {
    const result = createOrderSchema.safeParse({ ...validPayload, quantity: 100, minQuantity: 150 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join(".") === "minQuantity");
      expect(issue?.message).toBe("Minimum limit cannot exceed total quantity");
    }
  });

  it("reports every failing field at once", () => {
    const result = createOrderSchema.safeParse({
      ...validPayload,
      quantity: 100,
      minQuantity: 300,
      maxQuantity: 200,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Maximum limit must be greater than minimum");
      expect(messages).toContain("Maximum limit cannot exceed total quantity");
      expect(messages).toContain("Minimum limit cannot exceed total quantity");
    }
  });
});