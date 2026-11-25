import { useState } from "react";
import { acceptBid, addToCart } from "../api/buyerRequests";

import { notify } from "../lib/notify";
/** Accept a vendor's offer on a product request and put it in the cart. */
export function useAcceptOffer(accessToken, onDone) {
  const [accepting, setAccepting] = useState(null);

  const accept = async (requestId, bidId) => {
    try {
      setAccepting(bidId);
      const res = await acceptBid(accessToken, requestId, bidId);
      await addToCart(accessToken, res.data.product_id);
      notify.success("Offer accepted and added to your cart!");
      onDone?.();
    } catch (err) {
      notify.error(err?.response?.data?.error || "Failed to accept the offer. Please try again.");
    } finally {
      setAccepting(null);
    }
  };

  return { accept, accepting };
}
