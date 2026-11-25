import { toast } from "react-toastify";

/**
 * One calm feedback voice for the storefront.
 * - success/info are announced politely; only errors interrupt (role="alert").
 * - Server text is shown only when it reads like a sentence for a person —
 *   never status codes, stack traces, JSON or function names.
 */

const NETWORK = "We couldn’t reach PinkSurfing. Check your connection and try again.";
const TECHNICAL = /(status code|exception|traceback|error:|undefined|null|object object|\{|\}|<html|stack|sql|keyerror|valueerror|typeerror)/i;

function humanText(value) {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t || t.length > 180 || TECHNICAL.test(t)) return null;
  return t;
}

/** Best message for an API error: a readable server explanation, else the given fallback. */
export function apiErrorMessage(error, fallback = "That didn’t work. Please try again.") {
  if (typeof error === "string") return humanText(error) || fallback;
  if (error && !error.response && (error.request || error.code === "ERR_NETWORK")) return NETWORK;
  const d = error?.response?.data;
  const fromServer =
    humanText(d?.error) || humanText(d?.detail) || humanText(d?.message) || humanText(d?.Status) || humanText(d);
  if (error?.response?.status >= 500) return fallback;
  return fromServer || fallback;
}

export const notify = {
  success(message, opts) {
    return toast.success(message, { role: "status", ...opts });
  },
  info(message, opts) {
    return toast.info(message, { role: "status", ...opts });
  },
  error(message, opts) {
    return toast.error(message, { role: "alert", autoClose: 6000, ...opts });
  },
  /** Show an API failure with a fallback written for the action that failed. */
  apiError(error, fallback, opts) {
    return toast.error(apiErrorMessage(error, fallback), { role: "alert", autoClose: 6000, ...opts });
  },
};

/** Container defaults: calm placement, no progress bar, polite by default. */
export const TOAST_CONTAINER_PROPS = {
  position: "top-center",
  autoClose: 4000,
  hideProgressBar: true,
  newestOnTop: true,
  closeOnClick: true,
  pauseOnHover: true,
  pauseOnFocusLoss: true,
  limit: 3,
  role: "status",
};
