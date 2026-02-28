import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import {
  getConversations,
  getConversationMessages,
  sendMessage,
} from "../../api/gigs";
import {
  IoSendOutline,
  IoAttachOutline,
  IoSearchOutline,
  IoChatbubbleOutline,
  IoChevronBackOutline,
} from "react-icons/io5";
import { FaBriefcase } from "react-icons/fa";

// Decode the Django User ID from the JWT access token payload
const getUserIdFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id || null;
  } catch {
    return null;
  }
};

// Detect URLs in message text and make them clickable
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

const ConversationItem = ({ conv, isActive, currentUserId, onClick }) => {
  const otherParticipant = conv.participants?.find((p) => p.id !== currentUserId);
  const lastMsg = conv.last_message;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 transition-all hover:bg-white/3 ${
        isActive ? "bg-white/5 border-r-2 border-purple-500" : "border-r-2 border-transparent"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0">
          {otherParticipant?.username?.[0] || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-white text-sm font-semibold truncate">
              {otherParticipant?.username || "Unknown"}
            </p>
            {lastMsg && (
              <span className="text-white/25 text-[10px] flex-shrink-0 ml-2">
                {new Date(lastMsg.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs truncate mt-0.5">
            {lastMsg?.content || "No messages yet"}
          </p>
        </div>
      </div>
    </button>
  );
};

const GigMessages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  // Get the current Django User ID from the JWT token
  const currentUserId = getUserIdFromToken(cookies.access_token);

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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    fetchConversations();
  }, [cookies.access_token]);

  // Open conversation from URL param
  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId && conversations.length > 0) {
      const found = conversations.find((c) => String(c.id) === convId);
      if (found) {
        selectConversation(found);
      }
    }
  }, [searchParams, conversations]);

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

  const fetchMessages = useCallback(async (convId) => {
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
  }, [cookies.access_token]);

  const selectConversation = (conv) => {
    setActiveConv(conv);
    setMessages([]);
    setShowMobileList(false);
    fetchMessages(conv.id);
    startPolling(conv.id);
  };

  // Polling for new messages every 3 seconds
  const startPolling = (convId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await getConversationMessages(cookies.access_token, convId);
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setMessages(data);
      } catch {
        // ignore polling errors
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeConv) return;
    if (!messageInput.trim() && attachments.length === 0) return;

    try {
      setSending(true);
      await sendMessage(cookies.access_token, activeConv.id, messageInput.trim(), attachments);
      setMessageInput("");
      setAttachments([]);
      fetchMessages(activeConv.id);
      // Refresh conversations to update last message
      fetchConversations();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to send message.");
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

  const filteredConvs = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const other = conv.participants?.find((p) => p.id !== currentUserId);
    return other?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const otherParticipant = activeConv?.participants?.find((p) => p.id !== currentUserId);

  return (
    <div className="bg-[#0a0a0f] min-h-screen flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
        {/* ── SIDEBAR ── */}
        <div
          className={`${
            showMobileList ? "flex" : "hidden"
          } md:flex flex-col w-full md:w-80 lg:w-96 border-r border-white/5 flex-shrink-0`}
        >
          {/* Sidebar header */}
          <div className="px-4 py-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-base">Messages</h2>
              <span className="text-white/30 text-xs">{conversations.length} conversations</span>
            </div>
            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-base" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-9 pr-4 py-2.5 bg-[#13131a] border border-white/10 rounded-xl text-white placeholder-white/30 text-sm outline-none focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-16 px-4">
                <IoChatbubbleOutline className="text-5xl text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No conversations yet</p>
                <p className="text-white/25 text-xs mt-1">
                  Start a conversation from a gig page
                </p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeConv?.id === conv.id}
                  currentUserId={currentUserId}
                  onClick={() => selectConversation(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── CHAT AREA ── */}
        <div className={`${showMobileList ? "hidden" : "flex"} md:flex flex-col flex-1 overflow-hidden`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <IoChatbubbleOutline className="text-4xl text-white/20" />
              </div>
              <p className="text-white/40 text-base">Select a conversation to start messaging</p>
              <p className="text-white/25 text-sm">Your messages are private and secure</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0d0d14]">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-white/60 transition-all"
                >
                  <IoChevronBackOutline />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0">
                  {otherParticipant?.username?.[0] || "?"}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{otherParticipant?.username || "Unknown"}</p>
                  <p className="text-white/30 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    Active
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <IoChatbubbleOutline className="text-5xl text-white/10" />
                    <p className="text-white/30 text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isMe = msg.sender?.id === currentUserId;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-xs font-bold uppercase flex-shrink-0 mt-1">
                            {msg.sender?.username?.[0] || "?"}
                          </div>
                          <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isMe
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
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                  {attachments.map((f, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-xs flex items-center gap-1.5">
                        <IoAttachOutline />
                        <span className="max-w-[100px] truncate">{f.name}</span>
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

              {/* Input area */}
              <form
                onSubmit={handleSend}
                className="flex items-end gap-2 px-4 py-3 border-t border-white/5 bg-[#0d0d14]"
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
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Type a message… (Enter to send)"
                  rows={1}
                  className="flex-1 bg-[#13131a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-purple-500 transition-all resize-none"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: sending ? 1 : 1.05 }}
                  whileTap={{ scale: sending ? 1 : 0.95 }}
                  disabled={sending || (!messageInput.trim() && attachments.length === 0)}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  {sending ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                  ) : (
                    <IoSendOutline className="text-lg" />
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
