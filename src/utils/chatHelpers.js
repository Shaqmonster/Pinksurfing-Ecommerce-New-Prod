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

export function normalizeChatEmail(email) {
  return (email || "").trim().toLowerCase();
}

/** Normalize API / WebSocket payloads so sender.email is always present. */
export function normalizeSavedMessage(saved, fallbackEmail = "") {
  if (!saved) return null;
  const sender =
    saved.sender && typeof saved.sender === "object" ? { ...saved.sender } : {};
  const email =
    sender.email ||
    saved.sender_email ||
    (typeof saved.sender === "string" ? saved.sender : "") ||
    fallbackEmail;
  return {
    ...saved,
    sender: {
      ...sender,
      email: email || fallbackEmail,
      username: sender.username || saved.sender_username || "",
    },
  };
}

const CHAT_MSG_CACHE_KEY = "ps_chat_messages_cache";

export function readPersistedChatMessages(convId) {
  if (typeof window === "undefined" || !convId) return [];
  try {
    const raw = sessionStorage.getItem(CHAT_MSG_CACHE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return Array.isArray(map[String(convId)]) ? map[String(convId)] : [];
  } catch {
    return [];
  }
}

export function persistChatMessages(convId, messages) {
  if (typeof window === "undefined" || !convId) return;
  try {
    const raw = sessionStorage.getItem(CHAT_MSG_CACHE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[String(convId)] = messages;
    sessionStorage.setItem(CHAT_MSG_CACHE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Ensure the inbox preview message is present when opening a thread. */
export function seedMessagesFromConversation(conv, cached = [], fallbackEmail = "") {
  const base = Array.isArray(cached) ? [...cached] : [];
  const last = conv?.last_message;
  if (!last?.id) return base;
  if (base.some((m) => m.id === last.id)) return base;
  const normalized = normalizeSavedMessage(last, fallbackEmail);
  return normalized
    ? [...base, normalized].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : base;
}

export function mergeChatMessages(previous, serverMessages, fallbackEmail = "") {
  const server = Array.isArray(serverMessages) ? serverMessages : [];
  const prev = Array.isArray(previous) ? previous : [];
  if (!server.length) return prev;

  const byId = new Map();
  for (const m of server) {
    const normalized = normalizeSavedMessage(m, fallbackEmail);
    if (normalized?.id != null) byId.set(normalized.id, normalized);
  }

  for (const m of prev) {
    const id = m?.id;
    if (id == null || String(id).startsWith("local-")) continue;
    if (!byId.has(id)) byId.set(id, m);
  }

  for (const m of prev) {
    const id = String(m?.id || "");
    if (!id.startsWith("local-")) continue;
    const duplicated = [...byId.values()].some(
      (s) =>
        s.content === m.content &&
        normalizeChatEmail(s.sender?.email) === normalizeChatEmail(m.sender?.email)
    );
    if (!duplicated) byId.set(m.id, m);
  }

  return [...byId.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

/** Replace matching optimistic row with the saved API message. */
export function appendServerChatMessage(previous, saved, fallbackEmail = "") {
  const normalized = normalizeSavedMessage(saved, fallbackEmail);
  if (!normalized?.id) return previous || [];
  const prev = Array.isArray(previous) ? previous : [];
  const withoutLocal = prev.filter(
    (m) =>
      !String(m.id).startsWith("local-") ||
      m.content !== normalized.content ||
      normalizeChatEmail(m.sender?.email) !== normalizeChatEmail(normalized.sender?.email)
  );
  if (withoutLocal.some((m) => m.id === normalized.id)) return withoutLocal;
  return [...withoutLocal, normalized].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
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
