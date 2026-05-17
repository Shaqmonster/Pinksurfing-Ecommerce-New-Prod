import { ethers } from "ethers";
import { isLocalAnvilEscrow } from "./devWalletFunding";

let cachedProvider = null;
let rpcChain = Promise.resolve();

const RPC_GAP_MS = 100;
const DEFAULT_RPC = "http://127.0.0.1:8545";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Serialize JSON-RPC calls so public endpoints are less likely to return 429.
 */
export function enqueueRpc(task) {
  const run = rpcChain.then(() => task());
  rpcChain = run
    .catch(() => {})
    .then(() => sleep(RPC_GAP_MS));
  return run;
}

export function isRpcRateLimited(error) {
  const msg = String(error?.message || error?.info?.payload?.error?.message || error || "").toLowerCase();
  const code = error?.info?.error?.code ?? error?.code;
  return code === 429 || msg.includes("429") || msg.includes("rate limit") || msg.includes("too many request");
}

export function getRpcRateLimitMessage() {
  if (isLocalAnvilEscrow()) {
    return "Could not reach Anvil at localhost:8545. Run bash setup-anvil.sh from the repo root.";
  }
  return "RPC rate limit (429). Retry or set VITE_ESCROW_RPC_URL in .env.local.";
}

export function getGigHubRpcConfig() {
  const rpcUrl = import.meta.env.VITE_ESCROW_RPC_URL || import.meta.env.VITE_RPC_URL || DEFAULT_RPC;
  const chainId = Number(import.meta.env.VITE_ESCROW_CHAIN_ID || 0) || undefined;
  return { rpcUrl, chainId };
}

export function getSharedGigHubProvider() {
  const { rpcUrl, chainId } = getGigHubRpcConfig();
  if (!rpcUrl) {
    throw new Error("Missing RPC URL. Set VITE_ESCROW_RPC_URL (or VITE_RPC_URL).");
  }
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider(rpcUrl, chainId);
  }
  return cachedProvider;
}

/**
 * @param {() => Promise<T>} fn
 * @param {{ retries?: number }} [opts]
 * @returns {Promise<T>}
 */
export async function withRpcRetry(fn, { retries = 3 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await enqueueRpc(fn);
    } catch (e) {
      lastError = e;
      if (!isRpcRateLimited(e) || attempt === retries - 1) throw e;
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function fetchEthBalance(address) {
  const provider = getSharedGigHubProvider();
  const bal = await withRpcRetry(() => provider.getBalance(address));
  return Number(ethers.formatEther(bal)).toFixed(4);
}
