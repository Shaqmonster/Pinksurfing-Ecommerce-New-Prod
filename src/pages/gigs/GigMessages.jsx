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
  IoCloseOutline,
  IoImageOutline,
} from "react-icons/io5";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

/* ─── Helpers ─────────────────────────────────────────────────── */

const getWsBaseUrl = () => {
  const url = BASE_URL.replace(/\/$/, "");
  return url.startsWith("https://")
    ? url.replace("https://", "wss://")
    : url.replace("http://", "ws://");
};

const getEmailFromToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1])).email || null;
  } catch {
    return null;
  }
};

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
  return "Now";
};

const dateBanner = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
};

const isDifferentDay = (a, b) => {
  if (!a || !b) return true;
  const da = new Date(a);
  const db = new Date(b);
  return da.getDate() !== db.getDate() || da.getMonth() !== db.getMonth() || da.getFullYear() !== db.getFullYear();
};

const MessageContent = ({ content, mine }) => {
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRe);
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((p, i) =>
        urlRe.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer"
            className={`underline decoration-1 underline-offset-2 break-all ${mine ? "text-white/90 hover:text-white" : "text-purple-400 hover:text-purple-300"}`}
          >{p}</a>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  );
};

/* ─── Avatar Colors ───────────────────────────────────────────── */
const AVATAR_COLORS = [
  ["#6366f1", "#8b5cf6"],
  ["#ec4899", "#f43f5e"],
  ["#06b6d4", "#3b82f6"],
  ["#f59e0b", "#ef4444"],
  ["#10b981", "#14b8a6"],
  ["#8b5cf6", "#ec4899"],
];

const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/* ─── Conversation Sidebar Item ───────────────────────────────── */

