import { anvil, base, baseSepolia, ethereum, sepolia } from "thirdweb/chains";

/** @type {Record<number, typeof anvil>} */
const CHAIN_BY_ID = {
  1: ethereum,
  11155111: sepolia,
  8453: base,
  84532: baseSepolia,
  31337: anvil,
};

/**
 * @param {number | string | undefined | null} chainId
 */
export function resolveThirdwebOnRampChain(chainId) {
  const n = typeof chainId === "string" ? Number(chainId) : chainId;
  if (n == null || Number.isNaN(Number(n))) {
    return anvil;
  }
  const id = Number(n);
  return CHAIN_BY_ID[id] ?? anvil;
}

/**
 * Chain used by Thirdweb Buy / fiat on-ramp.
 */
export function getThirdwebOnRampChainFromEnv() {
  const override = import.meta.env.VITE_THIRDWEB_ONRAMP_CHAIN_ID;
  if (override != null && String(override).trim() !== "") {
    return resolveThirdwebOnRampChain(override);
  }
  return resolveThirdwebOnRampChain(import.meta.env.VITE_ESCROW_CHAIN_ID);
}

/**
 * @returns {number | undefined}
 */
export function getEscrowChainIdFromEnv() {
  const raw = import.meta.env.VITE_ESCROW_CHAIN_ID;
  if (raw == null || String(raw).trim() === "") return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}
