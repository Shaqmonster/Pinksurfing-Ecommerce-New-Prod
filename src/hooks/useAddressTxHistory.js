import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { getGigHubProvider } from "../lib/gighubEscrowClient";

export function useAddressTxHistory(address, { maxBlocks = 250, maxRows = 40 } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState(null);

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
      return;
    }
    setLoading(true);
    setError("");
    try {
      const provider = getGigHubProvider();
      const latest = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latest - maxBlocks);
      const out = [];
      for (let b = latest; b >= fromBlock; b--) {
        const block = await provider.getBlock(b, true);
        const txs = Array.isArray(block?.transactions) ? block.transactions : [];
        for (const rawTx of txs) {
          let tx = rawTx;
          if (typeof rawTx === "string") {
            try {
              tx = await provider.getTransaction(rawTx);
            } catch {
              continue;
            }
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
      setRows(out);
      setRange({ from: fromBlock, to: latest });
    } catch (e) {
      setError(e?.message || "Failed to scan transactions.");
      setRows([]);
      setRange(null);
    } finally {
      setLoading(false);
    }
  }, [maxBlocks, maxRows, normalized]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, loading, error, refresh, range };
}

