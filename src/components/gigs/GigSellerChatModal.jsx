import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCloseOutline,
  IoSendSharp,
  IoAttachOutline,
  IoImageOutline,
} from "react-icons/io5";
import {
  createConversation,
  getConversationMessages,
  sendMessage,
} from "../../api/gigs";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

const getWsBaseUrl = () => {
  const url = BASE_URL.replace(/\/$/, "");
  if (url.startsWith("https://")) return url.replace("https://", "wss://");
  return url.replace("http://", "ws://");
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

const isDifferentDay = (a, b) => {
  if (!a || !b) return true;
  return new Date(a).toDateString() !== new Date(b).toDateString();
};

const dateBanner = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
};

const GigSellerChatModal = ({
  isOpen,
  onClose,
  accessToken,
  sellerEmail,
  sellerName,
  currentUserEmail,
}) => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const messageContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const colors = getAvatarColor(sellerName);

  const isMe = (msg) => {
    const se = msg.sender?.email;
    if (se) return se === currentUserEmail;
    return msg.sender?.username === currentUserEmail?.split("@")[0];
  };

  // ─── Init conversation ───
  useEffect(() => {
    if (!isOpen || !accessToken || !sellerEmail) return;
    let cancelled = false;
    const init = async () => {
      setLoadingInit(true);
      try {
        const convRes = await createConversation(accessToken, sellerEmail);
        if (cancelled) return;
        setConversationId(convRes.data.id);
        const msgRes = await getConversationMessages(accessToken, convRes.data.id);
        if (cancelled) return;
        setMessages(Array.isArray(msgRes.data) ? msgRes.data : msgRes.data.results || []);
      } catch (err) {
        console.error("Chat init failed:", err);
      } finally {
        if (!cancelled) setLoadingInit(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [isOpen, accessToken, sellerEmail]);

  // ─── WebSocket ───
  const connectWs = useCallback(() => {
    if (!conversationId) return;
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    const ws = new WebSocket(`${getWsBaseUrl()}/ws/chat/${conversationId}/`);
    ws.onopen = () => console.log("[GigChat] WS connected", conversationId);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newMsg = {
          id: data.message_id || `ws-${Date.now()}`,
          content: data.message,
          sender: { id: data.sender_id, username: data.sender_username || "", email: data.sender_email || "" },
          created_at: data.created_at || new Date().toISOString(),
          attachments: [],
        };
        setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      } catch { /* ignore */ }
    };
    ws.onclose = () => { reconnectTimer.current = setTimeout(() => { if (wsRef.current === ws) connectWs(); }, 3000); };
    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, [conversationId]);

  useEffect(() => {
    if (isOpen && conversationId) connectWs();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, [isOpen, conversationId, connectWs]);

  // ─── Auto-scroll — stay within the container ───
  useEffect(() => {
    const el = messageContainerRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages]);

  // ─── Send ───
  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (!conversationId) return;
    setSending(true);
    try {
      if (attachments.length > 0) {
        await sendMessage(accessToken, conversationId, text, attachments);
        setAttachments([]);
        const msgRes = await getConversationMessages(accessToken, conversationId);
        setMessages(Array.isArray(msgRes.data) ? msgRes.data : msgRes.data.results || []);
      } else if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ message: text, sender_email: currentUserEmail }));
      } else {
        await sendMessage(accessToken, conversationId, text);
        const msgRes = await getConversationMessages(accessToken, conversationId);
        setMessages(Array.isArray(msgRes.data) ? msgRes.data : msgRes.data.results || []);
      }
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "40px";
    } catch (err) {
      console.error("Send failed:", err);
    } finally { setSending(false); }
  };

  const handleAttachment = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = "";
  };

  const removeAttachment = (idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const handleClose = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
    setAttachments([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-[80vh] sm:h-[580px] bg-[#0b0b12] border border-white/[0.05] sm:rounded-2xl rounded-t-2xl shadow-2xl shadow-black/50 z-[101] flex flex-col overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#0e0e15]/90 backdrop-blur-2xl border-b border-white/[0.04] flex-shrink-0">
              <div
                className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white font-semibold text-[14px] uppercase flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                  boxShadow: `0 3px 10px -2px ${colors[0]}33`,
                }}
              >
                {sellerName?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-[14.5px] tracking-[-0.01em] truncate">{sellerName}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-xl hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-all"
              >
                <IoCloseOutline className="text-[20px]" />
              </button>
            </div>

            {/* ── Messages ── */}
            <div
              ref={messageContainerRef}
              className="flex-1 overflow-y-auto"
              style={{ background: "#0b0b12" }}
            >
              <div className="px-4 py-4 space-y-[2px]">
                {loadingInit ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
                      <p className="text-white/15 text-[10px] font-semibold tracking-[0.1em] uppercase">Loading</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="bg-white/[0.02] border border-white/[0.03] rounded-2xl px-6 py-4 text-center max-w-[260px]">
                      <p className="text-white/30 text-[13px] leading-relaxed">
                        Start a conversation with{" "}
                        <span className="font-semibold text-white/50">{sellerName}</span>
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

                      const radius = mine
                        ? `${isFirst ? "18px" : "5px"} 5px ${isLast ? "18px" : "5px"} 18px`
                        : `5px ${isFirst ? "18px" : "5px"} 18px ${isLast ? "18px" : "5px"}`;

                      return (
                        <React.Fragment key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center py-5">
                              <span className="text-white/15 text-[10px] font-semibold tracking-[0.06em] uppercase select-none">
                                {dateBanner(msg.created_at)}
                              </span>
                            </div>
                          )}

                          <div className={`flex ${mine ? "justify-end" : "justify-start"} ${isFirst && idx > 0 && !showDate ? "mt-3" : "mt-[2px]"}`}>
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                              className={`relative max-w-[82%] px-3.5 py-[9px] ${
                                mine
                                  ? "bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white"
                                  : "bg-[#16161f] text-white/[0.85] border border-white/[0.04]"
                              }`}
                              style={{
                                borderRadius: radius,
                                ...(mine ? { boxShadow: "0 2px 12px -3px rgba(124, 58, 237, 0.2)" } : {}),
                              }}
                            >
                              {msg.content && (
                                <div className="text-[13.5px] leading-[1.5] tracking-[-0.006em]">
                                  <MessageContent content={msg.content} mine={mine} />
                                  <span className={`inline-block float-right ml-3 mt-[2px] text-[9.5px] tabular-nums font-medium ${mine ? "text-white/35" : "text-white/15"}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              )}

                              {msg.attachments?.length > 0 && (
                                <div className="mt-1.5 space-y-1">
                                  {msg.attachments.map((att, i) => (
                                    <a key={i} href={att.file} target="_blank" rel="noopener noreferrer"
                                      className={`flex items-center gap-2 text-[11px] rounded-lg px-3 py-2 transition-all duration-200 font-medium ${
                                        mine ? "bg-white/[0.1] hover:bg-white/[0.15] text-white/80" : "bg-white/[0.03] hover:bg-white/[0.05] text-white/40 border border-white/[0.04]"
                                      }`}
                                    >
                                      <IoImageOutline className="text-[14px] flex-shrink-0" />
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
            </div>

            {/* ── Attachment previews ── */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="bg-[#0e0e15] border-t border-white/[0.03] px-4 overflow-hidden"
                >
                  <div className="flex gap-2 py-2.5 overflow-x-auto">
                    {attachments.map((f, i) => (
                      <div key={i} className="relative flex-shrink-0 bg-white/[0.03] border border-white/[0.04] rounded-xl px-3 py-2 flex items-center gap-2">
                        <IoAttachOutline className="text-white/20 text-[12px]" />
                        <span className="text-white/40 text-[11px] max-w-[70px] truncate font-medium">{f.name}</span>
                        <button onClick={() => removeAttachment(i)} className="ml-0.5 text-white/15 hover:text-red-400 transition-colors">
                          <IoCloseOutline className="text-[12px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input ── */}
            <form onSubmit={handleSend} className="flex items-end gap-2.5 px-3.5 py-3 bg-[#0e0e15]/90 backdrop-blur-2xl border-t border-white/[0.04] flex-shrink-0">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-xl text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-all flex-shrink-0 mb-[1px]"
              >
                <IoAttachOutline className="text-[17px] rotate-45" />
              </button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAttachment} />

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                placeholder="Message"
                rows={1}
                className="flex-1 bg-white/[0.04] rounded-2xl px-3.5 py-2.5 text-white/90 text-[13.5px] placeholder-white/15 outline-none resize-none border border-white/[0.03] focus:border-purple-500/20 focus:bg-white/[0.06] transition-all duration-300"
                style={{ minHeight: "40px", maxHeight: "100px" }}
              />

              <motion.button type="submit" whileTap={{ scale: 0.88 }}
                disabled={sending || (!input.trim() && attachments.length === 0)}
                className="p-2 rounded-[12px] bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white disabled:opacity-15 disabled:cursor-not-allowed flex-shrink-0 shadow-md shadow-purple-600/15 transition-all duration-200 mb-[1px]"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                ) : (
                  <IoSendSharp className="text-[15px]" />
                )}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GigSellerChatModal;
