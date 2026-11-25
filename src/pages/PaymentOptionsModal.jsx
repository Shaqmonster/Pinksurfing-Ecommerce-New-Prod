import React, { useCallback, useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { formatMoney } from "../utils/formatMoney";
import { useAccessToken } from "../hooks/useAccessToken";
import ErrorState from "../components/ui/ErrorState";
import {
  createVendorPaymentLink,
  fetchMyOrderItems,
  itemsForOrder,
  shopperPaymentError,
  unpaidByVendor,
} from "../utils/orderPayment";

/**
 * After an order is placed: pay each store separately with Square.
 * Amounts come from the order the server just created (items + shipping), so what we
 * show is exactly what Square will charge.
 */
const PaymentOptionsModal = ({ isOpen, onClose, order_id }) => {
  const accessToken = useAccessToken();
  const [groups, setGroups] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [payingVendor, setPayingVendor] = useState(null);
  const [payError, setPayError] = useState("");

  const load = useCallback(async () => {
    setLoadError(false);
    setGroups(null);
    try {
      const items = itemsForOrder(await fetchMyOrderItems(accessToken), order_id);
      setGroups(unpaidByVendor(items));
    } catch (e) {
      console.error(e);
      setLoadError(true);
    }
  }, [accessToken, order_id]);

  useEffect(() => {
    if (isOpen && order_id) load();
  }, [isOpen, order_id, load]);

  const pay = async (vendorId) => {
    setPayError("");
    setPayingVendor(vendorId);
    try {
      window.location.href = await createVendorPaymentLink(order_id, vendorId, accessToken);
    } catch (error) {
      console.error("Payment link error:", error?.response?.data || error);
      setPayError(shopperPaymentError(error));
      setPayingVendor(null);
    }
  };

  const many = (groups?.length || 0) > 1;

  return (
    <Dialog open={Boolean(isOpen)} onClose={() => !payingVendor && onClose()} className="relative z-[110]">
      <div className="fixed inset-0 bg-ps-overlay" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-2xl border border-ps-border bg-ps-surface shadow-[var(--ps-shadow-3)]">
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div>
                <Dialog.Title className="text-lg font-semibold tracking-tight text-ink">
                  {many ? "Pay each store" : "Pay for your order"}
                </Dialog.Title>
                <p className="mt-1 text-sm text-ps-fg2">
                  {many
                    ? "Your order has items from more than one store. Each store is paid separately — start with any of them."
                    : "Your order is placed. Pay securely with Square to confirm it."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={Boolean(payingVendor)}
                aria-label="Close"
                className="-mr-2 -mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-ps-fg2 hover:bg-ps-hover hover:text-ink"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-3">
              {loadError ? (
                <ErrorState
                  title="We couldn't load your order"
                  description="Your order was placed. You can also pay from My orders."
                  onRetry={load}
                  className="py-6"
                />
              ) : groups === null ? (
                <div className="space-y-3" aria-busy="true" aria-label="Loading your order">
                  {[0, 1].map((i) => (
                    <div key={i} className="ps-skeleton h-24 rounded-xl" />
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <p className="py-6 text-center text-sm text-ps-fg2">
                  Everything in this order is already paid. You can follow it in My orders.
                </p>
              ) : (
                groups.map((g) => (
                  <section key={g.vendorId} className="rounded-xl border border-ps-border bg-ps-raised p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-semibold text-ink truncate">{g.storeName}</h3>
                      <span className="text-base font-semibold text-ink tabular-nums">${formatMoney(g.total)}</span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {g.items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-3 text-sm text-ps-fg2">
                          <span className="truncate">
                            {item.product?.name || "Item"} <span className="text-ps-meta">× {item.quantity}</span>
                          </span>
                          <span className="tabular-nums">${formatMoney(item.total_price)}</span>
                        </li>
                      ))}
                      {g.items.some((i) => Number(i.shipping_cost) > 0) && (
                        <li className="flex justify-between gap-3 text-sm text-ps-meta">
                          <span>Shipping</span>
                          <span className="tabular-nums">
                            ${formatMoney(g.items.reduce((s, i) => s + Number(i.shipping_cost || 0), 0))}
                          </span>
                        </li>
                      )}
                    </ul>
                    <button
                      type="button"
                      disabled={Boolean(payingVendor)}
                      onClick={() => pay(g.vendorId)}
                      aria-busy={payingVendor === g.vendorId}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 min-h-[44px] rounded-xl bg-ps-action px-4 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {payingVendor === g.vendorId ? "Opening Square…" : `Pay ${g.storeName}`}
                    </button>
                  </section>
                ))
              )}
              {payError && (
                <p role="alert" className="text-sm text-ps-danger">
                  {payError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-ps-border px-6 py-4 text-xs text-ps-meta">
              <LockClosedIcon className="h-4 w-4" aria-hidden />
              <span>Payments are handled by Square. PinkSurfing never sees your card details.</span>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default PaymentOptionsModal;
