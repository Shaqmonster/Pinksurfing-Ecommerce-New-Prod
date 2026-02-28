import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import {
  getConversations,
  getConversationMessages,
  sendMessage,
} from "../../api/gigs";
import {
  IoSendSharp,
  IoAttachOutline,
  IoSearchOutline,
  IoChatbubbleOutline,
  IoChevronBackOutline,
  IoChevronDown,
  IoCheckmarkDoneSharp,
  IoCheckmarkSharp,
  IoCloseOutline,
  IoHappyOutline,
  IoImageOutline,
} from "react-icons/io5";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

/* ─── Helpers ─────────────────────────────────────────────────── */

/** WS URL from REST URL:  http→ws  https→wss */
const getWsBaseUrl = () => {
  const url = BASE_URL.replace(/\/$/, "");
  return url.startsWith("https://")
    ? url.replace("https://", "wss://")
    : url.replace("http://", "ws://");
};

/** Pull email from SSO JWT (the only stable identity we have). */
const getEmailFromToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1])).email || null;
  } catch {
    return null;
  }
};

/** Readable relative timestamp. */
const timeAgo = (iso) => {
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
  return "Just now";
};

/** Format a date header like WhatsApp ("Today", "Yesterday", "Feb 14, 2026"). */
const dateBanner = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

/** Check if two ISO timestamps are on different calendar days. */
const isDifferentDay = (a, b) => {
  if (!a || !b) return true;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getDate() !== db.getDate() ||
    da.getMonth() !== db.getMonth() ||
    da.getFullYear() !== db.getFullYear()
  );
};

