import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import {
  getSharedGigHubProvider,
  isRpcRateLimited,
  getRpcRateLimitMessage,
  enqueueRpc,
  withRpcRetry,
} from "../lib/gighubRpc";
import {
  fetchTxListFromExplorer,
  getTxScanBlockWindow,
  shouldAutoScanTxHistory,
} from "../lib/explorerTxHistory";
import { isLocalAnvilEscrow } from "../lib/devWalletFunding";

async function scanBlocksRpc(normalized, maxBlocks, maxRows) {
  const provider = getSharedGigHubProvider();
  const latest = await withRpcRetry(() => provider.getBlockNumber());
  const fromBlock = Math.max(0, latest - maxBlocks);
  const out = [];

  for (let b = latest; b >= fromBlock; b -= 1) {
    const block = await enqueueRpc(() => provider.getBlock(b, false));
    const hashes = Array.isArray(block?.transactions) ? block.transactions : [];
    for (const hash of hashes) {
      if (typeof hash !== "string") continue;
      let tx;
      try {
        tx = await enqueueRpc(() => provider.getTransaction(hash));
      } catch {
        continue;
      }
      if (!tx?.from) continue;
      const fromMe = String(tx.from).toLowerCase() === normalized;
      const toMe = tx.to && String(tx.to).toLowerCase() === normalized;
      if (!fromMe && !toMe) continue;
      const value = tx.value ?? 0n;
      out.push({
        hash: tx.hash,
        blockNumber: b,
        to: tx.to || "",
        from: tx.from || "",
        valueLabel: value > 0n ? `${Number(ethers.formatEther(value)).toFixed(4)} ETH` : "0 ETH",
        kind: tx.data && tx.data !== "0x" ? "contract" : "transfer",
        direction: fromMe ? "outgoing" : "incoming",
      });
      if (out.length >= maxRows) break;
    }
    if (out.length >= maxRows) break;
  }

  return { rows: out, range: { from: fromBlock, to: latest } };
}

/**
 * Recent ETH transfers for the in-app wallet (explorer on testnet, RPC scan on Anvil).
 */
export function useAddressTxHistory(address, { maxRows = 40, autoScan } = {}) {
  const scanOnMount = autoScan ?? shouldAutoScanTxHistory();
  const maxBlocks = getTxScanBlockWindow();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState(null);
  const [source, setSource] = useState("");
  const scanTimerRef = useRef(null);

  const normalized = useMemo(() => {
    try {
      return address ? ethers.getAddress(address).toLowerCase() : "";
    } catch {
      return "";
    }
  }, [address]);

  const refresh = useCallback(async () => {
    if (!normalized) {
      setRows([]);
      setRange(null);
      setSource("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (!isLocalAnvilEscrow()) {
        const explorerRows = await fetchTxListFromExplorer(address);
        if (explorerRows && explorerRows.length > 0) {
          setRows(explorerRows.slice(0, maxRows));
          setRange(null);
          setSource("explorer");
          return;
        }
      }

      const { rows: scanned, range: scannedRange } = await scanBlocksRpc(normalized, maxBlocks, maxRows);
      setRows(scanned);
      setRange(scannedRange);
      setSource(isLocalAnvilEscrow() ? "anvil-rpc" : "rpc");
      if (scanned.length === 0 && !isLocalAnvilEscrow()) {
        setError(
          "No transfers found yet. Fund this wallet on the escrow testnet, or add VITE_ETHERSCAN_API_KEY for explorer history."
        );
      }
    } catch (e) {
      setError(isRpcRateLimited(e) ? getRpcRateLimitMessage() : e?.message || "Failed to load transactions.");
      setRows([]);
      setRange(null);
      setSource("");
    } finally {
      setLoading(false);
    }
  }, [address, maxBlocks, maxRows, normalized]);

  useEffect(() => {
    if (!scanOnMount || !normalized) return undefined;
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    scanTimerRef.current = setTimeout(() => {
      refresh();
    }, 800);
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, [scanOnMount, normalized, refresh]);

  return { rows, loading, error, refresh, range, source };
}
