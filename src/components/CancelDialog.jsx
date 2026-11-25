import axios from "axios";
import { toast } from "react-toastify";
import { useAccessToken } from "../hooks/useAccessToken";
import ConfirmDialog from "./ui/ConfirmDialog";
import { formatMoney } from "../utils/formatMoney";
import { isItemPaid } from "../utils/orderPayment";

/**
 * Cancel one order item. Says plainly whether money comes back, and only reports
 * what the server actually did (cancellation runs in the background → "requested").
 */
export default function CancelDialog({ isOpen, setIsOpen, orderId, order, GetOrders }) {
  const accessToken = useAccessToken();
  const paid = order ? isItemPaid(order) : null;
  const amount = order ? Number(order.total_price || 0) + Number(order.shipping_cost || 0) : null;

  const cancel = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/order/cancel-order/${orderId}/`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success(
        response.status === 202
          ? "Cancellation requested. This order will update in a moment."
          : "Order canceled."
      );
      GetOrders?.();
    } catch (error) {
      const err = new Error("cancel failed");
      err.userMessage =
        error.response?.data?.error ||
        (error.response ? "We couldn't cancel this order. Please try again." : "We couldn't reach PinkSurfing. Check your connection and try again.");
      throw err;
    }
  };

  return (
    <ConfirmDialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      title="Cancel this order?"
      confirmLabel="Cancel order"
      busyLabel="Canceling…"
      cancelLabel="Keep order"
      tone="danger"
      onConfirm={cancel}
    >
      {paid === false && <p>You haven’t been charged for this item, so there’s nothing to refund.</p>}
      {paid === true && (
        <p>
          You’ll be refunded ${formatMoney(amount)} to your original payment method. Refunds usually take 5–10
          business days to appear.
        </p>
      )}
      {paid === null && <p>If you’ve paid for this item, the payment is refunded to your original payment method.</p>}
      <p className="mt-2">Once canceled, the store won’t ship it.</p>
    </ConfirmDialog>
  );
}
