import { describe, expect, it } from "vitest";
import { parseEther } from "ethers";
import {
  servicesFinalPayoutPreview,
  servicesFinalReviewMsgValue,
  servicesRcqStarsExact,
  servicesRcqPassesForSatisfaction,
  servicesStarRCQ,
} from "./servicesEscrowMath.js";

const AMOUNT = parseEther("0.01");

describe("workflow.md satisfaction", () => {
  it("example: R1 C1 Q5 T7 → RCQ ~4.46, pays full 30%", () => {
    const exact = servicesRcqStarsExact(1, 1, 5);
    expect(exact).toBeGreaterThan(4.1);
    expect(exact).toBeLessThan(4.2);
    expect(servicesRcqPassesForSatisfaction(1, 1, 5)).toBe(true);
    expect(servicesFinalReviewMsgValue(AMOUNT, 1, 1, 7, 5)).toBeGreaterThan(0n);
  });

  it("example: R1 C1 Q4 T1 → RCQ ~3.38, pays 21% of total (30% − 9%)", () => {
    const exact = servicesRcqStarsExact(1, 1, 4);
    expect(exact).toBeGreaterThan(3.3);
    expect(exact).toBeLessThan(3.5);
    expect(servicesStarRCQ(1, 1, 4)).toBe(3);
    expect(servicesRcqPassesForSatisfaction(1, 1, 4)).toBe(true);
    const wei = servicesFinalReviewMsgValue(AMOUNT, 1, 1, 1, 4);
    const pct = Number((wei * 10000n) / AMOUNT) / 100;
    expect(pct).toBeCloseTo(21, 1);
  });

  it("quality 1 blocks auto payout", () => {
    expect(servicesFinalReviewMsgValue(AMOUNT, 7, 7, 7, 1)).toBe(0n);
  });

  it("RCQ ≤2 blocks auto payout", () => {
    expect(servicesRcqPassesForSatisfaction(1, 1, 1)).toBe(false);
    expect(servicesFinalReviewMsgValue(AMOUNT, 1, 1, 7, 1)).toBe(0n);
  });
});
