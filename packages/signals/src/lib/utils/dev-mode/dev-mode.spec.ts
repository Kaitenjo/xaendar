import { beforeEach, describe, expect, it } from "vitest";
import { isDevMode, setDevMode } from "./dev-mode";

describe("devMode", () => {
  beforeEach(() => {
    setDevMode(false);
  });

  it("should return false by default", () => {
    expect(isDevMode()).toBe(false);
  });

  it("should set dev mode to true", () => {
    setDevMode(true);
    expect(isDevMode()).toBe(true);
  });

  it("should set dev mode back to false", () => {
    setDevMode(true);
    setDevMode(false);
    expect(isDevMode()).toBe(false);
  });
});