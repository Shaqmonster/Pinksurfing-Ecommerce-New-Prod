import React, { useCallback, useEffect, useRef, useState } from "react";
import { getKycStatus, launchKyc } from "../api/kyc";
import { useAccessToken } from "../hooks/useAccessToken";

import { notify } from "../lib/notify";
const POLL_MS = 4000;

/** Plain words for each verification status. */
const STATUS_COPY = {
  not_started: null,
  pending: { title: "Verification in progress", body: "Finish the steps in the verification window. This page updates on its own." },
  in_progress: { title: "Verification in progress", body: "Finish the steps in the verification window. This page updates on its own." },
  in_review: { title: "Under review", body: "Your details are being checked. This usually takes a few minutes." },
  review: { title: "Under review", body: "Your details are being checked. This usually takes a few minutes." },
  declined: { title: "Not approved", body: "We couldn’t verify your identity from that attempt. You can try again with a clear photo of a valid ID, or contact support." },
  rejected: { title: "Not approved", body: "We couldn’t verify your identity from that attempt. You can try again with a clear photo of a valid ID, or contact support." },
  expired: { title: "Session expired", body: "The verification session timed out before it finished. Start a new one when you’re ready." },
  abandoned: { title: "Not finished", body: "The last verification wasn’t completed. Start again when you’re ready — it takes about two minutes." },
};

/**
 * Blocks children until SSO Didit KYC is approved for the logged-in user.
 * Verification runs on auth.pinksurfing.com — this gate only checks status and redirects.
 */
const DiditVerificationGate = ({
  onVerified,
  children,
  title = "Verify your identity",
  description = "To keep buyers and sellers safe, we check your ID once before you sell. It takes about two minutes with your phone or webcam, and your documents go to our verification partner, Didit.",
}) => {
  const accessToken = useAccessToken();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState("not_started");
  const [starting, setStarting] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [recheckNote, setRecheckNote] = useState("");
  const pollRef = useRef(null);
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  const checkStatus = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return false;
    }
    try {
      const res = await getKycStatus(accessToken);
      setCheckFailed(false);
      const data = res.data || {};
      setStatus(data.kyc_status || data.status || "not_started");
      if (data.kyc_verified || data.verified) {
        setVerified(true);
        onVerifiedRef.current?.();
        return true;
      }
      return false;
    } catch (err) {
      console.error("KYC status check failed", err);
      setCheckFailed(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const ok = await checkStatus();
      if (ok) stopPolling();
    }, POLL_MS);
  }, [checkStatus]);

  useEffect(() => {
    checkStatus();
    return () => stopPolling();
  }, [checkStatus]);

  // After SSO redirect back to /identity/verify, keep polling until approved.
  useEffect(() => {
    if (!accessToken || verified || loading) return;
    if (status === "not_started") return;
    startPolling();
    return () => stopPolling();
  }, [accessToken, verified, loading, status, startPolling]);

  const startVerification = async () => {
    if (!accessToken) {
      notify.info("Please sign in first.");
      return;
    }
    setStarting(true);
    try {
      const isVerifyPage = window.location.pathname.includes("/identity/verify");
      const returnUrl = isVerifyPage
        ? window.location.href.split("#")[0]
        : `${window.location.origin}/identity/verify?returnUrl=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`;

      const { data } = await launchKyc(accessToken, returnUrl);

      if (data?.kyc_verified || data?.verified) {
        setVerified(true);
        onVerifiedRef.current?.();
        return;
      }

      const kycUrl = data?.kyc_url;
      if (!kycUrl) {
        notify.apiError({ response: { data } }, "We couldn’t start verification. Please try again in a moment.");
        return;
      }

      window.location.href = kycUrl;
    } catch (err) {
      console.error("Failed to launch KYC", err);
      notify.apiError(err, "We couldn’t start verification. Please try again in a moment.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-2 border-ps-border border-t-[var(--ps-primary)] rounded-full motion-safe:animate-spin" aria-hidden />
        <p className="text-sm text-ps-meta" role="status">Checking your verification…</p>
      </div>
    );
  }

  if (verified) {
    return typeof children === "function" ? children() : children;
  }

  const recheck = async () => {
    setRechecking(true);
    setRecheckNote("");
    const ok = await checkStatus();
    setRechecking(false);
    if (!ok) {
      setRecheckNote("Not confirmed yet. If you just finished, give it a minute — this page keeps checking on its own.");
    }
  };

  const statusCopy = STATUS_COPY[String(status).toLowerCase()];
  const canStart = !statusCopy || ["declined", "rejected", "expired", "abandoned"].includes(String(status).toLowerCase());

  return (
    <div className="max-w-lg mx-auto text-center px-6 py-12">
      <h2 className="text-xl font-semibold tracking-tight text-ink mb-2">{statusCopy?.title || title}</h2>
      <p className="text-sm leading-relaxed text-ps-fg2 mb-6" aria-live="polite">
        {statusCopy?.body || description}
      </p>
      {checkFailed && (
        <p role="alert" className="mb-5 rounded-lg bg-ps-sunken px-3 py-2 text-sm text-ps-fg2">
          We couldn’t check your verification just now. Your progress isn’t lost — try again in a moment.
        </p>
      )}
      {canStart && (
        <button
          type="button"
          onClick={startVerification}
          disabled={starting}
          className="min-h-[48px] px-6 rounded-xl bg-ps-action text-white font-semibold disabled:opacity-60"
        >
          {starting ? "Opening verification…" : statusCopy ? "Start a new verification" : "Verify my identity"}
        </button>
      )}
      <button
        type="button"
        onClick={recheck}
        disabled={rechecking}
        className="block mx-auto mt-4 min-h-[44px] text-sm text-ps-action-text hover:underline disabled:opacity-60"
      >
        {rechecking ? "Checking…" : "I’ve finished — check again"}
      </button>
      {recheckNote && (
        <p className="mt-2 text-sm text-ps-meta" role="status">
          {recheckNote}
        </p>
      )}
    </div>
  );
};

export default DiditVerificationGate;
