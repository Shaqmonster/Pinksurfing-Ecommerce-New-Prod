/** Shared chat UI helpers */

import { resolveAccessToken } from "./authSession";

export const CHAT_FILE_ACCEPT =
  ".pdf,.csv,.xlsx,.xls,.doc,.docx,.zip,.rar,.7z,.txt,.md,.json,.js,.ts,.jsx,.tsx,.py,.java,.html,.css,.xml,.mp4,.mov,.webm,.mp3,.wav,.jpg,.jpeg,.png,.gif,.webp,.svg,.psd,.ai";

export const getWsBaseUrl = () => {
  const url = (import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");
  if (!url) return "";
  return url.startsWith("https://")
    ? url.replace("https://", "wss://")
    : url.replace("http://", "ws://");
};

/** Match REST auth: react-cookie, auth context, or localStorage SSO session. */
export function resolveChatAccessToken(authToken, cookieToken) {
  return resolveAccessToken(authToken, cookieToken);
}

/** WebSocket handshake must include JWT (cookies are not sent cross-origin). */
export function buildChatWebSocketUrl(conversationId, accessToken) {
  const wsBase = getWsBaseUrl();
  if (!wsBase || !conversationId || !accessToken) return "";
  const url = new URL(`${wsBase}/ws/chat/${conversationId}/`);
  url.searchParams.set("access_token", accessToken);
  return url.toString();
}

export const getEmailFromToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1])).email || null;
  } catch {
    return null;
  }
};

export const timeAgo = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffD > 6) return d.toLocaleDateString([], { month: "short", day: "numeric" });
  if (diffD > 1) return `${diffD}d ago`;
  if (diffD === 1) return "Yesterday";
  if (diffH >= 1) return `${diffH}h ago`;
  if (diffMin >= 1) return `${diffMin}m ago`;
  return "Now";
};

export function fileNameFromUrl(url) {
  if (!url) return "Download";
  try {
    const path = new URL(url, window.location.origin).pathname;
    const name = path.split("/").pop();
    return decodeURIComponent(name || "Download");
  } catch {
    return url.split("/").pop() || "Download";
  }
}

export function attachmentIcon(name) {
  const ext = (name || "").split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  if (["zip", "rar", "7z"].includes(ext)) return "archive";
  if (["pdf"].includes(ext)) return "pdf";
  if (["js", "ts", "jsx", "tsx", "py", "java", "html", "css", "json"].includes(ext)) return "code";
  return "file";
}

export function sumUnreadCount(conversations) {
  return (conversations || []).reduce((n, c) => n + (c.unread_count || 0), 0);
}

/** Human-readable presence for chat header */
export function formatLastSeen(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "Last seen just now";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Last seen just now";
  if (diffMin < 60) return `Last seen ${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Last seen ${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Last seen yesterday";
  if (diffD < 7) return `Last seen ${diffD}d ago`;
  return `Last seen ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export function presenceLabel({ isOnline, lastSeen } = {}) {
  if (isOnline) return { text: "Online", online: true };
  const seen = formatLastSeen(lastSeen);
  if (seen) return { text: seen, online: false };
  return { text: "Offline", online: false };
}
