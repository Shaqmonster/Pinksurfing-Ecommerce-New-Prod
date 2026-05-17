import { describe, expect, it } from "vitest";
import { formatGateHint, servicesBuyerWorkflowSteps, servicesGates } from "./servicesEscrowFlowGates.js";

/** Minimal getEscrowState-like tuple for tests. */
function state({
  num = 2,
  completed = 0,
  depositReleased = false,
  halfwayReleased = false,
  completionReleased = false,
  midwayReviewed = false,
  finalReviewed = false,
}) {
  return [
    1n,
    "0x1",
    "0x2",
    0n,
    0n,
    BigInt(num),
    BigInt(completed),
    depositReleased,
    halfwayReleased,
    completionReleased,
    false,
    midwayReviewed,
    finalReviewed,
    false,
  ];
}

describe("servicesEscrowFlowGates", () => {
  it("blocks midway review until enough milestones after kickoff", () => {
    const g = servicesGates(state({ depositReleased: true, completed: 0, num: 2 }));
    expect(g.submitMidwayReview.enabled).toBe(false);
    expect(g.submitMidwayReview.labelBlocked).toMatch(/1st milestone/i);
  });

  it("enables midway review when half milestones done", () => {
    const g = servicesGates(state({ depositReleased: true, completed: 1, num: 2 }));
    expect(g.submitMidwayReview.enabled).toBe(true);
    expect(g.submitMidwayReview.labelReady).toMatch(/midway review/i);
  });

  it("shows kickoff done message without blocking midway with deposit text", () => {
    const g = servicesGates(state({ depositReleased: true, completed: 0 }));
    expect(formatGateHint(g.releaseDeposit)).toMatch(/Kickoff released/i);
    expect(formatGateHint(g.submitMidwayReview)).toMatch(/Waiting for the freelancer/i);
  });

  it("buyer workflow marks midway as waiting after kickoff", () => {
    const steps = servicesBuyerWorkflowSteps(state({ depositReleased: true, completed: 0, num: 2 }));
    const midway = steps.find((x) => x.key === "submitMidwayReview");
    expect(midway?.status).toBe("waiting");
    expect(midway?.hint).toMatch(/freelancer/i);
  });
});
