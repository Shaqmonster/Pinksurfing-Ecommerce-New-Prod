import React from "react";
import { useAddressTxHistory } from "../../hooks/useAddressTxHistory";
import { useEscrowPayoutHistory } from "../../hooks/useEscrowPayoutHistory";
import { SHOW_CRYPTO_WALLET } from "../../config/featureFlags";

function shortHash(h = "") {
  return h.length > 18 ? `${h.slice(0, 10)}...${h.slice(-6)}` : h;
}

function shortAddr(a = "") {
  return a.length > 18 ? `${a.slice(0, 10)}...${a.slice(-6)}` : a;
}

export default function WalletTxHistoryCard({
  address,
  escrowId,
  orderScoped = false,
  title = "Wallet Transaction History",
}) {
  const { rows, loading, error, refresh, range } = useAddressTxHistory(
    SHOW_CRYPTO_WALLET ? address : null,
    { maxBlocks: 350, maxRows: 50 }
  );
  const {
    rows: escrowRows,
    loading: escrowLoading,
    error: escrowError,
    refresh: refreshEscrow,
  } = useEscrowPayoutHistory(
    SHOW_CRYPTO_WALLET ? address : null,
    SHOW_CRYPTO_WALLET ? escrowId : null,
    { maxBlocks: 450, maxRows: 50, orderScoped }
  );

  if (!SHOW_CRYPTO_WALLET) return null;

  return (
    <div className="bg-ps-surface border border-ink/5 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-ink/50 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <button
          onClick={() => {
            refresh();
            refreshEscrow();
          }}
          disabled={loading || escrowLoading}
          className="px-2 py-1 rounded-md border border-ink/10 text-[11px] text-ink/60 hover:bg-ink/5 disabled:opacity-50"
        >
          {loading || escrowLoading ? "Scanning..." : "Rescan"}
        </button>
      </div>
      {range ? (
        <p className="text-[11px] text-ink/35 mb-2">Blocks #{range.from} - #{range.to}</p>
      ) : null}
      {error ? <p className="text-amber-400 text-xs mb-2">{error}</p> : null}
      {escrowError ? <p className="text-amber-400 text-xs mb-2">{escrowError}</p> : null}
      {escrowRows.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] text-ink/45 mb-1">Escrow release/queue events</p>
          <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
            {escrowRows.map((r, i) => (
              <div key={`${r.hash}-${i}`} className="rounded-md border border-ink/10 bg-ink/[0.02] p-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-300">{r.title}</span>
                  <span className="text-ink/70">{r.valueLabel}</span>
                </div>
                <p className="text-[10px] text-ink/45">Block #{r.blockNumber}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {!address ? (
        <p className="text-ink/40 text-sm">No wallet address connected.</p>
      ) : orderScoped ? (
        <p className="text-ink/40 text-sm">
          This view is scoped to current order escrow events.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-ink/40 text-sm">{loading ? "Loading..." : "No recent signed transactions found."}</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-auto pr-1">
          {rows.map((r) => (
            <div key={r.hash} className="rounded-lg border border-ink/10 bg-ink/[0.02] p-2">
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`px-2 py-0.5 rounded ${
                    r.kind === "contract" ? "bg-purple-500/15 text-purple-300" : "bg-blue-500/15 text-blue-300"
                  }`}
                >
                  {r.direction === "incoming" ? "Incoming" : r.kind === "contract" ? "Contract" : "Outgoing"}
                </span>
                <span className="text-ink/70">{r.valueLabel}</span>
              </div>
              <p className="text-[11px] text-ink/45 mt-1">Block #{r.blockNumber}</p>
              {r.direction === "incoming" ? (
                <p className="text-[11px] text-ink/45">
                  From: <span className="font-mono">{shortAddr(r.from || "")}</span>
                </p>
              ) : r.to ? (
                <p className="text-[11px] text-ink/45">
                  To: <span className="font-mono">{shortAddr(r.to)}</span>
                </p>
              ) : null}
              <p className="text-[11px] text-ink/55 font-mono mt-1">{shortHash(r.hash)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

