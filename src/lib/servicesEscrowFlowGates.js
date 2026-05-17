function ordinal(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 1) return String(n);
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[num % 10] || "th";
  return `${num}${suffix}`;
}

function midwayMilestonesRequired(num) {
  return Math.floor(Number(num) / 2);
}

/**
 * @param {bigint[] | unknown[] | null | undefined} s getEscrowState tuple
 */
export function servicesGates(s) {
  if (!s?.[0]) return null;
  const num = Number(s[5]);
  const completed = Number(s[6]);
  const depositReleased = Boolean(s[7]);
  const halfwayReleased = Boolean(s[8]);
  const completionReleased = Boolean(s[9]);
  const satisfactionReleased = Boolean(s[10]);
  const midwayReviewed = Boolean(s[11]);
  const finalReviewed = Boolean(s[12]);
  const disputed = Boolean(s[13]);
  const half = midwayMilestonesRequired(num);

  const milestoneGates = {};
  for (let i = 0; i < num; i++) {
    const ord = i + 1;
    const isSecondPhaseMilestone = i >= half && num > 1;
    const basicOrderReady = completed === i;
    const kickoffReady = depositReleased;
    const midwayReady = !isSecondPhaseMilestone || midwayReviewed;
    const enabled = basicOrderReady && kickoffReady && midwayReady;

    let labelBlocked = "";
    if (!kickoffReady) {
      labelBlocked = "Waiting for the client to release kickoff payment.";
    } else if (!basicOrderReady) {
      labelBlocked =
        i === 0
          ? "Mark milestones in order, starting with milestone 1."
          : `Mark milestone ${ord} after milestone ${i} is done.`;
    } else if (!midwayReady) {
      labelBlocked =
        "Waiting for the client to submit the midway review before you can mark later milestones.";
    }

    milestoneGates[`completeMilestone${i}`] = {
      done: completed >= ord,
      enabled,
      labelDone: `Milestone ${ord} marked complete.`,
      labelBlocked,
      labelReady: `You can mark milestone ${ord} as done on-chain.`,
    };
  }

  let submitMidwayBlocked = "";
  if (!depositReleased) {
    submitMidwayBlocked = "Release kickoff payment first so the freelancer can start work.";
  } else if (completed < half) {
    const remaining = half - completed;
    if (completed === 0) {
      submitMidwayBlocked =
        num <= 1
          ? "Waiting for the freelancer to mark the milestone as done."
          : `Waiting for the freelancer to mark the ${ordinal(1)} milestone as done (${half} of ${num} required before midway review).`;
    } else {
      submitMidwayBlocked = `Waiting for the freelancer to mark ${remaining} more milestone${
        remaining === 1 ? "" : "s"
      } (${completed}/${half} done — midway review unlocks at ${half}/${num}).`;
    }
  }

  let releaseCompletionBlocked = "";
  if (!midwayReviewed) {
    releaseCompletionBlocked =
      "Submit the midway review first. That releases the halfway payment and lets the freelancer finish any remaining milestones.";
  } else if (completed < num) {
    const next = completed + 1;
    releaseCompletionBlocked =
      completed === 0
        ? `Waiting for the freelancer to mark all milestones (0/${num} done).`
        : `Waiting for the freelancer to finish milestones (${completed}/${num} done${
            next <= num ? ` — next: milestone ${next}` : ""
          }).`;
  }

  let submitFinalBlocked = "";
  if (!completionReleased) {
    if (!midwayReviewed) {
      submitFinalBlocked = "Complete midway review and milestone delivery before the final review.";
    } else if (completed < num) {
      submitFinalBlocked = `Release completion payment after all milestones are marked (${completed}/${num} done).`;
    } else {
      submitFinalBlocked = "Release completion payment to unlock the final review and satisfaction slice.";
    }
  }

  return {
    releaseDeposit: {
      done: depositReleased,
      enabled: !depositReleased,
      labelDone: "Kickoff released — freelancer can start milestone 1.",
      labelReady: "Release the first payment so work can begin.",
      labelBlocked: "",
    },
    ...milestoneGates,
    submitMidwayReview: {
      done: midwayReviewed,
      enabled: !midwayReviewed && completed >= half && num > 0 && depositReleased,
      labelDone: "Midway review submitted — halfway payment released on-chain.",
      labelReady: "Rate R/C/Q/T (1–7) and submit midway review to release the halfway payment.",
      labelBlocked: submitMidwayBlocked,
    },
    releaseCompletion: {
      done: completionReleased,
      enabled: !completionReleased && halfwayReleased && completed >= num && num > 0,
      labelDone: "Completion payment released.",
      labelReady: "Release completion payment after all milestones are done.",
      labelBlocked: releaseCompletionBlocked,
    },
    submitFinalReview: {
      done: finalReviewed,
      enabled: !finalReviewed && completionReleased,
      labelDone: "Final review submitted.",
      labelReady: "Submit final review (and satisfaction payment if scores allow).",
      labelBlocked: submitFinalBlocked,
    },
    openDispute: {
      enabled: finalReviewed && !disputed && !satisfactionReleased,
      labelDone: disputed ? "Dispute opened." : "",
      labelReady: "Open a dispute after an unhappy final review.",
      labelBlocked: "Available only after a low-score final review with no satisfaction payout.",
    },
    cancelExpiredEscrow: {
      enabled: !satisfactionReleased,
      labelDone: satisfactionReleased ? "Job finalized on-chain." : "",
      labelReady: "Cancel if deadlines expired (per contract rules).",
      labelBlocked: "Use only after milestone deadlines and grace period.",
    },
  };
}

