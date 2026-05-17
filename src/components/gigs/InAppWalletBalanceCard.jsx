import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import QRCode from "qrcode.react";
import { IoWalletOutline, IoRefreshOutline, IoCopyOutline, IoCheckmarkDoneOutline } from "react-icons/io5";
import { useInAppWallet } from "../../context/inAppWalletContext";
import { getGigHubProvider, getGigHubContracts } from "../../lib/gighubEscrowClient";
import { fetchEthBalance, getRpcRateLimitMessage, isRpcRateLimited } from "../../lib/gighubRpc";
import { useAddressTxHistory } from "../../hooks/useAddressTxHistory";
import { isDevWalletFundingEnabled, isLocalAnvilEscrow } from "../../lib/devWalletFunding";
import { useAnvilAutoFund } from "../../hooks/useAnvilAutoFund";
import { getThirdwebClient } from "../../lib/thirdwebClient";
import { getEscrowChainIdFromEnv } from "../../lib/thirdwebOnRampChain";
import DevWalletFundingPanel from "./DevWalletFundingPanel";

const GighubFundWalletModal = lazy(() => import("./GighubThirdwebOnRamp"));

function shortHash(h = "") {
  return h.length > 18 ? `${h.slice(0, 10)}...${h.slice(-6)}` : h;
}

export default function InAppWalletBalanceCard({ compact = false, inlineFunding = false }) {
  const {
    status,
    wallet,
    address,
    serverBackup,
    syncingBackup,
    ensureServerBackup,
    lastError: walletError,
  } = useInAppWallet();
  const [ethBalance, setEthBalance] = useState("0.0000");
  const [pendingEscrow, setPendingEscrow] = useState("0.0000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [onRampOpen, setOnRampOpen] = useState(false);
  const thirdwebClient = useMemo(() => getThirdwebClient(), []);
  const localAnvil = isLocalAnvilEscrow();
  const showDevFunding = isDevWalletFundingEnabled();
  const showThirdwebFunding = Boolean(thirdwebClient) && !localAnvil;
  const canFundWallet = showDevFunding || showThirdwebFunding;
  const escrowChainId = getEscrowChainIdFromEnv();
  const { rows, loading: txLoading, error: txError, refresh: refreshTx } = useAddressTxHistory(address, {
    maxRows: compact ? 4 : 6,
  });

  const canLoad = status === "ready" && Boolean(address) && Boolean(wallet);

  const refresh = async () => {
    if (!canLoad || !wallet) return;
    setLoading(true);
    setError("");
    try {
      const provider = getGigHubProvider();
      setEthBalance(await fetchEthBalance(address));

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
      setError(
        isRpcRateLimited(e) ? getRpcRateLimitMessage() : e?.message || "Failed to load wallet balance."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, address]);

  useAnvilAutoFund(address, status, () => {
    refresh();
    refreshTx();
  });

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
        <div className="text-white/40 text-sm space-y-2">
          <p>Wallet not connected yet.</p>
          <p className="text-white/35 text-xs">
            {inlineFunding
              ? "Use Create wallet / Import seed above — test ETH is minted automatically on Anvil."
              : (
                <>
                  Go to <span className="font-mono">/gighub</span> or profile wallet to create or import one.
                </>
              )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span
              className={`px-2 py-0.5 rounded-full border ${
                serverBackup
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-200"
              }`}
            >
              {serverBackup ? "Backed up to account" : "This device only — sync account"}
            </span>
            {!serverBackup && (
              <button
                type="button"
                onClick={() => ensureServerBackup()}
                disabled={syncingBackup}
                className="px-2 py-0.5 rounded-full border border-white/15 text-white/70 hover:bg-white/5 disabled:opacity-50"
              >
                {syncingBackup ? "Syncing…" : "Sync to account"}
              </button>
            )}
          </div>
          {walletError ? <p className="text-[11px] text-red-400/90">{walletError}</p> : null}
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

          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <p className="text-white/35 text-xs">Wallet Balance</p>
              <p className="text-white font-bold text-xl">{ethBalance} ETH</p>
            </div>
            <div className="text-right flex-1 min-w-[120px]">
              <p className="text-white/35 text-xs">Escrow Pending (withdrawable)</p>
              <p className="text-white/80 font-semibold text-sm">{pendingEscrow} ETH</p>
            </div>
            {canFundWallet ? (
              <button
                type="button"
                onClick={() => setOnRampOpen(true)}
                className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-95 shadow-lg"
              >
                Add funds
              </button>
            ) : null}
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
            {txError ? <p className="text-amber-400/90 text-[11px] mb-1.5">{txError}</p> : null}
            {rows.length === 0 ? (
              <p className="text-white/35 text-xs">
                {txLoading
                  ? "Loading recent transfers…"
                  : localAnvil
                    ? "No transfers yet. Use Mint test ETH or wait for auto-fund."
                    : `No transfers yet. Fund on chain ${escrowChainId ?? "?"}.`}
              </p>
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
              {localAnvil
                ? "Low balance — auto-funding on Anvil, or use Mint test ETH below."
                : (
                  <>
                    No test ETH yet. Use <strong>Add funds</strong> below (chain {escrowChainId ?? "?"}).
                  </>
                )}
            </p>
          ) : null}

          {inlineFunding && canFundWallet ? (
            <div className="pt-4 mt-1 border-t border-white/10 space-y-4">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Fund wallet (testnet)</p>
              {showDevFunding ? (
                <DevWalletFundingPanel
                  address={address}
                  onFunded={() => {
                    refresh();
                    refreshTx();
                  }}
                />
              ) : null}
              {showThirdwebFunding ? (
                <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3 space-y-2">
                  <p className="text-white/75 text-xs font-semibold">Thirdweb (card or crypto)</p>
                  <p className="text-white/45 text-[11px] leading-relaxed">
                    Buy test ETH with a card or crypto (public testnets only).
                  </p>
                  <button
                    type="button"
                    onClick={() => setOnRampOpen(true)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-95"
                  >
                    Open Thirdweb checkout
                  </button>
                </div>
              ) : null}
              {!showDevFunding && !showThirdwebFunding ? (
                <p className="text-white/40 text-xs">Set VITE_THIRDWEB_CLIENT_ID in .env.local to enable card funding.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {canFundWallet && address ? (
        <Suspense fallback={null}>
          <GighubFundWalletModal
            open={onRampOpen}
            onClose={() => setOnRampOpen(false)}
            receiverAddress={address}
            onPurchaseSuccess={() => {
              refresh();
              refreshTx();
            }}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

