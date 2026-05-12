import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { authContext } from "../../context/authContext";
import { useInAppWallet } from "../../context/inAppWalletContext";
import {
  getGigOrderDetail,
  submitOrderRequirements,
  deliverOrder,
  completeOrder,
  cancelOrder,
  createConversation,
  setGigOrderEscrowId,
  disputeOrder,
} from "../../api/gigs";
import InAppWalletBalanceCard from "../../components/gigs/InAppWalletBalanceCard";
import WalletTxHistoryCard from "../../components/gigs/WalletTxHistoryCard";
import ServiceReviewMatrix, {
  defaultServiceScores,
  defaultUnhappyServiceScores,
} from "../../components/gigs/ServiceReviewMatrix";
import ServicesFinalSliceBreakdown from "../../components/gigs/ServicesFinalSliceBreakdown";
import {
  createServicesEscrowForGigOrder,
  setEscrowIdForOrder,
} from "../../lib/gighubEscrowFlow";
import { getGigHubContracts, getGigHubProvider } from "../../lib/gighubEscrowClient";
import { servicesGates } from "../../lib/servicesEscrowFlowGates";
import {
  servicesFinalReviewMsgValue,
  servicesFinalSatisfactionBreakdown,
  servicesProtocolFeeWei,
  servicesSellerNetAfterFeeWei,
  servicesWeightedOverallStars,
} from "../../lib/servicesEscrowMath";
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
  IoWalletOutline,
} from "react-icons/io5";
import { FaBriefcase } from "react-icons/fa";

const STATUS_STEPS = [
  { key: "pending_payment", label: "Payment", icon: <IoWalletOutline className="text-base" /> },
  { key: "pending_requirements", label: "Requirements", icon: <IoDocumentTextOutline className="text-base" /> },
  { key: "in_progress", label: "In Progress", icon: <IoTimeOutline className="text-base" /> },
  { key: "delivered", label: "Delivered", icon: <IoCloudUploadOutline className="text-base" /> },
  { key: "completed", label: "Completed", icon: <IoCheckmarkCircle className="text-base" /> },
];

