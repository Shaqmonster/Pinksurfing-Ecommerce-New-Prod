import React, { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAccessToken } from "../hooks/useAccessToken";
import { usePaymentConfirmation } from "../hooks/usePaymentConfirmation";
import { getMyVisits } from "../api/propertyVisits";
import PaymentStatusCard, { primaryActionClass, secondaryActionClass } from "../components/ui/PaymentStatusCard";

/** Return page after paying for a property visit. Waits for the backend before saying it's paid. */
const VisitPaymentReturn = () => {
  const [params] = useSearchParams();
  const visitId = params.get("visit_id");
  const slug = params.get("slug");
  const token = useAccessToken();

  const productLink = useMemo(
    () => (slug ? `/product/productDetail/${encodeURIComponent(slug)}` : "/"),
    [slug]
  );

  const check = useCallback(async () => {
    const visit = (await getMyVisits(token)).find((v) => String(v.id) === String(visitId));
    if (!visit || visit.status === "pending_payment") return "pending";
    if (visit.status === "rejected") return "failed";
    return "confirmed";
  }, [token, visitId]);

  const { phase, retry } = usePaymentConfirmation(check, { enabled: Boolean(visitId && token) });
  const back = (
    <Link to={productLink} className={secondaryActionClass}>
      Back to listing
    </Link>
  );

  if (!visitId) {
    return (
      <PaymentStatusCard tone="problem" title="We couldn't find this visit" actions={back}>
        The link is missing its visit reference. Your visit status is shown on the listing.
      </PaymentStatusCard>
    );
  }
  if (!token) {
    return (
      <PaymentStatusCard
        tone="waiting"
        title="Sign in to see your visit"
        actions={<Link to="/signin" className={primaryActionClass}>Sign in</Link>}
      >
        We need you signed in to confirm this payment with your account.
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
      <PaymentStatusCard tone="confirmed" title="Visit request sent" actions={<Link to={productLink} className={primaryActionClass}>Back to listing</Link>}>
        Your payment is confirmed and the listing agent has your request. You’ll see their reply, or a new
        time to choose, on the listing.
      </PaymentStatusCard>
    );
  }
  if (phase === "failed") {
    return (
      <PaymentStatusCard tone="problem" title="This visit wasn't accepted" actions={back}>
        The listing agent declined this request. Any refund is shown on the listing.
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
          {back}
        </>
      }
    >
      Square hasn’t confirmed this payment yet. It can take a minute; if it went through, the listing will
      show your visit as requested.
    </PaymentStatusCard>
  );
};

export default VisitPaymentReturn;
