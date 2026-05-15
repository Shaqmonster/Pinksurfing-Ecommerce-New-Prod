import React, { useMemo, useState } from "react";
import { ethers } from "ethers";
import { useInAppWallet } from "../../context/inAppWalletContext";
import { getGigHubContracts, getGigHubProvider } from "../../lib/gighubEscrowClient";

export default function GigHubEscrowPlayground() {
  const { status, wallet } = useInAppWallet();
  const [seller, setSeller] = useState("");
  const [amountEth, setAmountEth] = useState("0.01");
  const [deadlinesCsv, setDeadlinesCsv] = useState("");
  const [txHash, setTxHash] = useState("");
  const [escrowId, setEscrowId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const provider = useMemo(() => {
    try {
      return getGigHubProvider();
    } catch {
      return null;
    }
  }, []);

  const canUse = status === "ready" && wallet && provider;

  const parseDeadlines = () => {
    const t = deadlinesCsv.trim();
    if (!t) return [];
    return t
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => BigInt(x));
  };

  const onCreate = async () => {
    setError("");
    setTxHash("");
    setEscrowId("");
    if (!canUse) return;
    if (!ethers.isAddress(seller)) {
      setError("Invalid seller address.");
      return;
    }

    setBusy(true);
    try {
      const signer = wallet.connect(provider);
      const { router } = await getGigHubContracts({ signer });

      const totalAmountWei = ethers.parseEther(amountEth || "0");
      const deadlines = parseDeadlines();

      // GigHub / services escrow is productType 3
      const tx = await router.createEscrow(3, seller, totalAmountWei, deadlines, { value: totalAmountWei });
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      const routed = receipt?.logs
        ?.map((l) => {
          try {
            return router.interface.parseLog(l);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .find((p) => p.name === "RoutedEscrowCreated");

      if (routed?.args?.escrowId) {
        setEscrowId(routed.args.escrowId);
      }
    } catch (e) {
      setError(e?.shortMessage || e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">GigHub Escrow Playground</h1>
        <p className="text-white/60 text-sm mb-6">
          Uses the in-app wallet signer and calls <span className="font-mono">EscrowRouter.createEscrow</span> with{" "}
          <span className="font-mono">productType=3</span> (ServicesEscrow). This page is GigHub-only.
        </p>

        {!provider ? (
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5 text-white/70">
            Missing RPC config. Set <span className="font-mono">VITE_ESCROW_RPC_URL</span> and{" "}
            <span className="font-mono">VITE_ROUTER_ADDRESS</span> in your frontend env.
          </div>
        ) : null}

        {status !== "ready" ? (
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5 text-white/70">
            In-app wallet not ready. Go to <span className="font-mono">/gighub</span> and create/import it first.
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-white/60">Seller address</span>
            <input
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              placeholder="0x..."
              className="px-4 py-3 rounded-2xl bg-[#13131a] border border-white/10 outline-none focus:border-purple-500"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-white/60">Amount (ETH)</span>
            <input
              value={amountEth}
              onChange={(e) => setAmountEth(e.target.value)}
              placeholder="0.01"
              className="px-4 py-3 rounded-2xl bg-[#13131a] border border-white/10 outline-none focus:border-purple-500"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-white/60">Milestone deadlines (comma-separated unix seconds)</span>
            <input
              value={deadlinesCsv}
              onChange={(e) => setDeadlinesCsv(e.target.value)}
              placeholder="1710000000,1710500000"
              className="px-4 py-3 rounded-2xl bg-[#13131a] border border-white/10 outline-none focus:border-purple-500"
            />
          </label>

          <button
            onClick={onCreate}
            disabled={!canUse || busy}
            className="mt-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 disabled:opacity-50 font-semibold"
          >
            {busy ? "Creating..." : "Create Services Escrow (type 3)"}
          </button>

          {txHash ? (
            <div className="text-sm text-white/70">
              Tx hash: <span className="font-mono">{txHash}</span>
            </div>
          ) : null}
          {escrowId ? (
            <div className="text-sm text-white/70">
              Escrow ID: <span className="font-mono">{escrowId}</span>
            </div>
          ) : null}
          {error ? <div className="text-sm text-red-400">{error}</div> : null}
        </div>
      </div>
    </div>
  );
}

