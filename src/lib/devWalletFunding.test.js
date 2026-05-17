import { describe, expect, it } from "vitest";
import { isLocalAnvilEscrow, isLocalRpcUrl } from "./devWalletFunding.js";

describe("devWalletFunding", () => {
  it("detects local RPC hosts", () => {
    expect(isLocalRpcUrl("http://127.0.0.1:8545")).toBe(true);
    expect(isLocalRpcUrl("http://localhost:8545")).toBe(true);
    expect(isLocalRpcUrl("https://mainnet.infura.io")).toBe(false);
  });
});
