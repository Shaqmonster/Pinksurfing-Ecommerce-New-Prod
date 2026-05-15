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
  const half = Math.floor(num / 2);

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
      labelBlocked = "Waiting for buyer kickoff payment release first.";
    } else if (!basicOrderReady) {
      labelBlocked = i === 0 ? "Freelancer marks milestones in order." : `Complete milestone ${i} first.`;
    } else if (!midwayReady) {
      labelBlocked = "Waiting for buyer midway review before phase-2 milestones.";
    }

    milestoneGates[`completeMilestone${i}`] = {
      done: completed >= ord,
      enabled,
      labelDone: `Milestone ${ord} already marked.`,
      labelBlocked,
    };
  }

  return {
    releaseDeposit: {
      done: depositReleased,
      enabled: !depositReleased,
      labelDone: "Deposit already released.",
    },
    ...milestoneGates,
    submitMidwayReview: {
      done: midwayReviewed,
      enabled: !midwayReviewed && completed >= half && num > 0,
      labelDone: "Midway review already submitted.",
      labelBlocked: `Waiting for freelancer to complete at least ${half} milestone(s).`,
    },
    releaseCompletion: {
      done: completionReleased,
      enabled: !completionReleased && halfwayReleased && completed >= num && num > 0,
      labelDone: "Completion payment already released.",
      labelBlocked: "Need midway payment and all milestones marked.",
    },
    submitFinalReview: {
      done: finalReviewed,
      enabled: !finalReviewed && completionReleased,
      labelDone: "Final review already submitted.",
      labelBlocked: "Release completion payment first.",
    },
    openDispute: {
      enabled: finalReviewed && !disputed && !satisfactionReleased,
      labelDone: disputed ? "Dispute already opened." : "Not on low-rating path.",
      labelBlocked: "After unhappy final review only.",
    },
    cancelExpiredEscrow: {
      enabled: !satisfactionReleased,
      labelDone: satisfactionReleased ? "Job already finalized." : "",
      labelBlocked: "Use after deadline + grace.",
    },
  };
}

