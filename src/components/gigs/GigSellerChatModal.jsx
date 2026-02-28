import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCloseOutline,
  IoSendOutline,
  IoAttachOutline,
  IoChatbubbleOutline,
} from "react-icons/io5";
import {
  createConversation,
  getConversationMessages,
  sendMessage,
} from "../../api/gigs";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

/**
 * Derive the WebSocket base URL from the HTTP API URL.
 * http://... → ws://...   |   https://... → wss://...
 */
const getWsBaseUrl = () => {
  const url = BASE_URL.replace(/\/$/, "");
  if (url.startsWith("https://")) return url.replace("https://", "wss://");
  return url.replace("http://", "ws://");
};

/** Parse the current user's email from the SSO JWT (payload.email). */
const getEmailFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email || null;
  } catch {
    return null;
  }
};

/** Linkify URLs inside message text. */
const MessageContent = ({ content }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  return (
    <span>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300 break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

/**
 * A slide-up chat modal for contacting a gig seller.
 *
 * Props:
 *  - isOpen          : boolean
 *  - onClose         : () => void
 *  - accessToken     : string  (SSO JWT)
 *  - sellerEmail     : string  (GigWorker email)
 *  - sellerName      : string  (display name / username)
 *  - currentUserEmail: string  (current buyer's email)
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

  // ---- Initialise conversation when modal opens ----
  useEffect(() => {
    if (!isOpen || !accessToken || !sellerEmail) return;
    let cancelled = false;

    const init = async () => {
      setLoadingInit(true);
      try {
        // Create or find existing 1-to-1 conversation
        const convRes = await createConversation(accessToken, sellerEmail);
        if (cancelled) return;
        const conv = convRes.data;
        setConversationId(conv.id);

        // Fetch existing messages
        const msgRes = await getConversationMessages(accessToken, conv.id);
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
    return () => {
      cancelled = true;
    };
  }, [isOpen, accessToken, sellerEmail]);

  // ---- WebSocket lifecycle ----
  const connectWs = useCallback(() => {
    if (!conversationId) return;
    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsUrl = `${getWsBaseUrl()}/ws/chat/${conversationId}/`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[GigChat] WS connected", conversationId);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Construct a message object consistent with the REST format
        const newMsg = {
          id: data.message_id || `ws-${Date.now()}`,
          content: data.message,
          sender: {
            id: data.sender_id,
            username: data.sender_username || "",
          },
          created_at: data.created_at || new Date().toISOString(),
          is_read: false,
          attachments: [],
        };

        setMessages((prev) => {
          // Avoid duplicates (same id)
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } catch {
        // ignore bad frames
      }
    };

    ws.onclose = () => {
      console.log("[GigChat] WS closed");
      // Attempt reconnect after 3s if modal still open
      reconnectTimer.current = setTimeout(() => {
        if (wsRef.current === ws) connectWs();
      }, 3000);
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, [conversationId]);

  useEffect(() => {
    if (isOpen && conversationId) {
      connectWs();
    }
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen, conversationId, connectWs]);

  // ---- Auto-scroll ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---- Send message via WS (with REST fallback) ----
  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (!conversationId) return;

    setSending(true);
    try {
      if (attachments.length > 0) {
        // Attachments must go through REST
        await sendMessage(accessToken, conversationId, text, attachments);
        setAttachments([]);
        // Refresh messages to get attachment URLs
        const msgRes = await getConversationMessages(accessToken, conversationId);
        setMessages(Array.isArray(msgRes.data) ? msgRes.data : msgRes.data.results || []);
      } else if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Fast path — send via WebSocket (consumer persists to DB)
        wsRef.current.send(
          JSON.stringify({ message: text, sender_email: currentUserEmail })
        );
      } else {
        // Fallback REST
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

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---- Determine "isMe" ----
  const isMe = (msg) => {
    // Compare by email if available, else by username matching
    const senderEmail = msg.sender?.email;
    if (senderEmail) return senderEmail === currentUserEmail;
    // Fallback: if sender username matches first part of our email
    return (
      msg.sender?.username === currentUserEmail?.split("@")[0] ||
      msg.sender?.id === currentUserEmail
    );
  };

  // ---- Reset state on close ----
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
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-[80vh] sm:h-[600px] bg-[#0d0d14] border border-white/10 sm:rounded-2xl rounded-t-2xl shadow-2xl shadow-black/50 z-[101] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0a0a12] flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0">
                {sellerName?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{sellerName}</p>
                <p className="text-white/30 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  {conversationId ? "Connected" : "Connecting…"}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingInit ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <IoChatbubbleOutline className="text-5xl text-white/10" />
                  <p className="text-white/30 text-sm text-center">
                    Start a conversation with {sellerName}
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const mine = isMe(msg);
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-xs font-bold uppercase flex-shrink-0 mt-1">
                          {msg.sender?.username?.[0] || "?"}
                        </div>
                        <div
                          className={`max-w-[75%] flex flex-col gap-1 ${
                            mine ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              mine
                                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-tr-sm"
                                : "bg-[#1a1a24] text-white/80 border border-white/5 rounded-tl-sm"
                            }`}
                          >
                            {msg.content && <MessageContent content={msg.content} />}
                            {msg.attachments?.map((att, i) => (
                              <a
                                key={i}
                                href={att.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-1 text-xs underline opacity-80"
                              >
                                📎 Attachment {i + 1}
                              </a>
                            ))}
                          </div>
                          <span className="text-white/25 text-[10px] px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
                {attachments.map((f, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-xs flex items-center gap-1.5">
                      <IoAttachOutline />
                      <span className="max-w-[80px] truncate">{f.name}</span>
                    </div>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex items-end gap-2 px-4 py-3 border-t border-white/5 bg-[#0a0a12] flex-shrink-0"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition-all flex-shrink-0"
              >
                <IoAttachOutline className="text-lg" />
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Type a message…"
                rows={1}
                className="flex-1 bg-[#13131a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-purple-500 transition-all resize-none"
                style={{ minHeight: "44px", maxHeight: "100px" }}
              />
              <motion.button
                type="submit"
                whileHover={{ scale: sending ? 1 : 1.05 }}
                whileTap={{ scale: sending ? 1 : 0.95 }}
                disabled={sending || (!input.trim() && attachments.length === 0)}
                className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                {sending ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                ) : (
                  <IoSendOutline className="text-lg" />
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