const ConversationItem = ({ conv, isActive, myEmail, onClick }) => {
  const other = conv.participants?.find((p) => p.email !== myEmail);
  const last = conv.last_message;
  const colors = getAvatarColor(other?.username);

  return (
    <button onClick={onClick} className="w-full text-left group">
      <div
        className={`flex items-center gap-3.5 mx-3 px-3 py-[13px] rounded-2xl transition-all duration-200 ${
          isActive
            ? "bg-purple-500/[0.1] shadow-sm shadow-purple-500/[0.05]"
            : "hover:bg-white/[0.025]"
        }`}
      >
        {/* Avatar */}
        <div
          className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center text-white font-semibold text-[16px] uppercase flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            boxShadow: `0 4px 12px -2px ${colors[0]}33`,
          }}
        >
          {other?.username?.[0] || "?"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-[2px]">
            <p className={`text-[14px] truncate tracking-[-0.01em] ${isActive ? "text-white font-semibold" : "text-white/80 font-medium"}`}>
              {other?.username || "Unknown"}
            </p>
            <span className="text-[11px] flex-shrink-0 ml-2 text-white/25 font-medium tabular-nums">
              {last ? timeAgo(last.created_at) : ""}
            </span>
          </div>
          <p className="text-[12.5px] truncate text-white/30 leading-snug">
            {last?.sender?.email === myEmail && <span className="text-white/20">You: </span>}
            {last?.content || "No messages yet"}
          </p>
        </div>
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

  const myEmail = user?.email || getEmailFromToken(cookies.access_token) || "";

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
  const textareaRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  /* ── init ── */
  useEffect(() => {
    if (!cookies.access_token) { navigate("/signin"); return; }
    fetchConversations();
  }, [cookies.access_token]);

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
    } catch { toast.error("Failed to load conversations."); }
    finally { setLoadingConvs(false); }
  };

  /* ── messages ── */
  const fetchMessages = useCallback(async (convId) => {
    setLoadingMsgs(true);
    try {
      const res = await getConversationMessages(cookies.access_token, convId);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setMessages(data);
    } catch { toast.error("Failed to load messages."); }
    finally { setLoadingMsgs(false); }
  }, [cookies.access_token]);

  const selectConversation = (conv) => {
    setActiveConv(conv);
    setMessages([]);
    setShowMobileList(false);
    fetchMessages(conv.id);
    connectWs(conv.id);
  };

  /* ── WebSocket ── */
  const connectWs = useCallback((convId) => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    clearTimeout(reconnectRef.current);
    const ws = new WebSocket(`${getWsBaseUrl()}/ws/chat/${convId}/`);
    ws.onopen = () => console.log("[Chat] WS connected", convId);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const newMsg = {
          id: data.message_id || `ws-${Date.now()}`,
          content: data.message,
          sender: { id: data.sender_id, username: data.sender_username || "", email: data.sender_email || "" },
          created_at: data.created_at || new Date().toISOString(),
          attachments: [],
        };
        setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, last_message: newMsg, updated_at: newMsg.created_at } : c));
      } catch { /* ignore */ }
    };
    ws.onclose = () => { reconnectRef.current = setTimeout(() => { if (wsRef.current === ws) connectWs(convId); }, 3000); };
    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, [myEmail]);

  useEffect(() => () => {
    clearTimeout(reconnectRef.current);
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
  }, []);

  /* ── auto-scroll — use scrollTop to stay WITHIN the chat container ── */
  useEffect(() => {
    const el = messageContainerRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = messageContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  };

  const scrollToBottom = () => {
    const el = messageContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
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
        await sendMessage(cookies.access_token, activeConv.id, text, attachments);
        setAttachments([]);
        fetchMessages(activeConv.id);
      } else if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ message: text, sender_email: myEmail }));
      } else {
        await sendMessage(cookies.access_token, activeConv.id, text);
        fetchMessages(activeConv.id);
      }
      setMessageInput("");
      if (textareaRef.current) textareaRef.current.style.height = "44px";
      fetchConversations();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send message.");
    } finally { setSending(false); }
  };

  const handleAttachment = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = "";
  };

  const removeAttachment = (idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  /* ── derived ── */
  const filteredConvs = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const other = conv.participants?.find((p) => p.email !== myEmail);
    return other?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const otherUser = activeConv?.participants?.find((p) => p.email !== myEmail);
  const otherColors = getAvatarColor(otherUser?.username);
  const isMe = (msg) => msg.sender?.email === myEmail;

  /* ════════════════════════════════════════════════════════════════
     RENDER — Apple-inspired, full-width, premium dark UI
     ════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#09090f]">

      {/* ════════════ SIDEBAR ════════════ */}
      <aside className={`${showMobileList ? "flex" : "hidden"} md:flex flex-col w-full md:w-[320px] lg:w-[360px] bg-[#0e0e15] flex-shrink-0 border-r border-white/[0.04]`}>

        {/* Sidebar header */}
        <div className="px-5 pt-6 pb-4 flex-shrink-0">
          <h1 className="text-white text-[24px] font-bold tracking-[-0.03em] mb-5">Messages</h1>
          <div className="relative">
            <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-[14px]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-4 py-[10px] bg-white/[0.04] rounded-xl text-white/90 placeholder-white/20 text-[13px] outline-none border border-transparent focus:border-purple-500/20 focus:bg-white/[0.06] transition-all duration-300"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-1">
          {loadingConvs ? (
            <div className="px-3 space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3.5 px-3 py-[13px]">
                  <div className="w-[44px] h-[44px] rounded-[14px] bg-white/[0.03] animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3 bg-white/[0.03] rounded-lg animate-pulse w-3/5" />
                    <div className="h-2.5 bg-white/[0.03] rounded-lg animate-pulse w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-10 pb-20">
              <div className="w-16 h-16 rounded-[20px] bg-white/[0.03] flex items-center justify-center mb-4">
                <IoChatbubbleOutline className="text-[28px] text-white/10" />
              </div>
              <p className="text-white/30 text-[13px] font-medium text-center mb-1">No conversations</p>
              <p className="text-white/15 text-[12px] text-center leading-relaxed">
                Visit a gig and tap &ldquo;Message Seller&rdquo;
              </p>
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <ConversationItem key={conv.id} conv={conv} isActive={activeConv?.id === conv.id} myEmail={myEmail} onClick={() => selectConversation(conv)} />
            ))
          )}
        </div>
      </aside>

      {/* ════════════ CHAT AREA ════════════ */}
      <main className={`${showMobileList ? "hidden" : "flex"} md:flex flex-col flex-1 bg-[#09090f] overflow-hidden`}>
        {!activeConv ? (
          /* ── Empty state ── */
          <div className="flex-1 flex items-center justify-center flex-col gap-5">
            <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-purple-500/[0.06] to-pink-500/[0.03] flex items-center justify-center border border-white/[0.03]">
              <IoChatbubbleOutline className="text-[34px] text-purple-500/25" />
            </div>
            <div className="text-center">
              <p className="text-white/50 text-[16px] font-semibold tracking-[-0.01em] mb-1.5">Your Messages</p>
              <p className="text-white/20 text-[13px] max-w-[260px] leading-relaxed">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat header ── */}
            <header className="flex items-center gap-3.5 px-5 py-3 bg-[#0e0e15]/90 backdrop-blur-2xl border-b border-white/[0.04] flex-shrink-0">
              <button
                onClick={() => { setShowMobileList(true); setActiveConv(null); if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } }}
                className="md:hidden p-1.5 -ml-1 rounded-xl hover:bg-white/[0.04] text-white/40 transition-colors"
              >
                <IoChevronBackOutline className="text-[18px]" />
              </button>

              <div
                className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white font-semibold text-[14px] uppercase flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${otherColors[0]}, ${otherColors[1]})`,
                  boxShadow: `0 3px 10px -2px ${otherColors[0]}33`,
                }}
              >
                {otherUser?.username?.[0] || "?"}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-[15px] tracking-[-0.01em] truncate">
                  {otherUser?.username || "Unknown"}
                </p>
              </div>
            </header>

            {/* ── Messages area ── */}
            <div
              ref={messageContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto"
              style={{ background: "#0b0b12" }}
            >
              <div className="px-5 sm:px-8 lg:px-14 xl:px-20 py-5 space-y-[2px]">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-28">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-7 h-7 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
                      <p className="text-white/15 text-[11px] font-semibold tracking-[0.1em] uppercase">Loading</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-28">
                    <div className="bg-white/[0.02] border border-white/[0.03] rounded-2xl px-8 py-5 text-center max-w-[300px]">
                      <p className="text-white/30 text-[13px] leading-relaxed">
                        Start your conversation with{" "}
                        <span className="font-semibold text-white/50">{otherUser?.username}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const mine = isMe(msg);
                      const prev = messages[idx - 1];
                      const showDate = isDifferentDay(prev?.created_at, msg.created_at);
                      const sameSenderAsPrev = prev && prev.sender?.email === msg.sender?.email && !showDate;
                      const next = messages[idx + 1];
                      const sameSenderAsNext = next && next.sender?.email === msg.sender?.email && !isDifferentDay(msg.created_at, next?.created_at);
                      const isFirst = !sameSenderAsPrev;
                      const isLast = !sameSenderAsNext;

                      // iMessage-style dynamic border radius
                      const radius = mine
                        ? `${isFirst ? "20px" : "6px"} 6px ${isLast ? "20px" : "6px"} 20px`
                        : `6px ${isFirst ? "20px" : "6px"} 20px ${isLast ? "20px" : "6px"}`;

                      return (
                        <React.Fragment key={msg.id}>
                          {/* Date banner */}
                          {showDate && (
                            <div className="flex justify-center py-6">
                              <span className="text-white/15 text-[11px] font-semibold tracking-[0.06em] uppercase select-none">
                                {dateBanner(msg.created_at)}
                              </span>
                            </div>
                          )}

                          {/* Bubble */}
                          <div className={`flex ${mine ? "justify-end" : "justify-start"} ${isFirst && idx > 0 && !showDate ? "mt-4" : "mt-[3px]"}`}>
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                              className={`relative max-w-[72%] sm:max-w-[62%] lg:max-w-[52%] xl:max-w-[45%] px-[14px] py-[10px] ${
                                mine
                                  ? "bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white"
                                  : "bg-[#16161f] text-white/[0.85] border border-white/[0.04]"
                              }`}
                              style={{
                                borderRadius: radius,
                                ...(mine ? { boxShadow: "0 2px 16px -4px rgba(124, 58, 237, 0.2)" } : {}),
                              }}
                            >
                              {/* Sender label — first in group, received only */}
                              {!mine && isFirst && (
                                <p className="text-[11px] font-semibold mb-[3px] text-purple-400/70">
                                  {msg.sender?.username}
                                </p>
                              )}

                              {/* Text + inline time */}
                              {msg.content && (
                                <div className="text-[14px] leading-[1.55] tracking-[-0.006em]">
                                  <MessageContent content={msg.content} mine={mine} />
                                  <span className={`inline-block float-right ml-4 mt-[2px] text-[10px] tabular-nums font-medium ${mine ? "text-white/35" : "text-white/15"}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              )}

                              {/* Attachments */}
                              {msg.attachments?.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  {msg.attachments.map((att, i) => (
                                    <a key={i} href={att.file} target="_blank" rel="noopener noreferrer"
                                      className={`flex items-center gap-2.5 text-[12px] rounded-xl px-3.5 py-2.5 transition-all duration-200 font-medium ${
                                        mine ? "bg-white/[0.1] hover:bg-white/[0.15] text-white/80" : "bg-white/[0.03] hover:bg-white/[0.05] text-white/40 border border-white/[0.04]"
                                      }`}
                                    >
                                      <IoImageOutline className="text-[15px] flex-shrink-0" />
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
                    <div ref={messagesEndRef} className="h-1" />
                  </>
                )}
              </div>

              {/* Scroll-to-bottom */}
              <AnimatePresence>
                {showScrollBtn && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={scrollToBottom}
                    className="sticky bottom-4 float-right mr-5 w-9 h-9 rounded-full bg-[#16161f]/90 backdrop-blur-xl border border-white/[0.05] shadow-xl shadow-black/30 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-[#1e1e2c] transition-all duration-200 z-30"
                  >
                    <IoChevronDown className="text-[16px]" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* ── Attachment preview ── */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="bg-[#0e0e15] border-t border-white/[0.03] px-5 overflow-hidden"
                >
                  <div className="flex gap-2.5 py-3 overflow-x-auto">
                    {attachments.map((f, i) => (
                      <div key={i} className="relative flex-shrink-0 bg-white/[0.03] border border-white/[0.04] rounded-xl px-3.5 py-2.5 flex items-center gap-2 group">
                        <IoAttachOutline className="text-white/20 text-[13px]" />
                        <span className="text-white/40 text-[12px] max-w-[100px] truncate font-medium">{f.name}</span>
                        <button onClick={() => removeAttachment(i)} className="ml-0.5 text-white/15 hover:text-red-400 transition-colors">
                          <IoCloseOutline className="text-[13px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input bar ── */}
            <form onSubmit={handleSend} className="flex items-end gap-3 px-5 py-3.5 bg-[#0e0e15]/90 backdrop-blur-2xl border-t border-white/[0.04] flex-shrink-0">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-all flex-shrink-0 mb-[2px]"
              >
                <IoAttachOutline className="text-[19px] rotate-45" />
              </button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAttachment} />

              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                  placeholder="Message"
                  rows={1}
                  className="w-full bg-white/[0.04] rounded-2xl pl-4 pr-4 py-3 text-white/90 text-[14px] placeholder-white/15 outline-none resize-none border border-white/[0.03] focus:border-purple-500/20 focus:bg-white/[0.06] transition-all duration-300"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
              </div>

              <motion.button type="submit" whileTap={{ scale: 0.88 }}
                disabled={sending || (!messageInput.trim() && attachments.length === 0)}
                className="p-2.5 rounded-[14px] bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white disabled:opacity-15 disabled:cursor-not-allowed flex-shrink-0 shadow-md shadow-purple-600/15 hover:shadow-purple-600/25 transition-all duration-200 mb-[2px]"
              >
                {sending ? (
                  <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                ) : (
                  <IoSendSharp className="text-[17px]" />
                )}
              </motion.button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default GigMessages;
