import { beforeEach, describe, expect, it } from "vitest";
import { Computed } from "../../models/computed/computed";
import { GLOBAL_STATE, popComputed, pushComputed } from "./globals";

const mockComputed = (id: string) => ({ id }) as unknown as Computed;

describe("globals", () => {

  beforeEach(() => {
    while (GLOBAL_STATE.computing) {
      popComputed();
    }
    GLOBAL_STATE.frozen = false;
  });

  describe("GLOBAL_STATE initial state", () => {
    it("should have computing set to null", () => {
      expect(GLOBAL_STATE.computing).toBeNull();
    });

    it("should have frozen set to false", () => {
      expect(GLOBAL_STATE.frozen).toBe(false);
    });
  });

  describe("pushComputed", () => {
    it("should set GLOBAL_STATE.computing to the pushed computed", () => {
      const computed = mockComputed("a");
      pushComputed(computed);
      expect(GLOBAL_STATE.computing).toBe(computed);
    });

    it("should set the last pushed computed as active when pushing multiple", () => {
      const a = mockComputed("a");
      const b = mockComputed("b");
      pushComputed(a);
      pushComputed(b);
      expect(GLOBAL_STATE.computing).toBe(b);
    });
  });

  describe("popComputed", () => {
    it("should restore the previous computed after pop", () => {
      const a = mockComputed("a");
      const b = mockComputed("b");
      pushComputed(a);
      pushComputed(b);
      popComputed();
      expect(GLOBAL_STATE.computing).toBe(a);
    });

    it("should set computing to null when the stack is empty", () => {
      const a = mockComputed("a");
      pushComputed(a);
      popComputed();
      expect(GLOBAL_STATE.computing).toBeNull();
    });

    it("should handle popping an already empty stack gracefully", () => {
      expect(() => popComputed()).not.toThrow();
      expect(GLOBAL_STATE.computing).toBeNull();
    });
  });

  describe("push/pop sequence", () => {
    it("should correctly track nested computations", () => {
      const a = mockComputed("a");
      const b = mockComputed("b");
      const c = mockComputed("c");

      pushComputed(a);
      pushComputed(b);
      pushComputed(c);
      expect(GLOBAL_STATE.computing).toBe(c);

      popComputed();
      expect(GLOBAL_STATE.computing).toBe(b);

      popComputed();
      expect(GLOBAL_STATE.computing).toBe(a);

      popComputed();
      expect(GLOBAL_STATE.computing).toBeNull();
    });
  });
});