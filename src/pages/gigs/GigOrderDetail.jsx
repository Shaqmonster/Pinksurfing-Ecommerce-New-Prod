import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import {
  getGigOrderDetail,
  submitOrderRequirements,
  deliverOrder,
  completeOrder,
  cancelOrder,
  createConversation,
} from "../../api/gigs";
import {
  IoTimeOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoDocumentTextOutline,
  IoCloudUploadOutline,
  IoChatbubbleOutline,
  IoAlertCircleOutline,
  IoRefreshOutline,
  IoShieldCheckmarkOutline,
  IoStarSharp,
  IoAttachOutline,
} from "react-icons/io5";
import { FaBriefcase } from "react-icons/fa";

const STATUS_STEPS = [
  { key: "pending_requirements", label: "Order Placed", icon: <FaBriefcase /> },
  { key: "in_progress", label: "In Progress", icon: <IoTimeOutline /> },
  { key: "delivered", label: "Delivered", icon: <IoCloudUploadOutline /> },
  { key: "completed", label: "Completed", icon: <IoCheckmarkCircle /> },
];

const STATUS_CONFIG = {
  pending_requirements: {
    label: "Awaiting Requirements",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    dot: "bg-yellow-400",
    stepIndex: 0,
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    dot: "bg-blue-400",
    stepIndex: 1,
  },
  delivered: {
    label: "Delivered - Review Required",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    dot: "bg-purple-400",
    stepIndex: 2,
  },
  completed: {
    label: "Completed",
    color: "text-green-400 bg-green-500/10 border-green-500/30",
    dot: "bg-green-400",
    stepIndex: 3,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    dot: "bg-red-400",
    stepIndex: -1,
  },
};

