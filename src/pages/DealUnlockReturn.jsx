import React, { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchUnlockStatus } from "../api/offMarketDeals";
import { usePaymentConfirmation } from "../hooks/usePaymentConfirmation";
import { useAccessToken } from "../hooks/useAccessToken";
import PaymentStatusCard, { primaryActionClass, secondaryActionClass } from "../components/ui/PaymentStatusCard";

const UNLOCKED = new Set(["unlocked", "in_deal_room", "closed"]);

/** Return page after paying a deal's unlock fee. Waits for the backend before granting access. */
export default function DealUnlockReturn() {
  const [params] = useSearchParams();
  const unlockId = params.get("unlock_id");
  const slug = params.get("slug");
  const productId = params.get("product_id");
  const token = useAccessToken();

  const dealLink = slug
    ? `/deals/${slug}?deal_unlocked=1`
    : productId
      ? `/deals/${productId}?deal_unlocked=1`
      : "/deals";

  const check = useCallback(async () => {
    const res = await fetchUnlockStatus(unlockId, token);
    return UNLOCKED.has(res?.status) ? "confirmed" : "pending";
  }, [unlockId, token]);

  const { phase, retry } = usePaymentConfirmation(check, { enabled: Boolean(unlockId) });
  const home = (
    <Link to="/deals" className={secondaryActionClass}>
      Back to deals
    </Link>
  );

  if (!unlockId) {
    return (
      <PaymentStatusCard tone="problem" title="We couldn't find this unlock" actions={home}>
        The link is missing its unlock reference. Deals you’ve unlocked are listed in My Unlocks.
      </PaymentStatusCard>
    );
  }
  if (phase === "verifying") {
    return (
      <PaymentStatusCard tone="waiting" title="Confirming your payment" busy>
        We’re checking with Square. This usually takes a few seconds.
      </PaymentStatusCard>
    );
  }
  if (phase === "confirmed") {
    return (
      <PaymentStatusCard tone="confirmed" title="Deal unlocked" actions={<Link to={dealLink} className={primaryActionClass}>View the full deal</Link>}>
        Your payment is confirmed. The address, photos and documents for this deal are now open to you.
      </PaymentStatusCard>
    );
  }
  return (
    <PaymentStatusCard
      tone="waiting"
      title="Still confirming"
      actions={
        <>
          <button type="button" onClick={retry} className={primaryActionClass}>
            Check again
          </button>
          <Link to="/my-unlocks" className={secondaryActionClass}>
            Go to My Unlocks
          </Link>
          <Link to="/contact" className="min-h-[44px] leading-[44px] text-sm text-ps-fg2 hover:text-ink">
            Contact support
          </Link>
        </>
      }
    >
      Square hasn’t confirmed this payment yet. It can take a few minutes; once it does, the deal shows as
      unlocked in My Unlocks.
    </PaymentStatusCard>
  );
}
