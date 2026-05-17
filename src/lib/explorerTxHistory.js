import { ethers } from "ethers";
import { isLocalAnvilEscrow } from "./devWalletFunding";

const EXPLORER_BY_CHAIN = {
  11155111: {
    name: "Etherscan Sepolia",
    baseUrl: "https://api-sepolia.etherscan.io/api",
  },
  84532: {
    name: "Basescan Sepolia",
    baseUrl: "https://api-sepolia.basescan.org/api",
  },
};

/**
 * @param {string} address
 * @returns {Promise<Array<{ hash: string; blockNumber: number; to: string; from: string; valueLabel: string; kind: string; direction: "incoming" | "outgoing" }> | null>}
 */
export async function fetchTxListFromExplorer(address) {
  const chainId = Number(import.meta.env.VITE_ESCROW_CHAIN_ID || 0);
  const explorer = EXPLORER_BY_CHAIN[chainId];
  if (!explorer) return null;

  const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY || "";
  const params = new URLSearchParams({
    module: "account",
    action: "txlist",
    address: ethers.getAddress(address),
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "15",
    sort: "desc",
  });
  if (apiKey) params.set("apikey", apiKey);

  const res = await fetch(`${explorer.baseUrl}?${params.toString()}`);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== "1" || !Array.isArray(data.result)) {
    return null;
  }

  const normalized = address.toLowerCase();
  return data.result.map((tx) => {
    const from = String(tx.from || "").toLowerCase();
    const to = String(tx.to || "").toLowerCase();
    const value = BigInt(tx.value || "0");
    return {
      hash: tx.hash,
      blockNumber: Number(tx.blockNumber || 0),
      to: tx.to || "",
      from: tx.from || "",
      valueLabel: value > 0n ? `${Number(ethers.formatEther(value)).toFixed(4)} ETH` : "0 ETH",
      kind: tx.input && tx.input !== "0x" ? "contract" : "transfer",
      direction: from === normalized ? "outgoing" : "incoming",
    };
  });
}

/** Block scan depth: generous on local Anvil, modest on public testnets. */
export function getTxScanBlockWindow() {
  if (isLocalAnvilEscrow()) return 4000;
  return 80;
}

export function shouldAutoScanTxHistory() {
  return true;
}
