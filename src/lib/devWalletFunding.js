import { ethers } from "ethers";

/** GigHub default shared test environment (local Anvil). */
export const GIGHUB_TESTNET_CHAIN_ID = 31337;

/** @type {Record<number, { name: string; faucets: Array<{ label: string; url: string }> }>} */
export const TESTNET_FAUCETS_BY_CHAIN = {
  11155111: {
    name: "Ethereum Sepolia",
    faucets: [
      { label: "Alchemy Sepolia faucet", url: "https://www.alchemy.com/faucets/ethereum-sepolia" },
      { label: "Google Cloud Sepolia", url: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia" },
      { label: "Coinbase Sepolia faucet", url: "https://www.coinbase.com/faucets/ethereum-sepolia" },
    ],
  },
  84532: {
    name: "Base Sepolia",
    faucets: [
      { label: "Alchemy Base Sepolia", url: "https://www.alchemy.com/faucets/base-sepolia" },
      { label: "Coinbase Base Sepolia", url: "https://www.coinbase.com/faucets/base-sepolia-faucet" },
    ],
  },
  80002: {
    name: "Polygon Amoy",
    faucets: [
      { label: "Polygon faucet", url: "https://faucet.polygon.technology/" },
    ],
  },
};

const LOCAL_CHAIN_IDS = new Set([31337, 1337]);

/**
 * @param {string | undefined} rpcUrl
 */
export function isLocalRpcUrl(rpcUrl) {
  if (!rpcUrl) return false;
  try {
    const u = new URL(rpcUrl);
    return u.hostname === "127.0.0.1" || u.hostname === "localhost";
  } catch {
    return /127\.0\.0\.1|localhost/i.test(rpcUrl);
  }
}

/** Chain id is local Anvil / Hardhat (31337 or 1337). */
export function isAnvilEscrowChain() {
  return LOCAL_CHAIN_IDS.has(Number(import.meta.env.VITE_ESCROW_CHAIN_ID || 0));
}

/**
 * True when escrow uses Anvil: localhost RPC (dev) or same-origin /anvil-rpc proxy (server).
 */
export function isLocalAnvilEscrow() {
  if (!isAnvilEscrowChain()) return false;
  const rpc = import.meta.env.VITE_ESCROW_RPC_URL || "";
  if (isLocalRpcUrl(rpc)) return true;
  const fundRpc = String(import.meta.env.VITE_ANVIL_FUND_RPC || "").trim();
  return fundRpc.length > 0 && import.meta.env.VITE_ENABLE_DEV_WALLET_FUNDING === "true";
}

/**
 * JSON-RPC URL used from the browser for anvil_setBalance (Vite proxy avoids CORS).
 */
export function getAnvilFundRpcUrl() {
  const proxy = import.meta.env.VITE_ANVIL_FUND_RPC;
  if (proxy && String(proxy).trim()) return String(proxy).trim();
  if (import.meta.env.DEV) return "/anvil-rpc";
  return import.meta.env.VITE_ESCROW_RPC_URL || "";
}

/**
 * Mint ETH on local Anvil only (anvil_setBalance). No Django / Thirdweb required.
 *
 * @param {string} address
 * @param {string} [etherAmount]
 */
export async function fundAddressViaAnvil(address, etherAmount = "10") {
  if (!isAnvilEscrowChain()) {
    throw new Error("Anvil mint is only available when VITE_ESCROW_CHAIN_ID is 31337.");
  }
  const rpcUrl = getAnvilFundRpcUrl();
  if (!rpcUrl) throw new Error("Missing Anvil RPC URL.");

  const wei = ethers.toBeHex(ethers.parseEther(etherAmount));
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "anvil_setBalance",
      params: [address, wei],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anvil RPC HTTP ${res.status}. Is \`anvil\` running on port 8545?`);
  }

  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.message || "anvil_setBalance failed. Use Foundry Anvil, not a remote node.");
  }
}

export function isDevWalletFundingEnabled() {
  if (import.meta.env.VITE_ENABLE_DEV_WALLET_FUNDING === "false") return false;
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_WALLET_FUNDING === "true";
}

/**
 * Faucets for the chain in VITE_ESCROW_CHAIN_ID (empty on local Anvil).
 */
export function getFaucetsForEscrowChain() {
  if (isLocalAnvilEscrow()) return [];
  const chainId = Number(import.meta.env.VITE_ESCROW_CHAIN_ID || 0);
  const net = TESTNET_FAUCETS_BY_CHAIN[chainId];
  if (!net) return [];
  return [{ chainId, ...net }];
}

/** @deprecated Use isLocalAnvilEscrow for default setup. */
export function isSepoliaTestnetEscrow() {
  return Number(import.meta.env.VITE_ESCROW_CHAIN_ID || 0) === 11155111;
}

export function getEscrowNetworkLabel() {
  if (isLocalAnvilEscrow()) return "Local Anvil";
  const chainId = Number(import.meta.env.VITE_ESCROW_CHAIN_ID || 0);
  const net = TESTNET_FAUCETS_BY_CHAIN[chainId];
  return net?.name || `chain ${chainId || "?"}`;
}
