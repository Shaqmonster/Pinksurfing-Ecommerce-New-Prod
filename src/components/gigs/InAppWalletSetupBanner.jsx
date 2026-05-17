import React, { useState } from "react";
import { useInAppWallet } from "../../context/inAppWalletContext";

/** Create / import GigHub in-app wallet (shared by GigHub landing and profile wallet). */
export default function InAppWalletSetupBanner({ className = "" }) {
  const { status, address, createWallet, importMnemonic, lastError } = useInAppWallet();
  const [mnemonic, setMnemonic] = useState("");
  const [showPhrase, setShowPhrase] = useState(false);

  if (status === "booting") {
    return (
      <div className={`p-4 rounded-2xl bg-[#13131a] border border-white/10 ${className}`}>
        <p className="text-sm text-white/50">Loading wallet…</p>
      </div>
    );
  }

  const onCreate = async () => {
    const res = await createWallet({ wordCount: 12 });
    setMnemonic(res.mnemonic);
    setShowPhrase(true);
  };

  const onImport = async () => {
    const phrase = window.prompt("Paste your 12/24-word seed phrase");
    if (!phrase) return;
    await importMnemonic(phrase);
    setMnemonic("");
    setShowPhrase(false);
  };

  if (status === "ready" && address) {
    return (
      <div className={`p-4 rounded-2xl bg-[#0f0f16] border border-emerald-500/20 ${className}`}>
        <div className="text-sm text-white/80">
          In-app wallet connected (GigHub / Anvil):{" "}
          <span className="font-mono text-emerald-200">{address}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl bg-[#0f0f16] border border-white/10 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-white font-semibold">Set up your GigHub wallet</p>
          <p className="text-xs text-white/60 mt-1">
            Saved on this device and backed up to your account (encrypted). Log out and back in — same wallet restores.
          </p>
          {lastError ? <p className="text-xs text-red-400 mt-1">{lastError}</p> : null}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onCreate}
            className="px-3 py-2 rounded-xl bg-[#6EE7FF] text-black text-sm font-semibold"
          >
            Create wallet
          </button>
          <button
            type="button"
            onClick={onImport}
            className="px-3 py-2 rounded-xl border border-white/15 text-white/80 text-sm"
          >
            Import seed
          </button>
        </div>
      </div>

      {showPhrase && mnemonic ? (
        <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/10">
          <p className="text-xs text-white/70 mb-1">Recovery phrase (save it somewhere safe):</p>
          <p className="font-mono text-sm text-white break-words">{mnemonic}</p>
          <button
            type="button"
            className="mt-2 text-xs text-white/70 underline"
            onClick={() => {
              setShowPhrase(false);
              setMnemonic("");
            }}
          >
            Hide
          </button>
        </div>
      ) : null}
    </div>
  );
}
