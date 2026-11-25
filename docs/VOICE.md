# PinkSurfing storefront: voice and feedback

PinkSurfing should feel **premium and calm**: quiet confidence, plain words, and the craft shown in the details. The user chose this on 2026-11-26.

## Five rules

1. **Say what happened and what to do next.** Never blame the shopper. Never show status codes, JSON, stack traces or function names.
2. **Around money, be exact.** Say what is confirmed, what is pending and what happens next. **Never claim a payment succeeded until the backend confirms it**; see `usePaymentConfirmation`.
3. **Use sentence case.** No "!!", no ALL CAPS for calm moments, no Title-Case "Successfully". Uppercase is only for tiny labels.
4. **Match the feedback to the moment.** A routine save gets a short, quiet toast. A real milestone gets one calm moment. No confetti.
5. **Keep error, empty and loading states separate.**
   - Show "Nothing here yet" only when the data really is empty.
   - Failures use `ErrorState` with a retry.

## Tools

| Need | Use |
|---|---|
| Toast | `notify.success / info / error` from `src/lib/notify.js`. Errors interrupt screen readers; the rest are announced politely. |
| API failure | `notify.apiError(error, "We couldn’t <action>. Please try again.")` shows the server's text only when it reads like a sentence. |
| Load failed | `components/ui/ErrorState` (message plus Try again) |
| Truly empty | `components/ui/EmptyState` (what it means plus the next step) |
| Consequential action | `components/ui/ConfirmDialog`: state the consequence and the amount, and label the button with its verb ("Cancel order", not "OK") |
| Payment return page | `usePaymentConfirmation` plus `components/ui/PaymentStatusCard` |

## Before and after

| Before | After |
|---|---|
| Payment successful… your order has been placed *(shown before any check)* | Confirming your payment → Payment confirmed |
| An error occurred | We couldn’t add this to your cart. Please try again. |
| Invalid email or password *(shown even on network failure)* | We couldn’t reach sign-in. Check your connection and try again. |
| Your cart is empty *(shown after a failed load)* | We couldn’t load your cart. Your items are still saved. |
| Are you sure you want to delete this order? This cannot be undone. | Cancel this order? You’ll be refunded $42.00 to your original payment method. |
| Return Scheduled! A carrier will arrive tomorrow. | Return requested. We’ll show the next steps on this order. |
| You have not made any Orders till Now | No orders yet. When you buy something, it will show up here with tracking. |
| OOPS !! Page not found | This page isn’t here anymore |
| Item Has Not Shipped Yet / Processing at warehouse | Not shipped yet. The store is preparing your order. |
| Review Posted Successfully | Thanks — your review is posted. |
| MULTI-VENDOR CHECKOUT | Pay each store |
| 12.34% OFF | 12% off |

## Typography for calm moments

- **Headings:** `font-semibold tracking-tight`. Avoid `font-black`.
- **Body text:** `text-ps-fg2`. Secondary information: `text-ps-meta`.
- **Typographic apostrophes (’)** in text.
- **Motion:** use the `PS_MOTION` tokens, keep it short, and respect `prefers-reduced-motion`. Loading spinners keep turning slowly, because they report status.