/** Buyer-facing ordered steps for timeline UI. */
export function servicesBuyerWorkflowSteps(s) {
  const gates = servicesGates(s);
  if (!gates) return [];

  const num = Number(s[5]);
  const completed = Number(s[6]);
  const half = midwayMilestonesRequired(num);
  const midwayReviewed = Boolean(s[11]);

  const step = (key, title, gate, extra = {}) => {
    const g = gates[key];
    let status = "upcoming";
    if (g?.done) status = "done";
    else if (g?.enabled) status = "ready";
    else if (gates.releaseDeposit?.done || key !== "releaseDeposit") status = "waiting";

    return {
      key,
      title,
      status,
      hint: g?.done ? g.labelDone : g?.enabled ? g.labelReady : g?.labelBlocked,
      ...extra,
    };
  };

  return [
    step("releaseDeposit", "Kickoff payment", gates.releaseDeposit),
    {
      key: "freelancer_milestones_phase1",
      title: num > 1 ? `Freelancer milestones 1–${half}` : "Freelancer milestone",
      status:
        completed >= half
          ? "done"
          : gates.releaseDeposit?.done
            ? "waiting"
            : "upcoming",
      hint:
        completed >= half
          ? `${half}/${half} milestone${half === 1 ? "" : "s"} complete — ready for midway review.`
          : gates.releaseDeposit?.done
            ? `Waiting for freelancer to mark ${completed === 0 ? `the ${ordinal(1)}` : "more"} milestone${
                half - completed === 1 ? "" : "s"
              } (${completed}/${half} for midway).`
            : "Unlocks after kickoff payment.",
    },
    step("submitMidwayReview", "Midway review (client)", gates.submitMidwayReview),
    {
      key: "freelancer_milestones_phase2",
      title: num > half ? `Freelancer milestones ${half + 1}–${num}` : "Remaining delivery",
      status:
        num <= half || completed >= num
          ? completed >= num
            ? "done"
            : midwayReviewed
              ? "waiting"
              : "upcoming"
          : "upcoming",
      hint:
        num <= half
          ? "No extra milestones after midway on this order."
          : completed >= num
            ? `All ${num} milestones marked complete.`
            : midwayReviewed
              ? `Waiting for freelancer (${completed}/${num} milestones).`
              : "Unlocks after midway review.",
    },
    step("releaseCompletion", "Completion payment", gates.releaseCompletion),
    step("submitFinalReview", "Final review (client)", gates.submitFinalReview),
  ];
}

/**
 * @param {{ done?: boolean; enabled?: boolean; labelDone?: string; labelReady?: string; labelBlocked?: string } | undefined} gate
 * @param {string} [fallbackReady]
 */
export function formatGateHint(gate, fallbackReady = "") {
  if (!gate) return fallbackReady;
  if (gate.done && gate.labelDone) return gate.labelDone;
  if (gate.enabled && gate.labelReady) return gate.labelReady;
  if (!gate.enabled && gate.labelBlocked) return gate.labelBlocked;
  return fallbackReady;
}
