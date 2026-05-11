import { describe, expect, it } from "vitest";
import { PRIVATE, assertPrivateContext } from "./private-symbol";

describe("private-symbol", () => {
  it("should be a symbol", () => {
    expect(typeof PRIVATE).toBe("symbol");
  });

  it("should have the correct description", () => {
    expect(PRIVATE.description).toBe("signals-private");
  });

  it("should be unique", () => {
    expect(PRIVATE).not.toBe(Symbol("signals-private"));
  });
});

describe("assertPrivateContext", () => {
  it("should not throw when called with the PRIVATE symbol", () => {
    expect(() => assertPrivateContext(PRIVATE)).not.toThrow();
  });

  it("should throw when called with a different symbol", () => {
    expect(() => assertPrivateContext(Symbol("signals-private"))).toThrow("Invalid symbol");
  });

  it("should throw when called with an unrelated symbol", () => {
    expect(() => assertPrivateContext(Symbol())).toThrow("Invalid symbol");
  });
});