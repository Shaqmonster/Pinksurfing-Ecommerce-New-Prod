import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { DiditSdk } from "@didit-protocol/sdk-web";
import { createIdentitySession, getIdentityStatus } from "../api/identity";

const POLL_MS = 4000;

/**
 * Blocks children until Didit KYC is approved for the logged-in user (email-scoped).
 */
const DiditVerificationGate = ({
  context = "vendor",
  callbackPath = "/identity/verify",
  onVerified,
  children,
  title = "Verify your identity",
  description = "Complete a quick identity check to continue. You only need to do this once for selling on PinkSurfing.",
}) => {
  const [cookies] = useCookies(["access_token"]);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState("not_started");
  const [starting, setStarting] = useState(false);
  const pollRef = useRef(null);

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${callbackPath}?returnUrl=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      : callbackPath;

  const checkStatus = useCallback(async () => {
    if (!cookies.access_token) {
      setLoading(false);
      return false;
    }
    try {
      const res = await getIdentityStatus(cookies.access_token, context);
      const data = res.data || {};
      setStatus(data.status || "not_started");
      if (data.verified) {
        setVerified(true);
        onVerified?.();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Identity status check failed", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cookies.access_token, context, onVerified]);

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

  const startVerification = async () => {
    if (!cookies.access_token) {
      toast.info("Please sign in first.");
      return;
    }
    setStarting(true);
    try {
      const res = await createIdentitySession(cookies.access_token, {
        context,
        callbackUrl,
      });
      const data = res.data || {};
      if (data.verified) {
        setVerified(true);
        onVerified?.();
        return;
      }
      const url = data.verification_url;
      if (!url) {
        toast.error("Could not start verification. Please try again.");
        return;
      }
      startPolling();
      DiditSdk.shared.startVerification({ url });
    } catch (err) {
      console.error("Failed to create identity session", err);
      toast.error(
        err.response?.data?.detail || "Could not start identity verification."
      );
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Checking verification status…</p>
      </div>
    );
  }

  if (verified) {
    return typeof children === "function" ? children() : children;
  }

  return (
    <div className="max-w-lg mx-auto text-center px-6 py-12">
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-gray-400 mb-6">{description}</p>
      <p className="text-xs text-gray-500 mb-6 capitalize">
        Status: {String(status).replace(/_/g, " ")}
      </p>
      <button
        type="button"
        onClick={startVerification}
        disabled={starting}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-colors"
      >
        {starting ? "Starting…" : "Start identity verification"}
      </button>
      <button
        type="button"
        onClick={checkStatus}
        className="block mx-auto mt-4 text-sm text-purple-400 hover:text-purple-300"
      >
        I already completed verification — refresh
      </button>
    </div>
  );
};

export default DiditVerificationGate;