/** Linkify URLs inside message text. */
const MessageContent = ({ content }) => {
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRe);
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((p, i) =>
        urlRe.test(p) ? (
          <a
            key={i}
            href={p}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 underline hover:text-blue-200 break-all"
          >
            {p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  );
};

/* ─── Conversation Sidebar Item ───────────────────────────────── */

const ConversationItem = ({ conv, isActive, myEmail, onClick }) => {
  const other = conv.participants?.find((p) => p.email !== myEmail);
  const last = conv.last_message;
  const unread = false; // TODO: track unread count on backend

  return (
    <button
      onClick={onClick}
      className={`w-full text-left group transition-all duration-150 ${
        isActive
          ? "bg-purple-600/15"
          : "hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-[50px] h-[50px] rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg uppercase">
            {other?.username?.[0] || "?"}
          </div>
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#111118]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 border-b border-white/[0.04] pb-3 group-last:border-b-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className={`text-[15px] truncate ${unread ? "text-white font-semibold" : "text-white/90 font-medium"}`}>
              {other?.username || "Unknown"}
            </p>
            <span className={`text-[11px] flex-shrink-0 ml-2 ${unread ? "text-purple-400 font-medium" : "text-white/30"}`}>
              {last ? timeAgo(last.created_at) : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Double-check for own last message */}
            {last?.sender?.email === myEmail && (
              <IoCheckmarkDoneSharp className="text-purple-400 text-sm flex-shrink-0" />
            )}
            <p className={`text-[13px] truncate ${unread ? "text-white/70 font-medium" : "text-white/35"}`}>
              {last?.content || "No messages yet"}
            </p>
          </div>
        </div>

        {/* Unread badge placeholder */}
        {unread && (
          <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">1</span>
          </div>
        )}
      </div>
    </button>
  );
};

/* ─── Main Page Component ─────────────────────────────────────── */

const GigMessages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  // Current user email from JWT (the SSO token has email, NOT user_id)
  const myEmail =
    user?.email || getEmailFromToken(cookies.access_token) || "";

  /* ── state ── */
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  /* ── init ── */
  useEffect(() => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    fetchConversations();
  }, [cookies.access_token]);

  // Open conversation from URL param (?conversation=123)
  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId && conversations.length > 0) {
      const found = conversations.find((c) => String(c.id) === convId);
      if (found) selectConversation(found);
    }
  }, [searchParams, conversations]);

  /* ── conversations ── */
  const fetchConversations = async () => {
    setLoadingConvs(true);
    try {
      const res = await getConversations(cookies.access_token);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setConversations(data);
    } catch {
      toast.error("Failed to load conversations.");
    } finally {
      setLoadingConvs(false);
    }
  };

  /* ── messages ── */
  const fetchMessages = useCallback(
    async (convId) => {
      setLoadingMsgs(true);
      try {
        const res = await getConversationMessages(cookies.access_token, convId);
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setMessages(data);
      } catch {
        toast.error("Failed to load messages.");
      } finally {
        setLoadingMsgs(false);
      }
    },
    [cookies.access_token]
  );

  const selectConversation = (conv) => {
    setActiveConv(conv);
    setMessages([]);
    setShowMobileList(false);
    fetchMessages(conv.id);
    connectWs(conv.id);
  };

  /* ── WebSocket ── */
  const connectWs = useCallback(
    (convId) => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      clearTimeout(reconnectRef.current);

      const ws = new WebSocket(`${getWsBaseUrl()}/ws/chat/${convId}/`);
      ws.onopen = () => console.log("[Chat] WS connected", convId);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const newMsg = {
            id: data.message_id || `ws-${Date.now()}`,
            content: data.message,
            sender: {
              id: data.sender_id,
              username: data.sender_username || "",
              email: data.sender_email || "",
            },
            created_at: data.created_at || new Date().toISOString(),
            is_read: false,
            attachments: [],
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Update sidebar last message
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? { ...c, last_message: newMsg, updated_at: newMsg.created_at }
                : c
            )
          );
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        reconnectRef.current = setTimeout(() => {
          if (wsRef.current === ws) connectWs(convId);
        }, 3000);
      };
      ws.onerror = () => ws.close();
      wsRef.current = ws;
    },
    [myEmail]
  );

  useEffect(() => {
    return () => {
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  /* ── auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // "Scroll to bottom" FAB
  const handleScroll = () => {
    const el = messageContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ── send ── */
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!activeConv) return;
    if (!messageInput.trim() && attachments.length === 0) return;

    const text = messageInput.trim();
    setSending(true);

    try {
      if (attachments.length > 0) {
        // Attachments MUST go through REST
        await sendMessage(cookies.access_token, activeConv.id, text, attachments);
        setAttachments([]);
        fetchMessages(activeConv.id);
      } else if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Fast path — WebSocket (consumer persists to DB)
        wsRef.current.send(
          JSON.stringify({ message: text, sender_email: myEmail })
        );
      } else {
        // REST fallback
        await sendMessage(cookies.access_token, activeConv.id, text);
        fetchMessages(activeConv.id);
      }
      setMessageInput("");
      fetchConversations(); // refresh sidebar
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = "";
  };

  const removeAttachment = (idx) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  /* ── derived ── */
  const filteredConvs = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const other = conv.participants?.find((p) => p.email !== myEmail);
    return other?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const otherUser = activeConv?.participants?.find(
    (p) => p.email !== myEmail
  );

  const isMe = (msg) => msg.sender?.email === myEmail;

  /* ════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════ */
  return (
    <div
      className="bg-[#0b0b12] flex flex-col"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* Decorative gradient strip on top */}
      <div className="h-[120px] bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600 absolute top-16 left-0 right-0 z-0" />

      <div className="relative z-10 flex flex-1 overflow-hidden max-w-[1400px] w-full mx-auto mt-4 mb-4 rounded-xl shadow-2xl shadow-black/50 border border-white/[0.06]">
        {/* ════════════ SIDEBAR ════════════ */}
        <div
          className={`${
            showMobileList ? "flex" : "hidden"
          } md:flex flex-col w-full md:w-[340px] lg:w-[380px] bg-[#111118] border-r border-white/[0.06] flex-shrink-0`}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-white font-bold text-xl tracking-tight">Chats</h1>
              <span className="text-white/25 text-xs font-medium">
                {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or start new chat"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a24] rounded-lg text-white placeholder-white/25 text-sm outline-none focus:bg-[#1e1e2a] transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="px-4 space-y-1 mt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-3">
                    <div className="w-[50px] h-[50px] rounded-full bg-white/[0.04] animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-white/[0.04] rounded animate-pulse w-2/3" />
                      <div className="h-3 bg-white/[0.04] rounded animate-pulse w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-8">
                <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                  <IoChatbubbleOutline className="text-4xl text-white/10" />
                </div>
                <p className="text-white/35 text-sm text-center">No conversations yet</p>
                <p className="text-white/20 text-xs text-center mt-1.5">
                  Visit a gig page and click "Message Seller" to start chatting
                </p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeConv?.id === conv.id}
                  myEmail={myEmail}
                  onClick={() => selectConversation(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* ════════════ CHAT AREA ════════════ */}
        <div
          className={`${
            showMobileList ? "hidden" : "flex"
          } md:flex flex-col flex-1 bg-[#0d0d14] overflow-hidden relative`}
        >
          {!activeConv ? (
            /* ── Empty state ── */
            <div className="flex-1 flex items-center justify-center flex-col gap-5 bg-[#0d0d14]">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-500/10 flex items-center justify-center">
                  <IoChatbubbleOutline className="text-5xl text-purple-400/60" />
                </div>
                <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-ping" style={{ animationDuration: "3s" }} />
              </div>
              <div className="text-center">
                <p className="text-white/70 text-lg font-medium mb-1">PinkSurfing Messages</p>
                <p className="text-white/30 text-sm max-w-xs">
                  Send and receive messages. Your conversations stay private and secure.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Chat header ── */}
              <div className="flex items-center gap-3 px-5 py-3 bg-[#13131a] border-b border-white/[0.06] flex-shrink-0">
                <button
                  onClick={() => {
                    setShowMobileList(true);
                    setActiveConv(null);
                    if (wsRef.current) {
                      wsRef.current.close();
                      wsRef.current = null;
                    }
                  }}
                  className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-white/60 mr-1"
                >
                  <IoChevronBackOutline className="text-lg" />
                </button>

                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm uppercase">
                    {otherUser?.username?.[0] || "?"}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#13131a]" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-[15px] truncate">
                    {otherUser?.username || "Unknown"}
                  </p>
                  <p className="text-green-400/70 text-xs">online</p>
                </div>
              </div>

              {/* ── Chat wallpaper / messages ── */}
              <div
                ref={messageContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto relative"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, rgba(139,92,246,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(236,72,153,0.03) 0%, transparent 50%)",
                }}
              >
                <div className="px-4 sm:px-8 lg:px-16 py-4 space-y-0.5">
                  {loadingMsgs ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                        <p className="text-white/25 text-xs">Loading messages…</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-6 py-4 text-center max-w-sm">
                        <p className="text-purple-300/80 text-sm">
                          🔒 Messages are end-to-end private. Say hello to{" "}
                          <span className="font-semibold text-white/80">
                            {otherUser?.username}
                          </span>
                          !
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const mine = isMe(msg);
                        const prev = messages[idx - 1];
                        const showDate = isDifferentDay(
                          prev?.created_at,
                          msg.created_at
                        );
                        // Group consecutive messages from same sender
                        const sameSenderAsPrev =
                          prev &&
                          prev.sender?.email === msg.sender?.email &&
                          !showDate;
                        const next = messages[idx + 1];
                        const sameSenderAsNext =
                          next &&
                          next.sender?.email === msg.sender?.email &&
                          !isDifferentDay(msg.created_at, next?.created_at);

                        // Bubble radius logic (WhatsApp-style grouping)
                        const isFirst = !sameSenderAsPrev;
                        const isLast = !sameSenderAsNext;

                        return (
                          <React.Fragment key={msg.id}>
                            {/* Date separator */}
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <span className="bg-[#1a1a26] text-white/40 text-[11px] font-medium px-4 py-1.5 rounded-lg shadow-sm">
                                  {dateBanner(msg.created_at)}
                                </span>
                              </div>
                            )}

                            {/* Message bubble */}
                            <div
                              className={`flex ${mine ? "justify-end" : "justify-start"} ${
                                isFirst && idx > 0 && !showDate ? "mt-3" : "mt-[3px]"
                              }`}
                            >
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.15 }}
                                className={`relative max-w-[75%] sm:max-w-[65%] lg:max-w-[55%] px-3 py-2 ${
                                  mine
                                    ? `bg-gradient-to-br from-purple-600/90 to-purple-700/90 text-white ${
                                        isFirst && isLast
                                          ? "rounded-2xl rounded-tr-md"
                                          : isFirst
                                          ? "rounded-2xl rounded-tr-md rounded-br-md"
                                          : isLast
                                          ? "rounded-2xl rounded-r-md rounded-tr-md"
                                          : "rounded-2xl rounded-r-md"
                                      }`
                                    : `bg-[#1e1e2c] text-white/90 border border-white/[0.04] ${
                                        isFirst && isLast
                                          ? "rounded-2xl rounded-tl-md"
                                          : isFirst
                                          ? "rounded-2xl rounded-tl-md rounded-bl-md"
                                          : isLast
                                          ? "rounded-2xl rounded-l-md rounded-tl-md"
                                          : "rounded-2xl rounded-l-md"
                                      }`
                                }`}
                              >
                                {/* Sender name for group chats / first in group */}
                                {!mine && isFirst && (
                                  <p className="text-purple-400 text-[11px] font-semibold mb-0.5">
                                    {msg.sender?.username}
                                  </p>
                                )}

                                {/* Content */}
                                {msg.content && (
                                  <div className="text-[14px] leading-[1.45]">
                                    <MessageContent content={msg.content} />
                                    {/* Inline time + ticks */}
                                    <span className="inline-flex items-center gap-1 float-right ml-3 mt-1 translate-y-[2px]">
                                      <span
                                        className={`text-[10px] ${
                                          mine ? "text-white/50" : "text-white/25"
                                        }`}
                                      >
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                      {mine && (
                                        <span className="text-purple-300/70">
                                          {msg.is_read ? (
                                            <IoCheckmarkDoneSharp className="text-[13px]" />
                                          ) : (
                                            <IoCheckmarkSharp className="text-[13px]" />
                                          )}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                )}

                                {/* Attachments */}
                                {msg.attachments?.length > 0 && (
                                  <div className="mt-1.5 space-y-1">
                                    {msg.attachments.map((att, i) => (
                                      <a
                                        key={i}
                                        href={att.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs bg-black/20 rounded-lg px-3 py-2 hover:bg-black/30 transition-colors"
                                      >
                                        <IoImageOutline className="text-base flex-shrink-0" />
                                        <span className="truncate">Attachment {i + 1}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Scroll-to-bottom FAB */}
                <AnimatePresence>
                  {showScrollBtn && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      onClick={scrollToBottom}
                      className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-[#1e1e2c] border border-white/10 shadow-xl flex items-center justify-center text-white/60 hover:text-white/80 hover:bg-[#252536] transition-colors z-20"
                    >
                      <IoChevronDown className="text-lg" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Attachment preview bar ── */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-[#13131a] border-t border-white/[0.04] px-5 overflow-hidden"
                  >
                    <div className="flex gap-2 py-3 overflow-x-auto">
                      {attachments.map((f, i) => (
                        <div
                          key={i}
                          className="relative flex-shrink-0 bg-[#1a1a24] border border-white/[0.06] rounded-lg px-3 py-2 flex items-center gap-2"
                        >
                          <IoAttachOutline className="text-white/40 text-sm" />
                          <span className="text-white/60 text-xs max-w-[100px] truncate">
                            {f.name}
                          </span>
                          <button
                            onClick={() => removeAttachment(i)}
                            className="ml-1 text-white/30 hover:text-red-400 transition-colors"
                          >
                            <IoCloseOutline className="text-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Input area ── */}
              <form
                onSubmit={handleSend}
                className="flex items-end gap-2 sm:gap-3 px-4 sm:px-5 py-3 bg-[#13131a] border-t border-white/[0.04] flex-shrink-0"
              >
                {/* Attachment button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-full text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all flex-shrink-0"
                >
                  <IoAttachOutline className="text-xl rotate-45" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAttachment}
                />

                {/* Input */}
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      // Auto-grow
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder="Type a message"
                    rows={1}
                    className="w-full bg-[#1a1a24] rounded-2xl pl-4 pr-4 py-3 text-white text-[14px] placeholder-white/25 outline-none resize-none transition-colors focus:bg-[#1e1e2a]"
                    style={{ minHeight: "46px", maxHeight: "120px" }}
                  />
                </div>

                {/* Send */}
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.9 }}
                  disabled={
                    sending ||
                    (!messageInput.trim() && attachments.length === 0)
                  }
                  className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
                >
                  {sending ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                  ) : (
                    <IoSendSharp className="text-lg" />
                  )}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GigMessages;
