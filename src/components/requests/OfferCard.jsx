import React from "react";
import { motion } from "framer-motion";
import { IoCheckmarkCircle, IoStorefrontOutline } from "react-icons/io5";
import { formatMoney } from "../../utils/formatMoney";

const BID_STATUS_COLORS = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  SHORTLISTED: "bg-blue-500/20 text-blue-400",
  ACCEPTED: "bg-emerald-500/20 text-emerald-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

/** What the buyer pays in total for an offer: price per item x quantity + shipping. */
export const offerTotal = (bid, quantity = 1) =>
  Number(bid.bid_amount || 0) * Math.max(1, Number(quantity) || 1) + Number(bid.shipping_cost || 0);

/** Offers sorted cheapest first (total incl. shipping), plus the id of the lowest open one. */
export const sortOffers = (bids, quantity = 1) => {
  const sorted = [...(bids || [])].sort((a, b) => offerTotal(a, quantity) - offerTotal(b, quantity));
  const lowest = sorted.find((b) => b.status === "PENDING" || b.status === "SHORTLISTED");
  return { sorted, lowestId: sorted.length > 1 && lowest ? lowest.id : null };
};

const OfferCard = ({ bid, requestStatus, requestId, quantity = 1, isLowest = false, onAcceptBid, accepting }) => {
  const bidImages = [bid.image1, bid.image2, bid.image3, bid.image4].filter(Boolean);
  const canAccept = ["OPEN", "EVALUATING"].includes(requestStatus) && bid.status === "PENDING";

  return (
    <div
      className={`bg-ink/5 border rounded-xl p-3 sm:p-4 space-y-3 ${
        isLowest ? "border-emerald-500/40" : "border-ink/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <IoStorefrontOutline className="text-purple-400 text-lg shrink-0" />
          <div className="min-w-0">
            <p className="text-ink font-medium text-sm truncate">{bid.vendor_store_name}</p>
            <p className="text-ink/40 text-[11px]">
              Total ${formatMoney(offerTotal(bid, quantity))}
              {quantity > 1 ? ` for ${quantity}` : ""} incl. shipping
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
        {isLowest && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
            Lowest
          </span>
        )}
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
            BID_STATUS_COLORS[bid.status] || "bg-gray-500/20 text-ps-meta"
          }`}
        >
          {bid.status}
        </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-ink/5 rounded-lg p-2.5">
          <p className="text-ink/40 text-xs">Price</p>
          <p className="text-emerald-400 font-bold text-sm sm:text-base">${formatMoney(bid.bid_amount)}</p>
          <p className="text-ink/40 text-[11px]">
            {Number(bid.shipping_cost) > 0 ? `+ $${formatMoney(bid.shipping_cost)} shipping` : "Free shipping"}
          </p>
        </div>
        <div className="bg-ink/5 rounded-lg p-2.5">
          <p className="text-ink/40 text-xs">Delivery</p>
          <p className="text-ink font-semibold text-sm">{bid.delivery_time_days} days</p>
          <p className="text-ink/40 text-[11px] capitalize">
            {bid.condition || "new"}
            {bid.stock_available === false ? " · not in stock yet" : " · in stock"}
          </p>
        </div>
      </div>

      <div className="bg-ink/5 rounded-lg p-3">
        <p className="text-ink/40 text-xs mb-1">Vendor note</p>
        <p className="text-ink/80 text-sm leading-relaxed">{bid.proposal}</p>
      </div>

      {bidImages?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {bidImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`bid-img-${i}`}
              className="w-10 h-10 rounded-lg object-cover border border-ink/10 shrink-0"
            />
          ))}
        </div>
      )}

      {canAccept && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAcceptBid(requestId, bid.id)}
          disabled={accepting}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/30 transition-all"
        >
          {accepting ? (
            <>
              <span className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              <IoCheckmarkCircle className="text-lg" />
              Accept and Add to Cart
            </>
          )}
        </motion.button>
      )}

      {bid.status === "ACCEPTED" && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
          <IoCheckmarkCircle className="text-lg shrink-0" />
          Offer accepted. It&apos;s in your cart, ready to check out.
        </div>
      )}
    </div>
  );
};

export default OfferCard;
