import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCloseOutline,
  IoSendSharp,
  IoAttachOutline,
  IoChatbubbleOutline,
  IoCheckmarkDoneSharp,
  IoCheckmarkSharp,
  IoImageOutline,
} from "react-icons/io5";
import {
  createConversation,
  getConversationMessages,
  sendMessage,
} from "../../api/gigs";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

/** WS URL from REST URL */
const getWsBaseUrl = () => {
  const url = BASE_URL.replace(/\/$/, "");
  if (url.startsWith("https://")) return url.replace("https://", "wss://");
  return url.replace("http://", "ws://");
};

/** Linkify URLs */
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

/** Check if two timestamps are on different calendar days */
const isDifferentDay = (a, b) => {
  if (!a || !b) return true;
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() !== db.toDateString();
};

/** Readable date banner */
const dateBanner = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

/**
 * Premium slide-up chat modal for contacting a gig seller.
 * WhatsApp-inspired design with inline timestamps, read ticks,
 * message grouping, and date separators.
 */
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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  // ─── Identity ───
  const isMe = (msg) => {
    const se = msg.sender?.email;
    if (se) return se === currentUserEmail;
    // Fallback: username = email prefix
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
        const data = Array.isArray(msgRes.data) ? msgRes.data : msgRes.data.results || [];
        setMessages(data);
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
      } catch { /* ignore */ }
    };
    ws.onclose = () => {
      reconnectTimer.current = setTimeout(() => {
        if (wsRef.current === ws) connectWs();
      }, 3000);
    };
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

  // ─── Auto-scroll ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        wsRef.current.send(
          JSON.stringify({ message: text, sender_email: currentUserEmail })
        );
      } else {
        await sendMessage(accessToken, conversationId, text);
        const msgRes = await getConversationMessages(accessToken, conversationId);
        setMessages(Array.isArray(msgRes.data) ? msgRes.data : msgRes.data.results || []);
      }
      setInput("");
    } catch (err) {
      console.error("Send failed:", err);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-[80vh] sm:h-[600px] bg-[#0d0d14] border border-white/[0.08] sm:rounded-2xl rounded-t-2xl shadow-2xl shadow-black/60 z-[101] flex flex-col overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#13131a] border-b border-white/[0.06] flex-shrink-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm uppercase">
                  {sellerName?.[0] || "?"}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#13131a]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-[15px] truncate">{sellerName}</p>
                <p className="text-green-400/70 text-xs">
                  {conversationId ? "online" : "connecting…"}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-all"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            {/* ── Messages ── */}
            <div
              className="flex-1 overflow-y-auto"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, rgba(139,92,246,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(236,72,153,0.03) 0%, transparent 50%)",
              }}
            >
              <div className="px-4 py-3 space-y-0.5">
                {loadingInit ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-5 py-3 text-center">
                      <p className="text-purple-300/80 text-sm">
                        🔒 Say hello to <span className="font-semibold text-white/80">{sellerName}</span>
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

                      return (
                        <React.Fragment key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-3">
                              <span className="bg-[#1a1a26] text-white/40 text-[10px] font-medium px-3 py-1 rounded-lg">
                                {dateBanner(msg.created_at)}
                              </span>
                            </div>
                          )}

                          <div
                            className={`flex ${mine ? "justify-end" : "justify-start"} ${
                              isFirst && idx > 0 && !showDate ? "mt-2.5" : "mt-[2px]"
                            }`}
                          >
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 3 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ duration: 0.12 }}
                              className={`relative max-w-[80%] px-3 py-2 ${
                                mine
                                  ? `bg-gradient-to-br from-purple-600/90 to-purple-700/90 text-white ${
                                      isFirst && isLast ? "rounded-2xl rounded-tr-md" :
                                      isFirst ? "rounded-2xl rounded-tr-md rounded-br-md" :
                                      isLast ? "rounded-2xl rounded-r-md rounded-tr-md" :
                                      "rounded-2xl rounded-r-md"
                                    }`
                                  : `bg-[#1e1e2c] text-white/90 border border-white/[0.04] ${
                                      isFirst && isLast ? "rounded-2xl rounded-tl-md" :
                                      isFirst ? "rounded-2xl rounded-tl-md rounded-bl-md" :
                                      isLast ? "rounded-2xl rounded-l-md rounded-tl-md" :
                                      "rounded-2xl rounded-l-md"
                                    }`
                              }`}
                            >
                              {msg.content && (
                                <div className="text-[13.5px] leading-[1.45]">
                                  <MessageContent content={msg.content} />
                                  <span className="inline-flex items-center gap-1 float-right ml-3 mt-1 translate-y-[2px]">
                                    <span className={`text-[10px] ${mine ? "text-white/50" : "text-white/25"}`}>
                                      {new Date(msg.created_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {mine && (
                                      <span className="text-purple-300/70">
                                        {msg.is_read ? (
                                          <IoCheckmarkDoneSharp className="text-[12px]" />
                                        ) : (
                                          <IoCheckmarkSharp className="text-[12px]" />
                                        )}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}

                              {msg.attachments?.length > 0 && (
                                <div className="mt-1 space-y-1">
                                  {msg.attachments.map((att, i) => (
                                    <a
                                      key={i}
                                      href={att.file}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-xs bg-black/20 rounded-lg px-2.5 py-1.5 hover:bg-black/30 transition-colors"
                                    >
                                      <IoImageOutline className="text-sm flex-shrink-0" />
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
            </div>

            {/* ── Attachment previews ── */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#13131a] border-t border-white/[0.04] px-4 overflow-hidden"
                >
                  <div className="flex gap-2 py-2 overflow-x-auto">
                    {attachments.map((f, i) => (
                      <div
                        key={i}
                        className="relative flex-shrink-0 bg-[#1a1a24] border border-white/[0.06] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"
                      >
                        <IoAttachOutline className="text-white/40 text-xs" />
                        <span className="text-white/60 text-[11px] max-w-[70px] truncate">{f.name}</span>
                        <button
                          onClick={() => removeAttachment(i)}
                          className="ml-0.5 text-white/30 hover:text-red-400 transition-colors"
                        >
                          <IoCloseOutline className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input ── */}
            <form
              onSubmit={handleSend}
              className="flex items-end gap-2 px-3 py-2.5 bg-[#13131a] border-t border-white/[0.04] flex-shrink-0"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all flex-shrink-0"
              >
                <IoAttachOutline className="text-lg rotate-45" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachment}
              />
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Type a message"
                rows={1}
                className="flex-1 bg-[#1a1a24] rounded-2xl px-4 py-2.5 text-white text-[13.5px] placeholder-white/25 outline-none resize-none focus:bg-[#1e1e2a] transition-colors"
                style={{ minHeight: "40px", maxHeight: "100px" }}
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.9 }}
                disabled={sending || (!input.trim() && attachments.length === 0)}
                className="p-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 shadow-lg shadow-purple-500/20 transition-all"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                ) : (
                  <IoSendSharp className="text-base" />
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
