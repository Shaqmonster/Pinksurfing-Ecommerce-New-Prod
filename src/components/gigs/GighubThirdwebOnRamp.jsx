import React, { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { BuyWidget } from "thirdweb/react";
import { getThirdwebClient } from "../../lib/thirdwebClient";
import { isDevWalletFundingEnabled, isLocalAnvilEscrow } from "../../lib/devWalletFunding";
import { getEscrowChainIdFromEnv, getThirdwebOnRampChainFromEnv } from "../../lib/thirdwebOnRampChain";
import DevWalletFundingPanel from "./DevWalletFundingPanel";

/**
 * Fund in-app wallet: free dev (Anvil / testnet faucets) or Thirdweb Buy (card + crypto).
 */
export default function GighubFundWalletModal({ open, onClose, receiverAddress, onPurchaseSuccess }) {
  const client = useMemo(() => getThirdwebClient(), []);
  const onRampChain = useMemo(() => getThirdwebOnRampChainFromEnv(), []);
  const escrowChainId = getEscrowChainIdFromEnv();
  const showDev = isDevWalletFundingEnabled();
  const localAnvil = isLocalAnvilEscrow();
  const showThirdweb = !!client && !localAnvil;

  const preferDev =
    showDev &&
    (localAnvil || Number(escrowChainId) === 84532 || Number(escrowChainId) === 11155111);
  const defaultTab = preferDev ? "dev" : showThirdweb ? "thirdweb" : showDev ? "dev" : "thirdweb";
  const [tab, setTab] = useState(defaultTab);

  const chainMismatch =
    showThirdweb &&
    escrowChainId != null &&
    Number(onRampChain.id) !== Number(escrowChainId);

  if (!showDev && !showThirdweb) return null;

  const tabs = [
    ...(showDev
      ? [
          {
            key: "dev",
            label: localAnvil
              ? "Free (Anvil mint)"
              : Number(escrowChainId) === 11155111
                ? "Free (Sepolia faucets)"
                : "Free (testnet faucets)",
          },
        ]
      : []),
    ...(showThirdweb ? [{ key: "thirdweb", label: "Thirdweb (card)" }] : []),
  ];

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-[min(100%,520px)] transform overflow-hidden rounded-2xl bg-[#13131a] border border-white/10 shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <Dialog.Title className="text-white font-semibold text-sm">Fund wallet</Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {tabs.length > 1 ? (
                  <div className="flex gap-1 p-2 border-b border-white/10">
                    {tabs.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                          tab === t.key
                            ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white"
                            : "text-white/50 hover:text-white/75"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="p-3 max-h-[min(80vh,720px)] overflow-y-auto">
                  {tab === "dev" && showDev ? (
                    <DevWalletFundingPanel
                      address={receiverAddress}
                      onFunded={() => {
                        onPurchaseSuccess?.();
                      }}
                    />
                  ) : null}

                  {tab === "thirdweb" && showThirdweb ? (
                    <>
                      {chainMismatch ? (
                        <p className="text-amber-300/90 text-xs mb-3 leading-relaxed">
                          Thirdweb uses chain {String(onRampChain.id)}; escrow is {String(escrowChainId)}. For local
                          GigHub, use the <strong className="font-normal text-white/80">Free (Anvil)</strong> tab.
                        </p>
                      ) : null}
                      <BuyWidget
                        client={client}
                        chain={onRampChain}
                        receiverAddress={receiverAddress}
                        amount="0.05"
                        paymentMethods={["card", "crypto"]}
                        theme="dark"
                        title="Fund your GigHub wallet"
                        description="Pay with card or crypto. Tokens are sent to your in-app wallet address."
                        onSuccess={(data) => {
                          toast.success("Purchase flow completed.", { position: "top-center" });
                          onPurchaseSuccess?.(data);
                          onClose();
                        }}
                        onError={(err) => {
                          toast.error(err?.message || "Funding failed.", { position: "top-center" });
                        }}
                      />
                    </>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
