import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { IoArrowBack, IoTimeOutline } from "react-icons/io5";
import { FaGavel } from "react-icons/fa";
import { getRequestDetail } from "../../api/buyerRequests";
import OfferCard, { sortOffers } from "../../components/requests/OfferCard";
import { useAccessToken } from "../../hooks/useAccessToken";
import { useAcceptOffer } from "../../hooks/useAcceptOffer";
import { formatMoney } from "../../utils/formatMoney";
import { conditionLabel } from "../../utils/requestLabels";

const STATUS_TEXT = {
  OPEN: "Open: vendors can send offers",
  EVALUATING: "Reviewing offers",
  AWARDED: "Offer accepted",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

function Fact({ label, value }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <p className="text-white/40 text-xs">{label}</p>
      <p className="text-white font-semibold text-sm mt-0.5 break-words">{value}</p>
    </div>
  );
}

/** One product request ("bid") with every vendor offer, cheapest first (retest N2.3). */
export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const accessToken = useAccessToken();
  const [req, setReq] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | missing | error

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await getRequestDetail(accessToken, id);
      setReq(res.data);
      setState("ready");
    } catch (err) {
      setState(err?.response?.status === 404 ? "missing" : "error");
    }
  }, [accessToken, id]);

  useEffect(() => {
    if (!accessToken) {
      navigate("/signin");
      return;
    }
    load();
  }, [accessToken, load, navigate]);

  const { accept, accepting } = useAcceptOffer(accessToken, load);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex justify-center pt-24">
        <span className="w-8 h-8 border-2 border-white/20 border-t-pink-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (state !== "ready" || !req) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] px-4 pt-24 text-center">
        <p className="text-white/60">
          {state === "missing"
            ? "This request doesn't exist or isn't yours."
            : "Couldn't load this request."}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          {state === "error" && (
            <button
              type="button"
              onClick={load}
              className="text-pink-400 underline underline-offset-4 text-sm"
            >
              Try again
            </button>
          )}
          <Link to="/my-bids" className="text-pink-400 underline underline-offset-4 text-sm">
            Back to My Bids
          </Link>
        </div>
      </div>
    );
  }

  const quantity = req.quantity || 1;
  const { sorted, lowestId } = sortOffers(req.bids, quantity);
  const images = [req.image1, req.image2, req.image3, req.image4].filter(Boolean);
  const open = ["OPEN", "EVALUATING"].includes(req.status);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to="/my-bids"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
        >
          <IoArrowBack /> My Bids
        </Link>

        <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
          <p className="text-xs font-semibold text-pink-300">
            {STATUS_TEXT[req.status] || req.status}
          </p>
          <h1 className="text-white text-xl sm:text-2xl font-bold mt-1 break-words">{req.title}</h1>
          {req.description && (
            <p className="text-white/60 text-sm mt-2 whitespace-pre-line">{req.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            <Fact label="Budget per item" value={`$${formatMoney(req.budget)}`} />
            <Fact label="Quantity" value={quantity} />
            <Fact label="Condition" value={conditionLabel(req.condition)} />
            <Fact label="Category" value={req.category_name || "Any"} />
            <Fact label="Ship to ZIP" value={req.ship_to_zip || "Not given"} />
            {req.deadline && (
              <Fact
                label="Needed by"
                value={new Date(req.deadline).toLocaleDateString("en-US", { dateStyle: "medium" })}
              />
            )}
          </div>

          {images.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Photo ${i + 1}`}
                  className="w-20 h-20 rounded-lg object-cover border border-white/10 shrink-0"
                />
              ))}
            </div>
          )}
        </div>

        <h2 className="mt-6 text-white font-semibold">
          {sorted.length === 0
            ? "Offers"
            : `${sorted.length} offer${sorted.length === 1 ? "" : "s"}, cheapest first`}
        </h2>

        {sorted.length === 0 ? (
          <div className="mt-3 text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
            <FaGavel className="text-4xl text-white/10 mx-auto mb-3" />
            <p className="text-white/60 text-sm">No offers yet.</p>
            <p className="text-white/40 text-xs mt-1 inline-flex items-center gap-1">
              <IoTimeOutline /> Vendors can see your request now. Their offers will show up here.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {open && sorted.length > 1 && (
              <p className="text-white/50 text-xs">
                Totals include shipping{quantity > 1 ? ` for all ${quantity} items` : ""}. Accepting an
                offer adds it to your cart.
              </p>
            )}
            {sorted.map((bid) => (
              <OfferCard
                key={bid.id}
                bid={bid}
                requestStatus={req.status}
                requestId={req.id}
                quantity={quantity}
                isLowest={bid.id === lowestId}
                onAcceptBid={accept}
                accepting={accepting === bid.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
