import { describe, expect, it } from "vitest";
import { anvil, base, sepolia } from "thirdweb/chains";
import { resolveThirdwebOnRampChain } from "./thirdwebOnRampChain.js";

describe("resolveThirdwebOnRampChain", () => {
  it("falls back to Anvil for unknown or invalid ids", () => {
    expect(resolveThirdwebOnRampChain(undefined)).toBe(anvil);
    expect(resolveThirdwebOnRampChain("")).toBe(anvil);
    expect(resolveThirdwebOnRampChain(NaN)).toBe(anvil);
    expect(resolveThirdwebOnRampChain(999999)).toBe(anvil);
  });

  it("resolves known chain ids", () => {
    expect(resolveThirdwebOnRampChain(31337)).toBe(anvil);
    expect(resolveThirdwebOnRampChain(8453)).toBe(base);
    expect(resolveThirdwebOnRampChain("11155111")).toBe(sepolia);
  });
});
