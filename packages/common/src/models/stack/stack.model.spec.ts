import { beforeEach, describe, expect, it } from "vitest";
import { Stack } from "./stack.model";

describe("Stack", () => {
  let stack: Stack<number>;

  beforeEach(() => {
    stack = new Stack<number>();
  });

  describe("initial state", () => {
    it("should have length 0", () => {
      expect(stack.length).toBe(0);
    });

    it("should have empty values", () => {
      expect(stack.values).toEqual([]);
    });
  });

  describe("push", () => {
    it("should increase the length by 1", () => {
      stack.push(1);
      expect(stack.length).toBe(1);
    });

    it("should return the new length", () => {
      expect(stack.push(1)).toBe(1);
      expect(stack.push(2)).toBe(2);
    });

    it("should make the element accessible by index", () => {
      stack.push(10);
      expect(stack[0]).toBe(10);
    });

    it("should stack elements in order (bottom to top)", () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      expect(stack.values).toEqual([1, 2, 3]);
    });
  });

  describe("pop", () => {
    it("should return undefined on an empty stack", () => {
      expect(stack.pop()).toBeUndefined();
    });

    it("should return the last pushed element", () => {
      stack.push(1);
      stack.push(2);
      expect(stack.pop()).toBe(2);
    });

    it("should decrease the length by 1", () => {
      stack.push(1);
      stack.push(2);
      stack.pop();
      expect(stack.length).toBe(1);
    });

    it("should remove the top element", () => {
      stack.push(1);
      stack.push(2);
      stack.pop();
      expect(stack.values).toEqual([1]);
    });
  });

  describe("index access", () => {
    it("should access elements by index", () => {
      stack.push(10);
      stack.push(20);
      stack.push(30);
      expect(stack[0]).toBe(10);
      expect(stack[1]).toBe(20);
      expect(stack[2]).toBe(30);
    });

    it("should return undefined for out-of-bounds index", () => {
      stack.push(1);
      expect(stack[5]).toBeUndefined();
    });
  });

  describe("values", () => {
    it("should return a shallow copy", () => {
      stack.push(1);
      const values = stack.values;
      values.push(99);
      expect(stack.length).toBe(1);
    });
  });

  describe("push/pop sequence", () => {
    it("should behave as LIFO", () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      expect(stack.pop()).toBe(3);
      expect(stack.pop()).toBe(2);
      expect(stack.pop()).toBe(1);
      expect(stack.pop()).toBeUndefined();
    });
  });
});