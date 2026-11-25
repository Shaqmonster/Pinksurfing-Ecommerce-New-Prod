import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";

/**
 * One calm confirmation dialog for consequential actions.
 * - Says what will happen (`children`) and labels the action with its verb.
 * - `onConfirm` may be async: the button shows a busy state, and a thrown error
 *   is shown inline so nothing closes on a failure.
 */
export default function ConfirmDialog({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  busyLabel = "Working…",
  cancelLabel = "Keep it",
  tone = "default", // "default" | "danger"
  onConfirm,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (busy) return;
    setError("");
    onClose();
  };

  const confirm = async () => {
    setError("");
    setBusy(true);
    try {
      await onConfirm();
      setBusy(false);
      onClose();
    } catch (e) {
      setBusy(false);
      setError(e?.userMessage || "That didn't go through. Please try again.");
    }
  };

  const confirmCls =
    tone === "danger"
      ? "bg-ps-danger text-white"
      : "bg-ps-action text-white";

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[120]" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ps-overlay" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 motion-safe:scale-[0.98]"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Panel className="w-full max-w-md rounded-2xl border border-ps-border bg-ps-surface p-6 text-left shadow-[var(--ps-shadow-3)]">
                <Dialog.Title as="h3" className="text-lg font-semibold tracking-tight text-ink">
                  {title}
                </Dialog.Title>
                <div className="mt-2 text-sm leading-relaxed text-ps-fg2">{children}</div>
                {error && (
                  <p role="alert" className="mt-3 text-sm text-ps-danger">
                    {error}
                  </p>
                )}
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={close}
                    disabled={busy}
                    className="min-h-[44px] rounded-xl border border-ps-border px-4 text-sm font-medium text-ink hover:bg-ps-hover disabled:opacity-60"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={busy}
                    aria-busy={busy}
                    className={`min-h-[44px] rounded-xl px-4 text-sm font-semibold disabled:opacity-70 ${confirmCls}`}
                  >
                    {busy ? busyLabel : confirmLabel}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
