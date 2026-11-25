import React, { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useAccessToken } from "../hooks/useAccessToken";
import { usePaymentConfirmation } from "../hooks/usePaymentConfirmation";
import { formatMoney } from "../utils/formatMoney";
import {
  createVendorPaymentLink,
  fetchMyOrderItems,
  isItemFailed,
  isItemPaid,
  itemsForOrder,
  shopperPaymentError,
  storeNameOf,
  unpaidByVendor,
  vendorIdOf,
} from "../utils/orderPayment";

/**
 * /success — where Square sends the shopper after paying one store.
 * The redirect alone proves nothing: we wait for the backend (fed by Square's webhook)
 * to mark the items paid before saying so.
 */
const OrderConfirm = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const vendorId = searchParams.get("vendorId");
  const token = useAccessToken();
  const [payingVendor, setPayingVendor] = useState(null);
  const [payError, setPayError] = useState("");

  const check = useCallback(async () => {
    const items = itemsForOrder(await fetchMyOrderItems(token), orderId);
    const target = vendorId ? items.filter((i) => vendorIdOf(i) === String(vendorId)) : items;
    if (!target.length) return { status: "pending", data: { items, target } };
    if (target.every(isItemPaid)) return { status: "confirmed", data: { items, target } };
    if (target.every(isItemFailed)) return { status: "failed", data: { items, target } };
    return { status: "pending", data: { items, target } };
  }, [token, orderId, vendorId]);

  const { phase, data, retry } = usePaymentConfirmation(check, { enabled: Boolean(orderId && token) });

  const target = data?.target ?? [];
  const stillToPay = useMemo(
    () => unpaidByVendor(data?.items ?? []).filter((g) => g.vendorId !== String(vendorId ?? "")),
    [data, vendorId]
  );
  const paidTotal = target.reduce(
    (sum, i) => sum + Number(i.total_price || 0) + Number(i.shipping_cost || 0),
    0
  );
  const storeName = target[0] ? storeNameOf(target[0]) : "The store";

  const pay = async (vid) => {
    setPayError("");
    setPayingVendor(vid);
    try {
      window.location.href = await createVendorPaymentLink(orderId, vid, token);
    } catch (error) {
      setPayError(shopperPaymentError(error));
      setPayingVendor(null);
    }
  };

  let view;
  if (!orderId) {
    view = {
      icon: "alert",
      title: "We couldn't find this order",
      body: "The link is missing its order reference. Your orders list shows everything you've paid for.",
    };
  } else if (!token) {
    view = {
      icon: "clock",
      title: "Sign in to see your order",
      body: "We need you signed in to confirm this payment with your account.",
    };
  } else if (phase === "verifying") {
    view = {
      icon: "clock",
      title: "Confirming your payment",
      body: "We're checking with Square. This usually takes a few seconds — you can keep this page open.",
      busy: true,
    };
  } else if (phase === "confirmed") {
    view = {
      icon: "check",
      title: "Payment confirmed",
      body: `${storeName} has your order and will prepare it for shipping. We'll show tracking in your orders once it ships.`,
    };
  } else if (phase === "failed") {
    view = {
      icon: "alert",
      title: "This payment didn't go through",
      body: "Square reported it as canceled. Nothing here is marked paid — you can try again below or from your orders.",
    };
  } else {
    view = {
      icon: "clock",
      title: "Still confirming",
      body: "Square hasn't confirmed this payment yet. Confirmation can take a minute; if it went through, it will show as paid in your orders.",
    };
  }

  const Icon = view.icon === "check" ? CheckCircleIcon : view.icon === "alert" ? ExclamationCircleIcon : ClockIcon;
  const iconTone =
    view.icon === "check"
      ? "text-ps-success bg-[color-mix(in_srgb,var(--ps-color-success)_14%,transparent)]"
      : view.icon === "alert"
      ? "text-ps-warning bg-[color-mix(in_srgb,var(--ps-color-warning)_14%,transparent)]"
      : "text-ps-action-text bg-ps-action-soft";

  return (
    <div className="min-h-[80vh] bg-ps-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div aria-live="polite" className="text-center">
          <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${iconTone}`}>
            <Icon className={`h-8 w-8 ${view.busy ? "motion-safe:animate-pulse" : ""}`} strokeWidth={1.5} aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink mb-2">{view.title}</h1>
          <p className="text-ps-fg2 text-[15px] leading-relaxed mb-6">{view.body}</p>
        </div>

        {phase === "confirmed" && target.length > 0 && (
          <div className="mb-6 rounded-2xl border border-ps-border bg-ps-raised px-5 py-4 text-left">
            <ul className="divide-y divide-[var(--ps-color-border)]">
              {target.map((i) => (
                <li key={i.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <span className="text-ink truncate">
                    {i.product?.name || "Item"} <span className="text-ps-meta">× {i.quantity}</span>
                  </span>
                  <span className="text-ps-fg2 tabular-nums">${formatMoney(Number(i.total_price || 0))}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t border-ps-border pt-3 text-sm">
              <span className="text-ps-fg2">Paid, including shipping</span>
              <span className="font-semibold text-ink tabular-nums">${formatMoney(paidTotal)}</span>
            </div>
          </div>
        )}

        {phase === "failed" && vendorId && (
          <button
            type="button"
            onClick={() => pay(String(vendorId))}
            disabled={Boolean(payingVendor)}
            className="mb-3 inline-flex w-full items-center justify-center min-h-[48px] rounded-[14px] bg-ps-action px-6 text-base font-semibold text-white disabled:opacity-60"
          >
            {payingVendor ? "Opening payment…" : "Try this payment again"}
          </button>
        )}

        {(phase === "confirmed" || phase === "timeout") && stillToPay.length > 0 && (
          <section aria-labelledby="still-to-pay" className="mb-6 rounded-2xl border border-ps-border bg-ps-surface px-5 py-4">
            <h2 id="still-to-pay" className="text-sm font-semibold text-ink mb-1">
              Still to pay
            </h2>
            <p className="text-sm text-ps-fg2 mb-3">
              Each store is paid separately. Items from these stores aren’t paid for yet.
            </p>
            <ul className="space-y-2">
              {stillToPay.map((g) => (
                <li key={g.vendorId} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink truncate">
                    {g.storeName} <span className="text-ps-meta">· ${formatMoney(g.total)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => pay(g.vendorId)}
                    disabled={Boolean(payingVendor)}
                    className="shrink-0 min-h-[40px] rounded-xl bg-ps-action px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {payingVendor === g.vendorId ? "Opening…" : `Pay ${g.storeName}`}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {payError && (
          <p role="alert" className="mb-4 text-sm text-ps-danger text-center">
            {payError}
          </p>
        )}

        {phase === "timeout" && (
          <button
            type="button"
            onClick={retry}
            className="mb-3 inline-flex w-full items-center justify-center min-h-[48px] rounded-[14px] border border-ps-border bg-ps-surface px-6 text-base font-medium text-ink"
          >
            Check again
          </button>
        )}

        {!token && orderId ? (
          <Link
            to="/signin"
            className="mb-3 inline-flex w-full items-center justify-center min-h-[48px] rounded-[14px] bg-ps-action px-6 text-base font-semibold text-white"
          >
            Sign in
          </Link>
        ) : (
          <Link
            to="/orders"
            className="mb-3 inline-flex w-full items-center justify-center min-h-[48px] rounded-[14px] border border-ps-border px-6 text-base font-medium text-ink hover:bg-ps-hover"
          >
            View my orders
          </Link>
        )}
        <Link to="/" className="block text-center text-sm text-ps-fg2 hover:text-ink min-h-[44px] leading-[44px]">
          Continue shopping
        </Link>
        {orderId && (
          <p className="mt-4 text-center text-xs text-ps-meta">
            Order reference <span className="font-mono">{orderId.slice(0, 8)}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderConfirm;
