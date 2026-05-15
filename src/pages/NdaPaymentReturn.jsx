import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";

const SERVER = import.meta.env.VITE_SERVER_URL || "";

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 24; // ~60 seconds total

const NdaPaymentReturn = () => {
  const [params] = useSearchParams();
  const ndaId = params.get("nda_id");
  const slug = params.get("slug");

  const [phase, setPhase] = useState("verifying"); // verifying | pending_vendor | failed | not_found
  const pollCount = useRef(0);
  const timer = useRef(null);

  const productLink = slug
    ? `/product/productDetail/${encodeURIComponent(slug)}?nda_unlocked=1`
    : "/";

  useEffect(() => {
    if (!ndaId) {
      setPhase("not_found");
      return;
    }

    const poll = async () => {
      pollCount.current += 1;
      try {
        const res = await axios.get(`${SERVER}/api/nda/status/${ndaId}/`);
        const { status } = res.data;
        // Payment confirmed once we move past pending_payment
        if (status && status !== "pending_payment") {
          clearInterval(timer.current);
          setPhase("pending_vendor");
          return;
        }
      } catch {
        // ignore transient errors — keep polling
      }

      if (pollCount.current >= MAX_POLLS) {
        clearInterval(timer.current);
        setPhase("failed");
      }
    };

    // Run immediately then repeat
    poll();
    timer.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer.current);
  }, [ndaId]);

  return (
    <>
      <Header />
      <div className="min-h-[70vh] flex items-center justify-center px-4" style={{ background: "#0d0d10" }}>
        <div
          style={{
            background: "#141418",
            border: "1px solid #2a2a33",
            borderRadius: 16,
            maxWidth: 460,
            width: "100%",
            padding: "40px 36px",
            textAlign: "center",
            boxShadow: "0 24px 80px rgba(0,0,0,.7)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              margin: "0 auto 20px",
              background:
                phase === "pending_vendor"
                  ? "rgba(52,211,153,.15)"
                  : phase === "failed" || phase === "not_found"
                  ? "rgba(248,113,113,.15)"
                  : "rgba(240,49,138,.12)",
              border: `1px solid ${
                phase === "pending_vendor"
                  ? "rgba(52,211,153,.3)"
                  : phase === "failed" || phase === "not_found"
                  ? "rgba(248,113,113,.3)"
                  : "rgba(240,49,138,.25)"
              }`,
            }}
          >
            {phase === "pending_vendor" ? "✅" : phase === "verifying" ? "⏳" : "❌"}
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#f0f0f4",
              marginBottom: 10,
              letterSpacing: "-0.02em",
            }}
          >
            {phase === "pending_vendor" && "Payment Confirmed — Awaiting Seller"}
            {phase === "verifying" && "Verifying Payment…"}
            {phase === "failed" && "Payment Not Yet Confirmed"}
            {phase === "not_found" && "NDA Not Found"}
          </h1>

          {/* Body */}
          <p style={{ fontSize: 13, color: "#b0b0c0", lineHeight: 1.65, marginBottom: 28 }}>
            {phase === "pending_vendor" &&
              "Your $1 NDA fee has been received and your signature is on record. The seller has been notified and will review your request. Once accepted, the financial documents will be available in your NDA dashboard."}
            {phase === "verifying" &&
              "We're confirming your payment with Square. This usually takes a few seconds. Please don't close this page."}
            {phase === "failed" &&
              "We couldn't confirm your payment yet. It may take a moment to process. You can return to the listing and try again, or contact support if the issue persists."}
            {phase === "not_found" && "We couldn't find the NDA record. Please return to the listing and try again."}
          </p>

          {/* Spinner for verifying */}
          {phase === "verifying" && (
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid #2a2a33",
                borderTop: "3px solid #f0318a",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 28px",
              }}
            />
          )}

          {/* CTAs */}
          {phase === "pending_vendor" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                to="/my-ndas"
                style={{
                  display: "block",
                  background: "#34d399",
                  color: "#fff",
                  padding: "13px 24px",
                  borderRadius: 9,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Track NDA Status →
              </Link>
              <Link
                to={productLink}
                style={{
                  display: "block",
                  border: "1px solid #2a2a33",
                  color: "#aaa",
                  padding: "11px 24px",
                  borderRadius: 9,
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Back to Listing
              </Link>
            </div>
          )}
          {(phase === "failed" || phase === "not_found") && (
            <Link
              to={productLink}
              style={{
                display: "block",
                background: "#f0318a",
                color: "#fff",
                padding: "13px 24px",
                borderRadius: 9,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Back to Listing
            </Link>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
};

export default NdaPaymentReturn;
