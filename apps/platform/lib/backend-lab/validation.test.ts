import { describe, expect, it } from "vitest";
import { parseTemporaryBackendInput } from "./validation";

describe("temporary backend contract validation", () => {
  it("accepts a bounded JSON endpoint contract", () => {
    expect(parseTemporaryBackendInput({
      name: "Storefront prototype",
      ttlMinutes: 30,
      contract: { version: 1, endpoints: [{ method: "GET", path: "/products", body: [{ id: "p-1" }] }] },
    }).contractJson).toContain('"/products"');
  });

  it("rejects traversal and duplicate endpoint paths", () => {
    expect(() => parseTemporaryBackendInput({
      name: "Unsafe API",
      ttlMinutes: 30,
      contract: { version: 1, endpoints: [{ method: "GET", path: "/../secrets", body: {} }] },
    })).toThrow("Endpoint paths");
    expect(() => parseTemporaryBackendInput({
      name: "Duplicate API",
      ttlMinutes: 30,
      contract: { version: 1, endpoints: [
        { method: "GET", path: "/products", body: {} },
        { method: "GET", path: "/products", body: {} },
      ] },
    })).toThrow("unique");
  });
});
