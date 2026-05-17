import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  fundAddressViaAnvil,
  getEscrowNetworkLabel,
  getFaucetsForEscrowChain,
  isDevWalletFundingEnabled,
  isLocalAnvilEscrow,
  isSepoliaTestnetEscrow,
} from "../../lib/devWalletFunding";
import { getEscrowChainIdFromEnv } from "../../lib/thirdwebOnRampChain";

export default function DevWalletFundingPanel({ address, onFunded }) {
  const [minting, setMinting] = useState(false);
  const showDev = isDevWalletFundingEnabled();
  const localAnvil = isLocalAnvilEscrow();
  const sepoliaMode = isSepoliaTestnetEscrow();
  const escrowChainId = getEscrowChainIdFromEnv();
  const networkLabel = getEscrowNetworkLabel();
  const faucetNetworks = getFaucetsForEscrowChain();

  if (!showDev || !address) return null;

  const handleAnvilMint = async () => {
    setMinting(true);
    try {
      await fundAddressViaAnvil(address, "100");
      toast.success("Minted 100 test ETH on Anvil.", { position: "top-center" });
      onFunded?.();
    } catch (e) {
      toast.error(e?.message || "Anvil mint failed.", { position: "top-center" });
    } finally {
      setMinting(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied.", { position: "top-center" });
    } catch {
      toast.error("Could not copy address.", { position: "top-center" });
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <p className="text-white/50 text-xs leading-relaxed">
        {localAnvil ? (
          <>
            Shared <strong className="text-white/70">local Anvil</strong> testnet (chain{" "}
            <span className="font-mono">{escrowChainId}</span>). Test ETH is minted instantly — wallets
            auto-fund when balance is low.
          </>
        ) : sepoliaMode ? (
          <>
            Shared <strong className="text-white/70">Ethereum Sepolia</strong> (chain{" "}
            <span className="font-mono">{escrowChainId}</span>). Send Sepolia ETH to this address.
          </>
        ) : (
          <>
            GigHub escrow on <span className="font-mono text-white/70">{networkLabel}</span> (chain{" "}
            {escrowChainId ?? "?"}). Fund this wallet on that network only.
          </>
        )}
      </p>

      {localAnvil ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 space-y-2">
          <p className="text-emerald-300/90 text-xs font-semibold">Anvil test ETH (instant)</p>
          <button
            type="button"
            disabled={minting}
            onClick={handleAnvilMint}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
          >
            {minting ? "Minting…" : "Mint 100 test ETH"}
          </button>
          <p className="text-white/40 text-[10px]">
            Requires Anvil on <span className="font-mono">localhost:8545</span> (run{" "}
            <span className="font-mono">bash setup-anvil.sh</span>).
          </p>
        </div>
      ) : null}

      {faucetNetworks.length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
          <p className="text-white/70 text-xs font-semibold">
            {sepoliaMode ? "Get Sepolia ETH (free faucets)" : "Public testnet faucets"}
          </p>
          <button
            type="button"
            onClick={copyAddress}
            className="w-full py-2 rounded-lg text-xs font-medium border border-white/15 text-white/80 hover:bg-white/5"
          >
            Copy wallet address
          </button>
          <div className="space-y-3 pt-1">
            {faucetNetworks.map(({ chainId, name, faucets }) => (
              <div key={chainId}>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                  {name} (chain {chainId})
                </p>
                <div className="flex flex-wrap gap-2">
                  {faucets.map((f) => (
                    <a
                      key={f.url}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                    >
                      {f.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
