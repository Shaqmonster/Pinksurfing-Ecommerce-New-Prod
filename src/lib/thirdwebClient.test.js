import { describe, expect, it } from "vitest";
import { createThirdwebClientFromId } from "./thirdwebClient.js";

describe("createThirdwebClientFromId", () => {
  it("returns null for empty input", () => {
    expect(createThirdwebClientFromId("")).toBeNull();
    expect(createThirdwebClientFromId("   ")).toBeNull();
    expect(createThirdwebClientFromId(undefined)).toBeNull();
    expect(createThirdwebClientFromId(null)).toBeNull();
  });

  it("returns a client for a non-empty id", () => {
    const c = createThirdwebClientFromId("test-client-id-for-unit-test");
    expect(c).toBeTruthy();
  });
});
