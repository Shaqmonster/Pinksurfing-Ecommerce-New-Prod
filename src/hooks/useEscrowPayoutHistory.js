import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { getGigHubProvider } from "../lib/gighubEscrowClient";
import { getRpcRateLimitMessage, isRpcRateLimited, withRpcRetry } from "../lib/gighubRpc";
import { routerAbi } from "../abis/routerAbi";
import { servicesAbi } from "../abis/servicesAbi";

export function useEscrowPayoutHistory(
  address,
  escrowId,
  { maxBlocks = 12000, maxRows = 60, orderScoped = false, autoScan = false } = {}
) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      return;
    }
    if (orderScoped && !escrowId) {
      setRows([]);
      return;
    }
    const routerAddress = import.meta.env.VITE_ROUTER_ADDRESS;
    if (!routerAddress || routerAddress === "0x0000000000000000000000000000000000000000") {
      setRows([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const provider = getGigHubProvider();
      const routerCode = await withRpcRetry(() => provider.getCode(routerAddress));
      if (!routerCode || routerCode === "0x") {
        setRows([]);
        setError("Escrow contracts are not deployed on current local chain yet.");
        return;
      }
      const router = new ethers.Contract(routerAddress, routerAbi, provider);
      const servicesAddress = await router.servicesEscrow();
      const servicesCode = await withRpcRetry(() => provider.getCode(servicesAddress));
      if (!servicesCode || servicesCode === "0x") {
        setRows([]);
        setError("Services escrow contract missing on current chain.");
        return;
      }
      const iface = new ethers.Interface(servicesAbi);
      const latest = await withRpcRetry(() => provider.getBlockNumber());
      const fromBlock = Math.max(0, latest - maxBlocks);

      const out = [];
      const paymentTopic = ethers.id("PaymentReleased(bytes32,address,uint256,string)");
      const queuedTopic = ethers.id("WithdrawalQueued(address,uint256)");
      const execTopic = ethers.id("WithdrawalExecuted(address,uint256)");
      const accountTopic = ethers.zeroPadValue(ethers.getAddress(normalized), 32);
      const escrowTopic =
        escrowId && /^0x[0-9a-fA-F]{64}$/.test(escrowId) ? escrowId.toLowerCase() : null;

      const paymentLogs = await withRpcRetry(() =>
        provider.getLogs({
        address: servicesAddress,
        fromBlock,
        toBlock: latest,
        topics: escrowTopic ? [paymentTopic, escrowTopic] : [paymentTopic],
        })
      );
      for (const log of paymentLogs) {
        const parsed = iface.parseLog(log);
        const to = String(parsed?.args?.to || "").toLowerCase();
        if (to !== normalized) continue;
        const amount = parsed?.args?.amount ?? 0n;
        const stage = parsed?.args?.stage || "release";
        out.push({
          hash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          title: `Escrow release (${stage})`,
          valueLabel: `${Number(ethers.formatEther(amount)).toFixed(4)} ETH`,
        });
      }

      if (!orderScoped) {
        const queuedLogs = await withRpcRetry(() =>
          provider.getLogs({
          address: servicesAddress,
          fromBlock,
          toBlock: latest,
          topics: [queuedTopic, accountTopic],
          })
        );
        for (const log of queuedLogs) {
          const parsed = iface.parseLog(log);
          const amount = parsed?.args?.amount ?? 0n;
          out.push({
            hash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
            title: "Escrow queued to wallet",
            valueLabel: `${Number(ethers.formatEther(amount)).toFixed(4)} ETH`,
          });
        }

        const execLogs = await withRpcRetry(() =>
          provider.getLogs({
          address: servicesAddress,
          fromBlock,
          toBlock: latest,
          topics: [execTopic, accountTopic],
          })
        );
        for (const log of execLogs) {
          const parsed = iface.parseLog(log);
          const amount = parsed?.args?.amount ?? 0n;
          out.push({
            hash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
            title: "Escrow withdrawal executed",
            valueLabel: `${Number(ethers.formatEther(amount)).toFixed(4)} ETH`,
          });
        }
      }

      out.sort((a, b) => b.blockNumber - a.blockNumber);
      setRows(out.slice(0, maxRows));
    } catch (e) {
      const msg = e?.message || "Failed to load escrow payout events.";
      if (isRpcRateLimited(e)) {
        setError(getRpcRateLimitMessage());
      } else if (msg.includes("could not decode result data") || msg.includes("BAD_DATA")) {
        setError("Escrow contracts not ready on this chain (restart/deploy needed).");
      } else {
        setError(msg);
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [maxBlocks, maxRows, normalized, escrowId, orderScoped]);

  useEffect(() => {
    if (autoScan) refresh();
  }, [autoScan, refresh]);

  return { rows, loading, error, refresh };
}