// Requirements Modal
const RequirementsModal = ({ order, onClose, onSubmit, submitting }) => {
  const [answers, setAnswers] = useState([]);
  const requirements = order.gig?.requirements || [];

  const updateAnswer = (question, value) => {
    setAnswers((prev) => {
      const idx = prev.findIndex((a) => a.requirement_question === question);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], answer: value };
        return updated;
      }
      return [...prev, { requirement_question: question, answer: value }];
    });
  };

  const getAnswer = (q) => answers.find((a) => a.requirement_question === q)?.answer || "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#13131a] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
      >
        <h3 className="text-white font-bold text-lg mb-1">Submit Requirements</h3>
        <p className="text-white/40 text-sm mb-5">Answer the seller's questions to kick off your order.</p>

        {requirements.length > 0 ? (
          <div className="space-y-4">
            {requirements.map((req, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-white/70 text-sm font-medium">
                  {req.question}
                  {req.is_mandatory && <span className="text-pink-400 ml-1">*</span>}
                </label>
                <textarea
                  value={getAnswer(req.question)}
                  onChange={(e) => updateAnswer(req.question, e.target.value)}
                  rows={3}
                  placeholder="Your answer…"
                  className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-purple-400 transition-all resize-none"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <IoDocumentTextOutline className="text-4xl text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">No questions from the seller. Click submit to begin.</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:border-white/20 transition-all"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            onClick={() => onSubmit(answers)}
            disabled={submitting}
            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
            ) : (
              "Submit & Start Order"
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Delivery Modal (for seller)
const DeliveryModal = ({ onClose, onSubmit, submitting }) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);

  const handleFiles = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)].slice(0, 10));
    e.target.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#13131a] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
      >
        <h3 className="text-white font-bold text-lg mb-1">Submit Delivery</h3>
        <p className="text-white/40 text-sm mb-5">Upload your work and add a message to the buyer.</p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">Message to Buyer</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Describe what you've delivered and any instructions…"
              className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-purple-400 transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">
              Delivery Files <span className="text-white/30 text-xs font-normal">(optional, up to 10)</span>
            </label>
            <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-white/10 cursor-pointer hover:border-purple-500/40 hover:bg-white/2 transition-all">
              <IoCloudUploadOutline className="text-2xl text-white/30" />
              <div>
                <p className="text-white/60 text-sm">Click to upload files</p>
                <p className="text-white/30 text-xs">{files.length} file{files.length !== 1 ? "s" : ""} selected</p>
              </div>
              <input type="file" multiple className="hidden" onChange={handleFiles} />
            </label>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-white/60 text-xs">
                    <IoAttachOutline />
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 ml-1">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:border-white/20 transition-all">
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            onClick={() => onSubmit({ message, files })}
            disabled={submitting || !message.trim()}
            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
            ) : (
              <><IoCloudUploadOutline className="text-base" /> Submit Delivery</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main component
const GigOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [submittingReq, setSubmittingReq] = useState(false);
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    fetchOrder();
  }, [id, cookies.access_token]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await getGigOrderDetail(cookies.access_token, id);
      setOrder(res.data);
    } catch {
      toast.error("Failed to load order details.");
      navigate("/gigs/orders");
    } finally {
      setLoading(false);
    }
  };

  const isBuyer = order?.is_buyer === true;
  const isSeller = order?.is_seller === true;

  const handleSubmitRequirements = async (answers) => {
    try {
      setSubmittingReq(true);
      await submitOrderRequirements(cookies.access_token, id, answers);
      toast.success("Requirements submitted! Your order is now in progress.");
      setShowRequirementsModal(false);
      fetchOrder();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit requirements.");
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleDeliver = async ({ message, files }) => {
    try {
      setSubmittingDelivery(true);
      await deliverOrder(cookies.access_token, id, { message, files });
      toast.success("Delivery submitted successfully!");
      setShowDeliveryModal(false);
      fetchOrder();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit delivery.");
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm("Accept this delivery and mark the order as complete?")) return;
    try {
      setActionLoading(true);
      await completeOrder(cookies.access_token, id);
      toast.success("Order completed! Payment released to seller.");
      fetchOrder();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to complete order.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      setActionLoading(true);
      await cancelOrder(cookies.access_token, id);
      toast.success("Order cancelled.");
      fetchOrder();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to cancel order.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenChat = async () => {
    if (!order) return;
    // buyer FK is user ID, seller_user_id is the seller's Django User ID
    const targetUserId = isBuyer ? order.seller_user_id : order.buyer;
    if (!targetUserId) {
      navigate("/gighub/messages");
      return;
    }
    try {
      const res = await createConversation(cookies.access_token, targetUserId);
      navigate(`/gighub/messages?conversation=${res.data.id}`);
    } catch {
      navigate("/gighub/messages");
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0a0a0f] min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.in_progress;
  const currentStepIdx = statusCfg.stepIndex;
  const images = order.gig?.media_files?.filter((m) => m.media_type === "image") || [];

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
          <Link to="/gighub/dashboard" className="hover:text-white/70 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link to="/gigs/orders" className="hover:text-white/70 transition-colors">Orders</Link>
          <span>/</span>
          <span className="text-white/70">Order #{order.id}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">{order.gig?.title || `Order #${order.id}`}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${statusCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              <span className="text-white/30 text-xs">Order #{order.id}</span>
              <span className="text-white/30 text-xs">
                {new Date(order.created_at).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
          <button
            onClick={handleOpenChat}
            className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-white/10 rounded-xl text-white/60 text-sm hover:border-white/20 transition-all"
          >
            <IoChatbubbleOutline />
            {isBuyer ? "Chat with Seller" : "Chat with Buyer"}
          </button>
        </div>

        {/* Progress Timeline */}
        {order.status !== "cancelled" && (
          <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5 mb-6">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Order Progress</p>
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                        i < currentStepIdx
                          ? "bg-gradient-to-r from-purple-600 to-pink-500 border-transparent text-white"
                          : i === currentStepIdx
                          ? "border-purple-500 text-white bg-purple-500/20"
                          : "border-white/10 text-white/20"
                      }`}
                    >
                      {i < currentStepIdx ? <IoCheckmarkCircle className="text-base" /> : step.icon}
                    </div>
                    <span className={`text-[10px] mt-1.5 whitespace-nowrap ${i === currentStepIdx ? "text-white/70" : "text-white/25"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-2 mb-4 transition-all ${i < currentStepIdx ? "bg-purple-500/60" : "bg-white/10"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT COL ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Gig info */}
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Gig Details</p>
              {images[0] && (
                <img src={images[0].file} alt={order.gig?.title} className="w-full h-48 object-cover rounded-xl mb-4" />
              )}
              <h3 className="text-white font-semibold text-base mb-2">{order.gig?.title}</h3>
              {order.gig?.description && (
                <p className="text-white/40 text-sm leading-relaxed line-clamp-3">{order.gig.description}</p>
              )}
              {order.package && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 capitalize">
                    {order.package.tier} Package
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 flex items-center gap-1">
                    <IoTimeOutline /> {order.package.delivery_days}d delivery
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 flex items-center gap-1">
                    <IoRefreshOutline /> {order.package.revisions} revisions
                  </span>
                </div>
              )}
            </div>

            {/* Requirements submitted */}
            {order.answers?.length > 0 && (
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Submitted Requirements</p>
                <div className="space-y-3">
                  {order.answers.map((ans, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-white/60 text-sm font-medium">{ans.requirement_question}</p>
                      <p className="text-white/40 text-sm bg-white/3 rounded-xl p-3">{ans.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deliveries */}
            {order.deliveries?.length > 0 && (
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Deliveries</p>
                <div className="space-y-4">
                  {order.deliveries.map((delivery, i) => (
                    <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs">Delivery #{i + 1}</span>
                        <span className="text-white/30 text-xs">
                          {new Date(delivery.delivered_at).toLocaleString()}
                        </span>
                      </div>
                      {delivery.message && (
                        <p className="text-white/70 text-sm leading-relaxed mb-3">{delivery.message}</p>
                      )}
                      {delivery.files?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {delivery.files.map((f, fi) => (
                            <a
                              key={fi}
                              href={f.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-xs hover:bg-white/10 transition-all"
                            >
                              <IoAttachOutline /> File {fi + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Actions</p>
              <div className="flex flex-wrap gap-3">
                {/* BUYER: submit requirements */}
                {isBuyer && order.status === "pending_requirements" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowRequirementsModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/20 transition-all"
                  >
                    <IoDocumentTextOutline /> Submit Requirements
                  </motion.button>
                )}

                {/* SELLER: deliver */}
                {isSeller && order.status === "in_progress" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeliveryModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-semibold hover:bg-purple-500/20 transition-all"
                  >
                    <IoCloudUploadOutline /> Submit Delivery
                  </motion.button>
                )}

                {/* BUYER: accept delivery */}
                {isBuyer && order.status === "delivered" && (
                  <motion.button
                    whileHover={{ scale: actionLoading ? 1 : 1.02 }}
                    whileTap={{ scale: actionLoading ? 1 : 0.98 }}
                    onClick={handleComplete}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? <span className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" /> : <IoCheckmarkCircle />}
                    Accept Delivery
                  </motion.button>
                )}

                {/* Cancel (buyer or seller for active orders) */}
                {["pending_requirements", "in_progress"].includes(order.status) && (
                  <motion.button
                    whileHover={{ scale: actionLoading ? 1 : 1.02 }}
                    whileTap={{ scale: actionLoading ? 1 : 0.98 }}
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <IoCloseCircle />}
                    Cancel Order
                  </motion.button>
                )}

                {order.status === "completed" && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    <IoCheckmarkCircle />
                    Order Completed
                  </div>
                )}

                {order.status === "cancelled" && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <IoCloseCircle />
                    Order Cancelled
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COL ── */}
          <div className="space-y-4">
            {/* Price breakdown */}
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Price Breakdown</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Gig Price</span>
                  <span>${parseFloat(order.gig_price || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/40 text-xs">
                  <span>Buyer Fee (5%)</span>
                  <span>${parseFloat(order.buyer_fee || 0).toFixed(2)}</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex justify-between text-white font-bold">
                  <span>Total Paid</span>
                  <span>${parseFloat(order.total_price || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Seller info */}
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
                {isBuyer ? "Seller" : "Buyer"}
              </p>
              <div className="flex items-center gap-3">
                {order.seller?.profile_picture && isBuyer ? (
                  <img src={order.seller_profile_picture} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold uppercase">
                    {(isBuyer ? order.seller_username : order.buyer_username)?.[0] || "?"}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm">
                    {isBuyer ? order.seller_username : order.buyer_username}
                  </p>
                  {isBuyer && order.gig?.worker?.rating && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <IoStarSharp className="text-yellow-400 text-xs" />
                      <span className="text-white/50 text-xs">{order.gig.worker.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery info */}
            {order.expected_delivery_date && (
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Delivery Info</p>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <IoTimeOutline className="text-purple-400 text-base" />
                  <span>Due: {new Date(order.expected_delivery_date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>
            )}

            {/* Trust indicators */}
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
              <div className="space-y-2">
                {[
                  { icon: <IoShieldCheckmarkOutline className="text-green-400" />, text: "Secure payment via Stripe" },
                  { icon: <IoCheckmarkCircle className="text-blue-400" />, text: "Money-back guarantee" },
                  { icon: <IoAlertCircleOutline className="text-yellow-400" />, text: "Dispute resolution available" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/40 text-xs">
                    {item.icon}
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* View gig link */}
            {order.gig?.id && (
              <Link
                to={`/gigs/${order.gig.id}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-all"
              >
                <FaBriefcase /> View Gig
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showRequirementsModal && (
          <RequirementsModal
            order={order}
            onClose={() => setShowRequirementsModal(false)}
            onSubmit={handleSubmitRequirements}
            submitting={submittingReq}
          />
        )}
        {showDeliveryModal && (
          <DeliveryModal
            onClose={() => setShowDeliveryModal(false)}
            onSubmit={handleDeliver}
            submitting={submittingDelivery}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GigOrderDetail;
