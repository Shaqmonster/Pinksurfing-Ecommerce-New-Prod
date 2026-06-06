import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCookies } from "react-cookie";
import {
  IoChatbubbleOutline,
  IoCloseOutline,
  IoSendSharp,
  IoChevronBackOutline,
  IoSearchOutline,
  IoAttachOutline,
} from "react-icons/io5";
import {
  createConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
} from "../api/gigs";
import { authContext } from "../context/authContext";
import { useAccessToken } from "../hooks/useAccessToken";
import {
  CHAT_FILE_ACCEPT,
  buildChatWebSocketUrl,
  fileNameFromUrl,
  getEmailFromToken,
  presenceLabel,
  sumUnreadCount,
} from "../utils/chatHelpers";

const ChatFloatingPanel = ({
  isOpen,
  onClose,
  pendingConversation,
  clearPendingConversation,
  pendingParticipantEmail,
  clearPendingParticipantEmail,
}) => {
  const { user } = useContext(authContext);
  const accessToken = useAccessToken();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [otherUserStatus, setOtherUserStatus] = useState({ isOnline: false, lastSeen: null });
  const [openingThread, setOpeningThread] = useState(false);

  const wsRef = useRef(null);
  const wsReconnectRef = useRef(null);
  const wsConnectedRef = useRef(false);
  const connectWsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);
  const activeConvRef = useRef(null);
  const messagesRef = useRef([]);
  const myEmail = (user?.email || getEmailFromToken(accessToken) || "").toLowerCase();

  messagesRef.current = messages;
  activeConvRef.current = activeConv;

  const otherUser = useCallback(
    (conv) => conv?.participants?.find((p) => (p.email || "").toLowerCase() !== myEmail),
    [myEmail]
  );

  const applyOtherPresence = useCallback((other) => {
    if (!other) return;
    setOtherUserStatus({
      isOnline: Boolean(other.is_online),
      lastSeen: other.last_seen || null,
    });
  }, []);

  const applyPresenceForEmail = useCallback((email, isOnline, lastSeen) => {
    const other = otherUser(activeConvRef.current);
    if (!other || !email) return;
    if (email.toLowerCase() !== (other.email || "").toLowerCase()) return;
    setOtherUserStatus({
      isOnline: Boolean(isOnline),
      lastSeen: lastSeen || null,
    });
  }, [otherUser]);

  const fetchConversations = useCallback(
    async (silent = false) => {
      if (!accessToken) return;
      if (!silent) setLoadingList(true);
      try {
        const res = await getConversations(accessToken);
        setConversations(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      } finally {
        if (!silent) setLoadingList(false);
      }
    },
    [accessToken]
  );

  const fetchMessages = useCallback(
    async (convId, { silent = false } = {}) => {
      if (!accessToken || !convId) return;
      if (!silent) setLoadingThread(true);
      try {
        const res = await getConversationMessages(accessToken, convId);
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setMessages((prev) => {
          if (silent && prev.length > 0 && data.length >= prev.length) {
            const lastPrev = prev[prev.length - 1]?.id;
            const lastNew = data[data.length - 1]?.id;
            if (lastPrev === lastNew && data.length === prev.length) return prev;
          }
          return data;
        });
      } catch (err) {
        console.error("Failed to fetch messages", err);
      } finally {
        if (!silent) setLoadingThread(false);
      }
    },
    [accessToken]
  );

  const sendWsIdentity = useCallback(() => {
    if (!myEmail || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "identity", email: myEmail }));
  }, [myEmail]);

  const connectWs = useCallback(
    (convId) => {
      const wsUrl = buildChatWebSocketUrl(convId, accessToken);
      if (!wsUrl) return;

      clearTimeout(wsReconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      wsConnectedRef.current = false;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        wsConnectedRef.current = true;
        sendWsIdentity();
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);

          if (data.type === "presence_snapshot" && Array.isArray(data.users)) {
            data.users.forEach((u) => {
              applyPresenceForEmail(u.email, u.is_online, u.last_seen);
            });
            return;
          }

          if (data.type === "user_status") {
            applyPresenceForEmail(data.email, data.is_online, data.last_seen);
            return;
          }

          if (data.type === "message" || data.message) {
            const newMsg = {
              id: data.message_id || `ws-${Date.now()}`,
              content: data.message,
              sender: {
                email: data.sender_email,
                username: data.sender_username || "",
              },
              created_at: data.created_at || new Date().toISOString(),
              attachments: data.attachments || [],
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              const withoutOptimistic = prev.filter(
                (m) =>
                  !String(m.id).startsWith("local-") ||
                  m.content !== newMsg.content ||
                  (m.sender?.email || "").toLowerCase() !== (newMsg.sender?.email || "").toLowerCase()
              );
              return [...withoutOptimistic, newMsg];
            });
            fetchConversations(true);
          }
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onerror = () => {
        wsConnectedRef.current = false;
      };

      ws.onclose = () => {
        wsConnectedRef.current = false;
        if (wsRef.current === ws) wsRef.current = null;
        if (activeConvRef.current?.id !== convId) return;
        clearTimeout(wsReconnectRef.current);
        wsReconnectRef.current = setTimeout(() => {
          if (activeConvRef.current?.id === convId) {
            connectWsRef.current?.(convId);
          }
        }, 2000);
      };

      wsRef.current = ws;
    },
    [accessToken, sendWsIdentity, applyPresenceForEmail, fetchConversations]
  );

  connectWsRef.current = connectWs;

  useEffect(() => {
    sendWsIdentity();
  }, [sendWsIdentity, activeConv?.id]);

  useEffect(() => {
    if (!isOpen || !myEmail || !activeConv?.id) return undefined;
    const heartbeat = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "heartbeat", email: myEmail }));
      } else if (activeConvRef.current?.id) {
        connectWs(activeConvRef.current.id);
      }
    };
    heartbeat();
    const id = setInterval(heartbeat, 30000);
    return () => clearInterval(id);
  }, [isOpen, myEmail, activeConv?.id, connectWs]);

  const openConversation = useCallback(
    async (conv, { silentMessages = false } = {}) => {
      if (!conv?.id) return;
      setActiveConv(conv);
      applyOtherPresence(otherUser(conv));
      connectWs(conv.id);
      await fetchMessages(conv.id, { silent: silentMessages });
    },
    [applyOtherPresence, otherUser, connectWs, fetchMessages]
  );

  const openConversationByEmail = useCallback(
    async (email) => {
      if (!email || !accessToken) return;
      setOpeningThread(true);
      try {
        const normalized = String(email).trim().toLowerCase();
        const existing = conversations.find((c) =>
          c.participants?.some((p) => (p.email || "").toLowerCase() === normalized)
        );
        if (existing) {
          await openConversation(existing);
          return;
        }
        const res = await createConversation(accessToken, normalized);
        const conv = res.data;
        setConversations((prev) => (prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]));
        await openConversation(conv);
      } catch (err) {
        console.error("Failed to open chat", err);
      } finally {
        setOpeningThread(false);
        clearPendingParticipantEmail?.();
      }
    },
    [
      accessToken,
      conversations,
      openConversation,
      clearPendingParticipantEmail,
    ]
  );

  useEffect(() => {
    if (isOpen && accessToken) fetchConversations(true);
  }, [isOpen, accessToken, fetchConversations]);

  useEffect(() => {
    if (!isOpen || !pendingConversation) return;
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === pendingConversation.id);
      return exists ? prev : [pendingConversation, ...prev];
    });
    openConversation(pendingConversation);
    clearPendingConversation?.();
  }, [isOpen, pendingConversation]);

  useEffect(() => {
    if (!isOpen || !pendingParticipantEmail) return;
    openConversationByEmail(pendingParticipantEmail);
  }, [isOpen, pendingParticipantEmail]);

  useEffect(() => {
    if (!isOpen) {
      clearInterval(pollRef.current);
      clearTimeout(wsReconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      wsConnectedRef.current = false;
      return;
    }
    const tick = () => {
      fetchConversations(true);
      if (activeConvRef.current?.id) {
        fetchMessages(activeConvRef.current.id, { silent: true });
      }
    };
    tick();
    pollRef.current = setInterval(tick, 5000);
    return () => clearInterval(pollRef.current);
  }, [isOpen, fetchConversations, fetchMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeConv?.id]);

  useEffect(() => {
    return () => {
      clearTimeout(wsReconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const appendOptimisticMessage = (text, files = []) => {
    const optimistic = {
      id: `local-${Date.now()}`,
      content: text,
      sender: { email: myEmail, username: user?.first_name || "You" },
      created_at: new Date().toISOString(),
      attachments: files.map((f, i) => ({ id: `local-a-${i}`, file: f.name })),
    };
    setMessages((prev) => [...prev, optimistic]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeConv) return;
    if (!messageInput.trim() && attachments.length === 0) return;

    const text = messageInput.trim();
    const files = [...attachments];
    setMessageInput("");
    setAttachments([]);
    setSending(true);

    try {
      appendOptimisticMessage(text, files);
      await sendMessage(accessToken, activeConv.id, text, files);
      await fetchMessages(activeConv.id, { silent: true });
      fetchConversations(true);
    } catch (err) {
      console.error("Failed to send message", err);
      setMessageInput(text);
      setAttachments(files);
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = (e) => {
    const picked = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...picked].slice(0, 10));
    e.target.value = "";
  };

  const handleBack = () => {
    setActiveConv(null);
    setMessages([]);
    clearTimeout(wsReconnectRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    wsConnectedRef.current = false;
  };

  const filtered = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const other = otherUser(conv);
    return other?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const presence = presenceLabel(otherUserStatus);
  const totalUnread = sumUnreadCount(conversations);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16, x: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16, x: 16 }}
          className="fixed bottom-24 right-4 sm:right-8 w-[min(100vw-2rem,400px)] h-[min(72vh,560px)] bg-[#0E0F13] border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] overflow-hidden flex flex-col backdrop-blur-xl"
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
            {activeConv ? (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors shrink-0"
                  aria-label="Back to conversations"
                >
                  <IoChevronBackOutline className="text-xl text-gray-400" />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {otherUser(activeConv)?.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {otherUser(activeConv)?.username || "Chat"}
                  </p>
                  <p
                    className={`text-[10px] font-medium flex items-center gap-1 truncate ${
                      presence.online ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        presence.online ? "bg-green-400 animate-pulse" : "bg-gray-500"
                      }`}
                    />
                    {presence.text}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">Messages</h3>
                {totalUnread > 0 && (
                  <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 shrink-0"
              aria-label="Close chat"
            >
              <IoCloseOutline className="text-2xl" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {openingThread || (loadingThread && messages.length === 0) ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : !activeConv ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
                <div className="relative mb-3 px-1">
                  <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-600 outline-none focus:border-purple-500/30"
                  />
                </div>
                {loadingList && filtered.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : filtered.length > 0 ? (
                  filtered.map((conv) => {
                    const other = otherUser(conv);
                    const unread = conv.unread_count || 0;
                    const p = presenceLabel({
                      isOnline: other?.is_online,
                      lastSeen: other?.last_seen,
                    });
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => openConversation(conv)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-all text-left"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-white/[0.06] flex items-center justify-center text-white font-bold shrink-0">
                          {other?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-white truncate">{other?.username}</p>
                            {unread > 0 && (
                              <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                {unread > 9 ? "9+" : unread}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 truncate">{p.text}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {conv.last_message?.content || "Start a conversation"}
                          </p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center opacity-40 gap-3 py-16">
                    <IoChatbubbleOutline className="text-4xl" />
                    <p className="text-sm font-medium text-center px-6">No conversations yet</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  {messages.map((msg, i) => {
                    const isMe = (msg.sender?.email || "").toLowerCase() === myEmail;
                    return (
                      <div
                        key={msg.id || i}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? "bg-purple-600 text-white rounded-tr-sm"
                              : "bg-white/5 text-gray-200 rounded-tl-sm border border-white/5"
                          }`}
                        >
                          {msg.content}
                          {msg.attachments?.map((att, j) => (
                            <a
                              key={j}
                              href={typeof att.file === "string" ? att.file : undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block mt-2 text-xs underline truncate ${
                                typeof att.file === "string" ? "" : "pointer-events-none opacity-70"
                              }`}
                            >
                              📎 {typeof att.file === "string" ? fileNameFromUrl(att.file) : att.file}
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {attachments.length > 0 && (
                  <div className="px-4 py-2 border-t border-white/5 flex flex-wrap gap-2 shrink-0">
                    {attachments.map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-white/5 px-2 py-1 rounded-lg text-gray-400 truncate max-w-[140px]"
                      >
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={handleSend}
                  className="p-4 border-t border-white/5 bg-white/[0.02] shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                      <IoAttachOutline className="text-xl" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={CHAT_FILE_ACCEPT}
                      className="hidden"
                      onChange={handleAttachment}
                    />
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message…"
                      className="flex-1 bg-white/[0.05] border border-white/5 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/30"
                    />
                    <button
                      type="submit"
                      disabled={sending || (!messageInput.trim() && attachments.length === 0)}
                      className="p-2.5 bg-purple-600 rounded-xl text-white hover:bg-purple-500 disabled:opacity-40 transition-all"
                    >
                      <IoSendSharp className="text-sm" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatFloatingPanel;
