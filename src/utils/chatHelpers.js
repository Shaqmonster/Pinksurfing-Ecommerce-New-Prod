/** Shared chat UI helpers */

export const CHAT_FILE_ACCEPT =
  ".pdf,.csv,.xlsx,.xls,.doc,.docx,.zip,.rar,.7z,.txt,.md,.json,.js,.ts,.jsx,.tsx,.py,.java,.html,.css,.xml,.mp4,.mov,.webm,.mp3,.wav,.jpg,.jpeg,.png,.gif,.webp,.svg,.psd,.ai";

export const getWsBaseUrl = () => {
  const url = (import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");
  if (!url) return "";
  return url.startsWith("https://")
    ? url.replace("https://", "wss://")
    : url.replace("http://", "ws://");
};

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