const STATUS_CONFIG = {
  pending_payment: {
    label: "Awaiting Payment",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    dot: "bg-amber-400",
    stepIndex: 0,
  },
  pending_requirements: {
    label: "Awaiting Requirements",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    dot: "bg-yellow-400",
    stepIndex: 1,
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    dot: "bg-blue-400",
    stepIndex: 2,
  },
  delivered: {
    label: "Delivered - Review Required",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    dot: "bg-purple-400",
    stepIndex: 3,
  },
  completed: {
    label: "Completed",
    color: "text-green-400 bg-green-500/10 border-green-500/30",
    dot: "bg-green-400",
    stepIndex: 4,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    dot: "bg-red-400",
    stepIndex: -1,
  },
  disputed: {
    label: "Disputed",
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    dot: "bg-red-400",
    stepIndex: 3,
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

// Dispute Modal (for buyer)
const DisputeModal = ({ onClose, onSubmit, submitting }) => {
  const [reason, setReason] = useState("");

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
        <h3 className="text-white font-bold text-lg mb-1 text-red-400">Raise a Dispute</h3>
        <p className="text-white/40 text-sm mb-5">Please detail your complaint. This will be sent directly to admin for review.</p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">Reason for Dispute</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              placeholder="Explain what is wrong with the delivery..."
              className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-red-400 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:border-white/20 transition-all">
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            onClick={() => onSubmit(reason)}
            disabled={submitting || reason.trim().length < 10}
            className="flex-[2] py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500/30 disabled:opacity-50 transition-all"
          >
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />Submitting…</>
            ) : (
              "Submit Dispute"
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
  const { wallet: inAppWallet, address: inAppAddress } = useInAppWallet();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [submittingReq, setSubmittingReq] = useState(false);
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [escrowId, setEscrowId] = useState("");
  const [escrowState, setEscrowState] = useState(null);
  const [pendingBuyer, setPendingBuyer] = useState("0.0000");
  const [pendingSeller, setPendingSeller] = useState("0.0000");
  const [chainBusy, setChainBusy] = useState(false);
  const [midwayScores, setMidwayScores] = useState(() => defaultServiceScores());
  const [finalScores, setFinalScores] = useState(() => defaultServiceScores());
  const [finalUnhappyScores, setFinalUnhappyScores] = useState(() => defaultUnhappyServiceScores());
  const [disputeEth, setDisputeEth] = useState("0.01");
  const [resolveBuyerEth, setResolveBuyerEth] = useState("0");
  const [resolveSellerEth, setResolveSellerEth] = useState("0");
  const [creatingEscrow, setCreatingEscrow] = useState(false);
  const [lastEscrowSyncAt, setLastEscrowSyncAt] = useState("");
  const [escrowDetails, setEscrowDetails] = useState(null);

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
      setEscrowId(res.data.escrow_id || "");
    } catch {
      toast.error("Failed to load order details.");
      navigate("/gigs/orders");
    } finally {
      setLoading(false);
    }
  };

  const isBuyer = order?.is_buyer === true;
  const isSeller = order?.is_seller === true;
  const isRequirementsPending = order?.status === "pending_requirements";
  const isEscrowFinalizeReached = Boolean(escrowState?.[12]) && (Boolean(escrowState?.[10]) || Boolean(escrowState?.[13]));
  // Force mutually-exclusive control visibility for escrow actions.
  const showBuyerControls = isBuyer;
  const showSellerControls = !isBuyer && isSeller;
  const gates = servicesGates(escrowState);
  const gateBody = (key, base) => {
    const x = gates?.[key];
    if (!x) return base;
    if (x.done && x.labelDone) return `${base} - ${x.labelDone}`;
    if (!x.enabled && x.labelBlocked) return `${base} - ${x.labelBlocked}`;
    return base;
  };

  const refreshEscrow = async () => {
    if (!inAppWallet || !escrowId) return;
    try {
      const provider = getGigHubProvider();
      const signer = inAppWallet.connect(provider);
      const { services } = await getGigHubContracts({ signer });
      const state = await services.getEscrowState(escrowId);
      setEscrowState(state);
      try {
        const row = await services.escrows(escrowId);
        setEscrowDetails(row);
      } catch {
        setEscrowDetails(null);
      }
      const pb = await services.pendingWithdrawals(state.buyer);
      const ps = await services.pendingWithdrawals(state.seller);
      setPendingBuyer(Number(ethers.formatEther(pb)).toFixed(4));
      setPendingSeller(Number(ethers.formatEther(ps)).toFixed(4));
      setLastEscrowSyncAt(new Date().toLocaleTimeString());
    } catch {
      setEscrowState(null);
      setEscrowDetails(null);
    }
  };

  useEffect(() => {
    refreshEscrow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escrowId, inAppWallet]);

  useEffect(() => {
    if (!escrowId || !inAppWallet) return undefined;
    const t = setInterval(() => {
      if (!chainBusy) refreshEscrow();
    }, 7000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escrowId, inAppWallet, chainBusy]);

  // NOTE: We intentionally DO NOT auto-discover escrows from global chain logs here.
  // It caused old escrows to bleed into new orders in local/dev testing.
  // Escrow link must come from explicit Create&Link or manual Save Link for this order.

  useEffect(() => {
    setMidwayScores(defaultServiceScores());
    setFinalScores(defaultServiceScores());
    setFinalUnhappyScores(defaultUnhappyServiceScores());
  }, [escrowId]);

  const runServices = async (fn, args = [], valueWei = 0n) => {
    if (!inAppWallet || !escrowId) {
      toast.error("Wallet or escrow id missing.");
      return;
    }
    try {
      setChainBusy(true);
      const provider = getGigHubProvider();
      const signer = inAppWallet.connect(provider);
      const signerAddress = (await signer.getAddress()).toLowerCase();
      const { services } = await getGigHubContracts({ signer });
      const state = escrowState || (await services.getEscrowState(escrowId));
      const escrowBuyer = state?.buyer ? String(state.buyer).toLowerCase() : "";
      const escrowSeller = state?.seller ? String(state.seller).toLowerCase() : "";

      const buyerFns = new Set([
        "releaseDeposit",
        "submitMidwayReview",
        "releaseCompletion",
        "submitFinalReview",
        "openDispute",
        "cancelExpiredEscrow",
      ]);
      const sellerFns = new Set(["completeMilestone"]);

      if (buyerFns.has(fn) && escrowBuyer && signerAddress !== escrowBuyer) {
        toast.error(`Wrong wallet for ${fn}. Connected ${signerAddress.slice(0, 8)}... but escrow buyer is ${escrowBuyer.slice(0, 8)}...`);
        setChainBusy(false);
        return;
      }
      if (sellerFns.has(fn) && escrowSeller && signerAddress !== escrowSeller) {
        toast.error(`Wrong wallet for ${fn}. Connected ${signerAddress.slice(0, 8)}... but escrow seller is ${escrowSeller.slice(0, 8)}...`);
        setChainBusy(false);
        return;
      }
      const tx =
        valueWei > 0n
          ? await services[fn](escrowId, ...args, { value: valueWei })
          : await services[fn](escrowId, ...args);
      await tx.wait();
      toast.success(`${fn} confirmed.`);
      await refreshEscrow();
    } catch (e) {
      toast.error(e?.shortMessage || e?.message || `${fn} failed`);
    } finally {
      setChainBusy(false);
    }
  };

  const runWithdraw = async () => {
    if (!inAppWallet) return;
    try {
      setChainBusy(true);
      const provider = getGigHubProvider();
      const signer = inAppWallet.connect(provider);
      const { services } = await getGigHubContracts({ signer });
      const tx = await services.withdraw();
      await tx.wait();
      toast.success("withdraw confirmed.");
      await refreshEscrow();
    } catch (e) {
      toast.error(e?.shortMessage || e?.message || "withdraw failed");
    } finally {
      setChainBusy(false);
    }
  };

  const escrowAmountWei = escrowState?.[2] ? BigInt(escrowState[2]) : 0n;
  const breakdownBasisWei =
    escrowDetails?.amount !== undefined && escrowDetails.amount != null ? BigInt(escrowDetails.amount) : escrowAmountWei;

  const projectedFinalBreakdown = useMemo(
    () =>
      servicesFinalSatisfactionBreakdown(
        breakdownBasisWei,
        finalScores.respect,
        finalScores.comm,
        finalScores.timeliness,
        finalScores.quality
      ),
    [breakdownBasisWei, finalScores.respect, finalScores.comm, finalScores.timeliness, finalScores.quality]
  );

  const sellerFinalBreakdown = useMemo(() => {
    if (!escrowState?.[12] || !escrowDetails) return null;
    const amt = escrowDetails.amount != null ? BigInt(escrowDetails.amount) : 0n;
    if (amt <= 0n) return null;
    return servicesFinalSatisfactionBreakdown(
      amt,
      Number(escrowDetails.finalRespect),
      Number(escrowDetails.finalComm),
      Number(escrowDetails.finalTimeliness),
      Number(escrowDetails.finalQuality)
    );
  }, [escrowState, escrowDetails]);

  const connectedLower = (inAppAddress || "").toLowerCase();
  const escrowBuyerLower = escrowState?.buyer ? String(escrowState.buyer).toLowerCase() : "";
  const escrowSellerLower = escrowState?.seller ? String(escrowState.seller).toLowerCase() : "";
  const roleWalletMismatch =
    (showBuyerControls && escrowBuyerLower && connectedLower && connectedLower !== escrowBuyerLower) ||
    (showSellerControls && escrowSellerLower && connectedLower && connectedLower !== escrowSellerLower);
  const finalHappyOverall = servicesWeightedOverallStars(
    finalScores.respect,
    finalScores.comm,
    finalScores.timeliness,
    finalScores.quality
  );
  const finalHappyValueWei = servicesFinalReviewMsgValue(
    escrowAmountWei,
    finalScores.respect,
    finalScores.comm,
    finalScores.timeliness,
    finalScores.quality
  );
  const finalUnhappyValueWei = servicesFinalReviewMsgValue(
    escrowAmountWei,
    finalUnhappyScores.respect,
    finalUnhappyScores.comm,
    finalUnhappyScores.timeliness,
    finalUnhappyScores.quality
  );
  const depositGrossWei = escrowAmountWei > 0n ? (escrowAmountWei * 2000n) / 7000n : 0n;
  const halfwayGrossWei = escrowAmountWei > 0n ? (escrowAmountWei * 2500n) / 7000n : 0n;
  const completionGrossWei = escrowAmountWei > 0n ? (escrowAmountWei * 2500n) / 7000n : 0n;
  const platformDepositWei = servicesProtocolFeeWei(depositGrossWei);
  const platformHalfwayWei = servicesProtocolFeeWei(halfwayGrossWei);
  const platformCompletionWei = servicesProtocolFeeWei(completionGrossWei);
  const platformFinalHappyWei = servicesProtocolFeeWei(finalHappyValueWei);
  const sellerDepositNetWei = servicesSellerNetAfterFeeWei(depositGrossWei);
  const sellerHalfwayNetWei = servicesSellerNetAfterFeeWei(halfwayGrossWei);
  const sellerCompletionNetWei = servicesSellerNetAfterFeeWei(completionGrossWei);
  const sellerFinalHappyNetWei = servicesSellerNetAfterFeeWei(finalHappyValueWei);
  const finalReviewInfoText = `Seller net about ${Number(ethers.formatEther(sellerFinalHappyNetWei)).toFixed(4)} ETH on this slice after ~4% platform fee on gross. Timeliness 1–2 or 3 first shrinks gross (see numbered breakdown below).`;

  const runResolveDispute = async () => {
    if (!inAppWallet || !escrowId) return;
    try {
      setChainBusy(true);
      const provider = getGigHubProvider();
      const signer = inAppWallet.connect(provider);
      const { services } = await getGigHubContracts({ signer });
      const toBuyer = ethers.parseEther(resolveBuyerEth || "0");
      const toSeller = ethers.parseEther(resolveSellerEth || "0");
      const tx = await services.resolveDispute(escrowId, toBuyer, toSeller, { value: toBuyer + toSeller });
      await tx.wait();
      toast.success("resolveDispute confirmed.");
      await refreshEscrow();
    } catch (e) {
      toast.error(e?.shortMessage || e?.message || "resolveDispute failed");
    } finally {
      setChainBusy(false);
    }
  };

  const handleCreateAndLinkEscrow = async () => {
    if (!showBuyerControls) {
      toast.error("Only buyer can create escrow for this order.");
      return;
    }
    if (!order || !inAppWallet) {
      toast.error("Connect in-app wallet first.");
      return;
    }
    try {
      setCreatingEscrow(true);
      const sellerAddress = order?.seller_wallet_address || "";
      if (!sellerAddress) {
        throw new Error("Seller has no in-app wallet yet. Seller must create/import wallet first.");
      }
      const { escrowId: createdEscrowId } = await createServicesEscrowForGigOrder({
        order,
        gig: order?.gig,
        wallet: inAppWallet,
        sellerAddress,
      });
      setEscrowId(createdEscrowId);
      setEscrowIdForOrder(order.id, createdEscrowId);
      await setGigOrderEscrowId(cookies.access_token, order.id, createdEscrowId);
      toast.success("Escrow created and linked to this order.");
      await refreshEscrow();
    } catch (e) {
      toast.error(e?.shortMessage || e?.message || "Escrow creation failed");
    } finally {
      setCreatingEscrow(false);
    }
  };

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

  const handleDispute = async (reason) => {
    try {
      setSubmittingDispute(true);
      await disputeOrder(cookies.access_token, id, reason);
      toast.success("Dispute raised successfully. Admin will review your case.");
      setShowDisputeModal(false);
      fetchOrder();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit dispute.");
    } finally {
      setSubmittingDispute(false);
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

            {/* Services Workspace (frontend-test style) */}
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Services Workspace</p>
              {isRequirementsPending ? (
                <div className="space-y-2">
                  <p className="text-yellow-300/90 text-sm">
                    Submit requirements first. Escrow creation and milestone/review controls appear after order moves to In Progress.
                  </p>
                </div>
              ) : !escrowId ? (
                <div className="space-y-2">
                  <p className="text-white/45 text-sm">
                    No escrow linked for this order yet. Create it now (recommended) or add a reference manually on the right.
                  </p>
                  <button
                    onClick={handleCreateAndLinkEscrow}
                    disabled={creatingEscrow || !inAppWallet}
                    className="px-3 py-2 rounded-lg bg-purple-500/15 border border-purple-500/35 text-purple-200 text-xs disabled:opacity-50"
                  >
                    {creatingEscrow ? "Creating escrow..." : "Create & link Services escrow"}
                  </button>
                </div>
              ) : !escrowState?.[0] ? (
                <div className="space-y-2">
                  <p className="text-yellow-300/80 text-sm">
                    Escrow reference is set but no contract state found on current router/RPC.
                  </p>
                  <button
                    onClick={() => {
                      setEscrowId("");
                      if (order?.id) {
                        setEscrowIdForOrder(order.id, "");
                        setGigOrderEscrowId(cookies.access_token, order.id, "").catch(() => {});
                      }
                      toast.info("Cleared stale escrow link for this order.");
                    }}
                    className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs"
                  >
                    Clear stale escrow link
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {roleWalletMismatch && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                      Connected wallet does not match this role's escrow participant address. Switch/import the correct wallet
                      for this account to see accurate receive/withdraw state.
                    </div>
                  )}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <h4 className="text-white/80 text-sm font-semibold mb-2">Progress checklist</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/60">
                      <span>Milestones done: {String(escrowState[6])} / {String(escrowState[5])}</span>
                      <span>Deposit released: {escrowState[7] ? "Yes" : "No"}</span>
                      <span>Halfway released: {escrowState[8] ? "Yes" : "No"}</span>
                      <span>Completion released: {escrowState[9] ? "Yes" : "No"}</span>
                      <span>Midway reviewed: {escrowState[11] ? "Yes" : "No"}</span>
                      <span>Final reviewed: {escrowState[12] ? "Yes" : "No"}</span>
                      <span>Disputed: {escrowState[13] ? "Yes" : "No"}</span>
                      <span>Buyer pending: {pendingBuyer} ETH | Seller pending: {pendingSeller} ETH</span>
                      <span>Escrow buyer: {escrowState?.buyer ? `${String(escrowState.buyer).slice(0, 10)}...` : "-"}</span>
                      <span>Escrow seller: {escrowState?.seller ? `${String(escrowState.seller).slice(0, 10)}...` : "-"}</span>
                      <span>Synced: {lastEscrowSyncAt || "just now"}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <h4 className="text-white/80 text-sm font-semibold mb-2">Projected payout model (with 4% platform fee)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/60">
                      <span>Deposit gross: {Number(ethers.formatEther(depositGrossWei)).toFixed(4)} ETH</span>
                      <span>Seller net deposit: {Number(ethers.formatEther(sellerDepositNetWei)).toFixed(4)} ETH</span>
                      <span>Halfway gross: {Number(ethers.formatEther(halfwayGrossWei)).toFixed(4)} ETH</span>
                      <span>Seller net halfway: {Number(ethers.formatEther(sellerHalfwayNetWei)).toFixed(4)} ETH</span>
                      <span>Completion gross: {Number(ethers.formatEther(completionGrossWei)).toFixed(4)} ETH</span>
                      <span>Seller net completion: {Number(ethers.formatEther(sellerCompletionNetWei)).toFixed(4)} ETH</span>
                      <span>Final gross (current review): {Number(ethers.formatEther(finalHappyValueWei)).toFixed(4)} ETH</span>
                      <span>Seller net final: {Number(ethers.formatEther(sellerFinalHappyNetWei)).toFixed(4)} ETH</span>
                      <span>Platform cut (deposit+halfway+completion): {Number(ethers.formatEther(platformDepositWei + platformHalfwayWei + platformCompletionWei)).toFixed(4)} ETH</span>
                      <span>Platform cut (final current): {Number(ethers.formatEther(platformFinalHappyWei)).toFixed(4)} ETH</span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-2">
                      Gross = released by escrow step, Seller net = after protocol fee. Released amounts may stay under pending withdrawals
                      until the participant runs withdraw.
                    </p>
                  </div>

                  {showBuyerControls && (
                    <div className="space-y-2">
                      <h4 className="text-white/80 text-sm font-semibold">Client actions</h4>
                      <p className="text-[11px] text-white/45">
                        Simple flow: release kickoff payment → freelancer marks milestones → submit midway review → release
                        completion → submit final review.
                      </p>
                      <button disabled={chainBusy || !gates?.releaseDeposit?.enabled} onClick={() => runServices("releaseDeposit")} className="w-full px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs disabled:opacity-50">
                        Release kickoff payment to freelancer
                      </button>
                      <p className="text-[11px] text-white/45">{gateBody("releaseDeposit", "First slice so they can start.")}</p>

                      <ServiceReviewMatrix id="midway-main" title="Midway review (1-7 each)" values={midwayScores} onChange={setMidwayScores} disabled={chainBusy || !gates?.submitMidwayReview?.enabled} />
                      <button disabled={chainBusy || !gates?.submitMidwayReview?.enabled} onClick={() => runServices("submitMidwayReview", [midwayScores.respect, midwayScores.comm, midwayScores.timeliness, midwayScores.quality])} className="w-full px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs disabled:opacity-50">
                        Submit midway review on-chain
                      </button>
                      <p className="text-[11px] text-white/45">{gateBody("submitMidwayReview", "After half the milestones are done.")}</p>

                      <button disabled={chainBusy || !gates?.releaseCompletion?.enabled} onClick={() => runServices("releaseCompletion")} className="w-full px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs disabled:opacity-50">
                        Release completion payment
                      </button>
                      <p className="text-[11px] text-white/45">{gateBody("releaseCompletion", "After all milestones are marked done.")}</p>

                      <ServiceReviewMatrix
                        id="final-happy-main"
                        title="Final review (client - workflow bands)"
                        values={finalScores}
                        onChange={setFinalScores}
                        disabled={chainBusy || !gates?.submitFinalReview?.enabled}
                      />
                      <button
                        disabled={chainBusy || !gates?.submitFinalReview?.enabled}
                        onClick={() =>
                          runServices(
                            "submitFinalReview",
                            [finalScores.respect, finalScores.comm, finalScores.timeliness, finalScores.quality],
                            finalHappyValueWei
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-xs disabled:opacity-50"
                      >
                        {finalHappyOverall <= 2
                          ? "Submit final review (0 ETH - dispute path)"
                          : "Submit final review + satisfaction payment"}
                      </button>
                      <p className="text-[11px] text-white/45">
                        {gateBody(
                          "submitFinalReview",
                          finalHappyOverall <= 2
                            ? `Overall ${finalHappyOverall}*: sends 0 ETH; use dispute path if needed.`
                            : `Sends ${Number(ethers.formatEther(finalHappyValueWei)).toFixed(4)} ETH with final review.`
                        )}
                      </p>
                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2 text-[11px] text-white/55">
                        <p>
                          Final satisfaction score uses weighted percentages:
                          Respect 10% + Communication 5% + Timeliness 30% + Quality 55%.
                        </p>
                        <p className="mt-1">
                          Contract workflow then applies: 70% from (Respect/Communication/Quality blend) and 30% from Timeliness.
                        </p>
                        <p className="mt-1 text-amber-200/90">
                          If final satisfaction score is low (especially 1-2 stars), final payout can be reduced or zero. In that case,
                          start dispute review from Edge cases → Open Dispute.
                        </p>
                      </div>
                      {breakdownBasisWei > 0n && (
                        <ServicesFinalSliceBreakdown
                          breakdown={projectedFinalBreakdown}
                          viewer="buyer"
                          satisfactionReleased={Boolean(escrowState?.[10])}
                        />
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-white/45">
                        <button
                          type="button"
                          title={finalReviewInfoText}
                          className="w-4 h-4 rounded-full border border-white/20 text-white/70 flex items-center justify-center text-[10px]"
                        >
                          i
                        </button>
                        <span>{finalReviewInfoText}</span>
                      </div>

                      <button
                        disabled={chainBusy}
                        onClick={runWithdraw}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs disabled:opacity-50"
                      >
                        Move money to my wallet (client)
                      </button>

                      <details className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                        <summary className="text-xs text-white/70 cursor-pointer">Edge cases & testing</summary>
                        <div className="space-y-2 mt-2">
                          <ServiceReviewMatrix
                            id="final-unhappy-main"
                            title="Final review - unhappy (test path)"
                            values={finalUnhappyScores}
                            onChange={setFinalUnhappyScores}
                            disabled={chainBusy || !gates?.submitFinalReview?.enabled}
                          />
                          <button
                            disabled={chainBusy || !gates?.submitFinalReview?.enabled}
                            onClick={() =>
                              runServices(
                                "submitFinalReview",
                                [
                                  finalUnhappyScores.respect,
                                  finalUnhappyScores.comm,
                                  finalUnhappyScores.timeliness,
                                  finalUnhappyScores.quality,
                                ],
                                finalUnhappyValueWei
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs disabled:opacity-50"
                          >
                            {finalUnhappyValueWei === 0n
                              ? "Submit low final review (0 ETH)"
                              : "Submit final review (sends satisfaction slice)"}
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={disputeEth}
                              onChange={(e) => setDisputeEth(e.target.value)}
                              className="bg-[#1a1a24] border border-white/10 rounded-lg px-2 py-1.5 text-white text-[11px]"
                              placeholder="Dispute ETH"
                            />
                            <button
                              disabled={chainBusy || !gates?.openDispute?.enabled}
                              onClick={() => runServices("openDispute", [ethers.parseEther(disputeEth || "0")])}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs disabled:opacity-50"
                            >
                              Open Dispute
                            </button>
                          </div>
                          <p className="text-[11px] text-white/45">{gateBody("openDispute", "Client only; unhappy path.")}</p>
                          <button
                            disabled={chainBusy || !gates?.cancelExpiredEscrow?.enabled}
                            onClick={() => runServices("cancelExpiredEscrow")}
                            className="w-full px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs disabled:opacity-50"
                          >
                            Cancel if job expired
                          </button>
                          <p className="text-[11px] text-white/45">{gateBody("cancelExpiredEscrow", "Use after deadlines/grace.")}</p>
                        </div>
                      </details>
                    </div>
                  )}

                  {showSellerControls && (
                    <div className="space-y-2">
                      <h4 className="text-white/80 text-sm font-semibold">Freelancer actions</h4>
                      <p className="text-[11px] text-white/45">
                        Milestones unlock step-by-step. If blocked, read the line below each button for what to do next.
                      </p>
                      {escrowState?.[12] && sellerFinalBreakdown && (
                        <ServicesFinalSliceBreakdown
                          breakdown={sellerFinalBreakdown}
                          viewer="seller"
                          satisfactionReleased={Boolean(escrowState?.[10])}
                        />
                      )}
                      {escrowState?.[12] && !sellerFinalBreakdown && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-100/95">
                          Final review is recorded on-chain, but this app couldn&apos;t load full row data (refresh the page or redeploy contracts
                          to match ABI). Pending seller balance above still reflects credits.
                        </div>
                      )}
                      {!escrowState?.[12] && escrowAmountWei > 0n && (
                        <p className="text-[11px] text-white/45 rounded-lg border border-white/10 bg-white/[0.02] p-2">
                          When the client submits the final review, a step-by-step breakdown appears here (30% slice, timeliness deduction if any,
                          4% platform fee on gross, your net credit).
                        </p>
                      )}
                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2 text-[11px] text-white/55">
                        <p>
                          Final satisfaction scoring (buyer review) weights are: Respect 10% + Communication 5% + Timeliness 30% + Quality 55%.
                        </p>
                        <p className="mt-1">
                          Workflow applies 70% from RCQ blend and 30% from Timeliness. Low final scores can reduce or block final payout.
                        </p>
                        <p className="mt-1 text-amber-200/90">
                          If outcome is unfair, use dispute workflow with buyer/admin to settle pending amount.
                        </p>
                      </div>
                      {Array.from({ length: Number(escrowState?.[5] || 0) }).map((_, i) => {
                        const key = `completeMilestone${i}`;
                        return (
                          <div key={key}>
                            <button disabled={chainBusy || !gates?.[key]?.enabled} onClick={() => runServices("completeMilestone", [i])} className="w-full px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs disabled:opacity-50">
                              Mark milestone {i + 1} as done
                            </button>
                            <p className="text-[11px] text-white/45 mt-1">{gateBody(key, `Complete slice ${i + 1} in order.`)}</p>
                          </div>
                        );
                      })}
                      <button
                        disabled={chainBusy}
                        onClick={runWithdraw}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs disabled:opacity-50"
                      >
                        Move earnings to my wallet
                      </button>
                    </div>
                  )}

                  {isBuyer && order.status === "delivered" && isEscrowFinalizeReached && (
                    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3">
                      <p className="text-[12px] text-green-200 mb-2">
                        Escrow final stage is done. You can now mark this order as completed in app.
                      </p>
                      <button
                        onClick={handleComplete}
                        disabled={actionLoading}
                        className="px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-200 text-xs disabled:opacity-50"
                      >
                        {actionLoading ? "Completing..." : "Mark order done"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

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
                  <div className="w-full mb-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-400/80 text-xs flex items-start gap-2">
                    <IoAlertCircleOutline className="text-base flex-shrink-0 mt-0.5" />
                    <p>Please review your delivery. If no action is taken within 3 days, this order will be automatically accepted.</p>
                  </div>
                )}
                {isBuyer && order.status === "delivered" && (
                  <>
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
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDisputeModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all"
                    >
                      <IoAlertCircleOutline />
                      Raise Dispute
                    </motion.button>
                  </>
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
                
                {order.status === "disputed" && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <IoAlertCircleOutline />
                    Order Disputed - Under Admin Review
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COL ── */}
          <div className="space-y-4">
            <InAppWalletBalanceCard compact />
            <WalletTxHistoryCard
              address={inAppAddress}
              escrowId={escrowId}
              orderScoped
              title={isBuyer ? "Buyer Wallet Transactions" : "Seller Wallet Transactions"}
            />
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Services Escrow (On-chain)</p>
              <div className="space-y-2">
                <input
                  value={escrowId}
                  onChange={(e) => setEscrowId(e.target.value.trim())}
                  placeholder="0x... escrowId (bytes32)"
                  className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-purple-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (order?.id && escrowId) {
                        setEscrowIdForOrder(order.id, escrowId);
                        setGigOrderEscrowId(cookies.access_token, order.id, escrowId).catch(() => {});
                        toast.success("Escrow id linked to order.");
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs hover:bg-white/10"
                  >
                    Save Link
                  </button>
                  <button
                    onClick={refreshEscrow}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs hover:bg-white/10"
                  >
                    Refresh
                  </button>
                </div>
                {escrowState && (
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[11px] text-white/45 mb-1">Progress checklist</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-white/55">
                      <span>Milestones done: {Number(escrowState[6])}/{Number(escrowState[5])}</span>
                      <span>Released to seller: {Number(ethers.formatEther(escrowState[4])).toFixed(4)} ETH</span>
                      <span>Deposit released: {escrowState[7] ? "Yes" : "No"}</span>
                      <span>Midway review: {escrowState[11] ? "Done" : "Pending"}</span>
                      <span>Completion released: {escrowState[9] ? "Yes" : "No"}</span>
                      <span>Final review: {escrowState[12] ? "Done" : "Pending"}</span>
                      <span>Disputed: {escrowState[13] ? "Yes" : "No"}</span>
                      <span>Satisfaction finalized: {escrowState[10] ? "Yes" : "No"}</span>
                      <span>Buyer pending: {pendingBuyer} ETH</span>
                      <span>Seller pending: {pendingSeller} ETH</span>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-white/45 border-t border-white/5 pt-2">
                  Contract actions are shown only in the main <strong>Services Workspace</strong> panel on the left.
                </p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Price Breakdown</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Gig Price</span>
                  <span>${parseFloat(order.gig_price || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/40 text-xs">
                  <span>Marketplace Fee (5%)</span>
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
                  { icon: <IoShieldCheckmarkOutline className="text-green-400" />, text: "Secure payment via Square" },
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
        {showDisputeModal && (
          <DisputeModal
            onClose={() => setShowDisputeModal(false)}
            onSubmit={handleDispute}
            submitting={submittingDispute}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GigOrderDetail;
