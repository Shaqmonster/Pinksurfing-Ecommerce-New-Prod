import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import QRCode from "qrcode.react";
import { IoWalletOutline, IoRefreshOutline, IoCopyOutline, IoCheckmarkDoneOutline } from "react-icons/io5";
import { useInAppWallet } from "../../context/inAppWalletContext";
import { getGigHubProvider, getGigHubContracts } from "../../lib/gighubEscrowClient";
import { useAddressTxHistory } from "../../hooks/useAddressTxHistory";

function shortHash(h = "") {
  return h.length > 18 ? `${h.slice(0, 10)}...${h.slice(-6)}` : h;
}

export default function InAppWalletBalanceCard({ compact = false }) {
  const { status, wallet, address } = useInAppWallet();
  const [ethBalance, setEthBalance] = useState("0.0000");
  const [pendingEscrow, setPendingEscrow] = useState("0.0000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const { rows, loading: txLoading, refresh: refreshTx } = useAddressTxHistory(address, {
    maxBlocks: 180,
    maxRows: compact ? 4 : 6,
  });

  const canLoad = status === "ready" && wallet && address;

  const refresh = async () => {
    if (!canLoad) return;
    setLoading(true);
    setError("");
    try {
      const provider = getGigHubProvider();
      const bal = await provider.getBalance(address);
      setEthBalance(Number(ethers.formatEther(bal)).toFixed(4));

      try {
        const signer = wallet.connect(provider);
        const { services } = await getGigHubContracts({ signer });
        const pending = await services.pendingWithdrawals(address);
        setPendingEscrow(Number(ethers.formatEther(pending)).toFixed(4));
      } catch {
        // If router/contracts are not configured yet, keep pending as zero.
        setPendingEscrow("0.0000");
      }
    } catch (e) {
      setError(e?.message || "Failed to load wallet balance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, address]);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const wrapperClass = useMemo(
    () =>
      compact
        ? "bg-[#13131a] border border-white/5 rounded-2xl p-4"
        : "bg-[#13131a] border border-white/5 rounded-2xl p-5",
    [compact]
  );

  return (
    <div className={wrapperClass}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">In-App Wallet</p>
        <button
          onClick={() => {
            refresh();
            refreshTx();
          }}
          disabled={!canLoad || loading}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all disabled:opacity-40"
          title="Refresh wallet balance"
        >
          <IoRefreshOutline className={`text-sm ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!canLoad ? (
        <div className="text-white/40 text-sm">
          Wallet not connected yet. Go to <span className="font-mono">/gighub</span> and create/import it.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <IoWalletOutline className="text-sm text-purple-400" />
            <span className="font-mono break-all" title={address}>
              {address}
            </span>
            <button
              onClick={copyAddress}
              className="ml-auto p-1 rounded text-white/40 hover:text-white/75 hover:bg-white/5 transition-all"
              title="Copy wallet address"
            >
              {copied ? <IoCheckmarkDoneOutline className="text-emerald-300" /> : <IoCopyOutline />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <div>
              <p className="text-white/35 text-[11px] mb-1">Receive to this wallet</p>
              <p className="text-white/50 text-[10px]">Scan QR or copy address</p>
            </div>
            <div className="bg-white p-1.5 rounded-lg">
              <QRCode value={address} size={compact ? 58 : 72} level="M" includeMargin={false} />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/35 text-xs">Wallet Balance</p>
              <p className="text-white font-bold text-xl">{ethBalance} ETH</p>
            </div>
            <div className="text-right">
              <p className="text-white/35 text-xs">Escrow Pending (withdrawable)</p>
              <p className="text-white/80 font-semibold text-sm">{pendingEscrow} ETH</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/45 text-[11px]">Recent wallet transactions</p>
              <button
                onClick={refreshTx}
                disabled={txLoading}
                className="text-[11px] px-2 py-0.5 rounded border border-white/10 text-white/55 hover:bg-white/5 disabled:opacity-50"
              >
                {txLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {rows.length === 0 ? (
              <p className="text-white/35 text-xs">{txLoading ? "Scanning recent blocks..." : "No recent transactions."}</p>
            ) : (
              <div className="space-y-1.5 max-h-28 overflow-auto pr-1">
                {rows.map((r) => (
                  <div key={r.hash} className="flex items-center justify-between text-[11px] border border-white/10 rounded-md p-1.5">
                    <span className="text-white/70">{r.direction === "incoming" ? "Incoming" : "Outgoing"}</span>
                    <span className="text-white/60">{r.valueLabel}</span>
                    <span className="text-white/35 font-mono">{shortHash(r.hash)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error ? <p className="text-amber-400 text-xs">{error}</p> : null}
          {!error && canLoad && ethBalance === "0.0000" ? (
            <p className="text-amber-400 text-xs">
              Dev note: this wallet has no local Anvil ETH yet. Fund this exact address from account #0 or import a pre-funded Anvil wallet.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

