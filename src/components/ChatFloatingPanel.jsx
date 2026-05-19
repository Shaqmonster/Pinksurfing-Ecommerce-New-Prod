import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCookies } from "react-cookie";
import { IoChatbubbleOutline, IoCloseOutline, IoSendSharp, IoChevronBackOutline, IoSearchOutline, IoAttachOutline } from "react-icons/io5";
import { getConversations, getConversationMessages, sendMessage } from "../api/gigs";
import { authContext } from "../context/authContext";
import { CHAT_FILE_ACCEPT, fileNameFromUrl, getWsBaseUrl } from "../utils/chatHelpers";

const ChatFloatingPanel = ({ isOpen, onClose, pendingConversation, clearPendingConversation }) => {
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [otherUserStatus, setOtherUserStatus] = useState({ isOnline: false, lastSeen: null });
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);
  const myEmail = user?.email || "";

  const fetchConversations = useCallback(async () => {
    if (!cookies.access_token) return;
    try {
      const res = await getConversations(cookies.access_token);
      setConversations(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  }, [cookies.access_token]);

  useEffect(() => {
    if (isOpen && cookies.access_token) {
      fetchConversations();
    }
  }, [isOpen, cookies.access_token, fetchConversations]);

  useEffect(() => {
    if (!isOpen || !pendingConversation) return;
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === pendingConversation.id);
      return exists ? prev : [pendingConversation, ...prev];
    });
    selectConversation(pendingConversation);
    clearPendingConversation?.();
  }, [isOpen, pendingConversation]);

  useEffect(() => {
    if (!isOpen) {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => {
      fetchConversations();
      if (activeConv?.id) fetchMessages(activeConv.id, true);
    }, 8000);
    return () => clearInterval(pollRef.current);
  }, [isOpen, activeConv?.id, fetchConversations]);

  const fetchMessages = async (convId, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getConversationMessages(cookies.access_token, convId);
      setMessages(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const connectWs = (convId) => {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`${getWsBaseUrl()}/ws/chat/${convId}/`);

    ws.onopen = () => {
      if (myEmail) ws.send(JSON.stringify({ type: "identity", email: myEmail }));
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "user_status") {
        const other = otherUser(activeConv);
        if (data.email === other?.email) {
          setOtherUserStatus({ isOnline: data.is_online, lastSeen: data.last_seen });
        }
        return;
      }

      if (data.type === "message" || !data.type) {
        const newMsg = {
          id: data.message_id,
          content: data.message,
          sender: { email: data.sender_email, username: data.sender_username },
          created_at: data.created_at,
          attachments: [],
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    };
    wsRef.current = ws;
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const selectConversation = (conv) => {
    setActiveConv(conv);
    const other = otherUser(conv);
    if (other) {
      setOtherUserStatus({ isOnline: other.is_online, lastSeen: other.last_seen });
    }
    fetchMessages(conv.id);
    connectWs(conv.id);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeConv) return;
    if (!messageInput.trim() && attachments.length === 0) return;
    const text = messageInput.trim();
    setSending(true);

    try {
      if (attachments.length > 0) {
        await sendMessage(cookies.access_token, activeConv.id, text, attachments);
        setAttachments([]);
        setMessageInput("");
        fetchMessages(activeConv.id);
      } else if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ message: text, sender_email: myEmail }));
        setMessageInput("");
      } else {
        await sendMessage(cookies.access_token, activeConv.id, text);
        setMessageInput("");
        fetchMessages(activeConv.id);
      }
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 10));
    e.target.value = "";
  };

  const otherUser = (conv) => conv?.participants?.find((p) => p.email !== myEmail);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleBack = () => {
    setActiveConv(null);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const filtered = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const other = otherUser(conv);
    return other?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
          className="fixed bottom-24 right-8 w-[380px] h-[550px] bg-[#0E0F13] border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col backdrop-blur-xl"
        >
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            {activeConv ? (
              <div className="flex items-center gap-3">
                <button onClick={handleBack} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <IoChevronBackOutline className="text-xl text-gray-400" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold">
                    {otherUser(activeConv)?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{otherUser(activeConv)?.username}</p>
                    {otherUserStatus.isOnline ? (
                      <p className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Online
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-500 font-medium">Offline</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <h3 className="text-lg font-black tracking-tight text-white px-2">Messages</h3>
            )}
            <div className="flex items-center gap-2">
              <Link
                to={activeConv ? `/gighub/messages?conversation=${activeConv.id}` : "/gighub/messages"}
                className="text-[10px] font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300 px-2"
                onClick={onClose}
              >
                Full chat
              </Link>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400">
                <IoCloseOutline className="text-2xl" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {!activeConv ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="relative mb-4 px-2">
                  <IoSearchOutline className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder:text-gray-600 outline-none focus:border-purple-500/30 transition-all"
                  />
                </div>
                {filtered.length > 0 ? (
                  filtered.map((conv) => {
                    const other = otherUser(conv);
                    const unread = conv.unread_count || 0;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/[0.03] transition-all group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center text-white font-bold">
                          {other?.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-bold text-white mb-0.5 truncate">{other?.username}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[180px]">
                            {conv.last_message?.content || "Start a conversation"}
                          </p>
                        </div>
                        {unread > 0 && (
                          <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 mt-10">
                    <IoChatbubbleOutline className="text-5xl" />
                    <p className="text-sm font-medium">No messages yet</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden bg-white/[0.01]">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.sender?.email === myEmail;
                      return (
                        <div key={msg.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                              isMe
                                ? "bg-purple-600 text-white rounded-tr-none"
                                : "bg-white/5 text-gray-200 rounded-tl-none border border-white/5"
                            }`}
                          >
                            {msg.content}
                            {msg.attachments?.map((att, j) => (
                              <a
                                key={j}
                                href={att.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-2 text-xs underline truncate"
                              >
                                📎 {fileNameFromUrl(att.file)}
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {attachments.length > 0 && (
                  <div className="px-4 py-2 border-t border-white/5 flex flex-wrap gap-2">
                    {attachments.map((f, i) => (
                      <span key={i} className="text-[10px] bg-white/5 px-2 py-1 rounded-lg text-gray-400 truncate max-w-[120px]">
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSend} className="p-5 border-t border-white/5 bg-white/[0.02]">
                  <div className="relative flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                      <IoAttachOutline className="text-xl" />
                    </button>
                    <input ref={fileInputRef} type="file" multiple accept={CHAT_FILE_ACCEPT} className="hidden" onChange={handleAttachment} />
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Message… PDF, ZIP, images, video"
                      className="flex-1 bg-white/[0.05] border border-white/5 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/30 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={sending || (!messageInput.trim() && attachments.length === 0)}
                      className="p-2.5 bg-purple-600 rounded-xl text-white hover:bg-purple-500 disabled:opacity-50 transition-all"
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
