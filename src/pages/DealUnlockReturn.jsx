import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchUnlockStatus } from "../api/offMarketDeals";

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 24;

export default function DealUnlockReturn() {
  const [params] = useSearchParams();
  const unlockId = params.get("unlock_id");
  const slug = params.get("slug");
  const productId = params.get("product_id");

  const [phase, setPhase] = useState("verifying");
  const pollCount = useRef(0);
  const timer = useRef(null);

  const dealLink = slug
    ? `/deals/${slug}?deal_unlocked=1`
    : productId
      ? `/deals/${productId}?deal_unlocked=1`
      : "/deals";

  useEffect(() => {
    if (!unlockId) {
      setPhase("not_found");
      return;
    }

    const poll = async () => {
      pollCount.current += 1;
      try {
        const res = await fetchUnlockStatus(unlockId);
        if (res.status === "unlocked" || res.status === "in_deal_room" || res.status === "closed") {
          clearInterval(timer.current);
          setPhase("accepted");
          return;
        }
      } catch {
        /* keep polling */
      }
      if (pollCount.current >= MAX_POLLS) {
        clearInterval(timer.current);
        setPhase("failed");
      }
    };

    poll();
    timer.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer.current);
  }, [unlockId]);

  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-4"
      style={{ background: "var(--ps-color-bg)", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div
        style={{
          background: "var(--ps-color-surface)",
          border: "1px solid var(--ps-color-border)",
          borderRadius: 16,
          maxWidth: 460,
          width: "100%",
          padding: "40px 36px",
          textAlign: "center",
        }}
      >
        {phase === "verifying" && (
          <>
            <h2 style={{ color: "var(--ps-color-text)", marginBottom: 12 }}>Confirming unlock…</h2>
            <p style={{ color: "var(--ps-color-text-meta)" }}>Please wait while we verify your payment.</p>
          </>
        )}
        {phase === "accepted" && (
          <>
            <h2 style={{ color: "var(--ps-color-success)", marginBottom: 12 }}>Deal unlocked</h2>
            <p style={{ color: "var(--ps-color-text-secondary)", marginBottom: 24 }}>
              You now have full access to this off-market deal.
            </p>
            <Link
              to={dealLink}
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "var(--ps-primary)",
                color: "#fff",
                borderRadius: 8,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              View full details
            </Link>
          </>
        )}
        {phase === "failed" && (
          <>
            <h2 style={{ color: "var(--ps-color-danger)", marginBottom: 12 }}>Still processing</h2>
            <p style={{ color: "var(--ps-color-text-secondary)", marginBottom: 24 }}>
              Payment may still be processing. Check back in a few minutes or contact support.
            </p>
            <Link to="/deals" style={{ color: "var(--ps-color-action-text)" }}>
              Back to Deals Home
            </Link>
          </>
        )}
        {phase === "not_found" && (
          <>
            <h2 style={{ color: "var(--ps-color-danger)" }}>Invalid return link</h2>
            <Link to="/deals" style={{ color: "var(--ps-color-action-text)" }}>
              Back to Deals Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
