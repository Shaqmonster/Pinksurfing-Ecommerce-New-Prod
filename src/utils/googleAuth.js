import axios from "axios";
import { ensureSession, persistAuthSession } from "./authSession";

export const AUTH_BASE_URL = "https://auth.pinksurfing.com";
const AUTH_REFRESH_URL = `${AUTH_BASE_URL}/api/token/refresh/`;

export function getGoogleSignInUrl(nextUrl) {
  const next =
    nextUrl || `${window.location.origin}/auth/google/complete`;
  return `${AUTH_BASE_URL}/api/auth/google/?next=${encodeURIComponent(next)}`;
}

export function startGoogleSignIn(nextUrl) {
  window.location.href = getGoogleSignInUrl(nextUrl);
}

export async function refreshSessionFromSsoCookies() {
  const response = await axios.post(
    AUTH_REFRESH_URL,
    {},
    { withCredentials: true }
  );
  const access = response.data?.access;
  const refresh = response.data?.refresh;
  if (!access) {
    throw new Error("Missing access token from SSO refresh");
  }
  persistAuthSession(access, refresh);
  return { access, refresh };
}

export async function completeGoogleSignIn() {
  const params = new URLSearchParams(window.location.search);
  const errorCode = params.get("sso_error");
  if (errorCode) {
    throw new Error(errorCode);
  }

  try {
    return await refreshSessionFromSsoCookies();
  } catch {
    const session = await ensureSession();
    if (session?.access) return session;
    throw new Error("google_auth_failed");
  }
}

export function getGoogleSignInErrorMessage(code) {
  const messages = {
    google_denied: "Google sign-in was cancelled.",
    invalid_state: "Sign-in session expired. Please try again.",
    missing_code: "Google sign-in did not complete. Please try again.",
    email_unverified: "Your Google email is not verified.",
    email_mismatch: "Google email does not match your account.",
    already_linked: "This Google account is linked to another user.",
    google_auth_failed: "Google sign-in failed. Please try again.",
    invalid_id_token: "Google sign-in failed. Please try again.",
  };
  return messages[code] || "Google sign-in failed. Please try again.";
}
