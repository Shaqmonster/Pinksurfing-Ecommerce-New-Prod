import { ethers } from "ethers";

/**
 * Seller receives escrow payouts — must be backed up on the server under the seller account email.
 */
export function resolveSellerAddress(order, gig) {
  const envFallback = import.meta.env.VITE_GIGHUB_DEFAULT_SELLER_ADDRESS;
  const candidates = [
    order?.seller_wallet_address,
    gig?.worker?.wallet_address,
    envFallback,
  ];
  for (const raw of candidates) {
    const v = String(raw || "").trim();
    if (v && ethers.isAddress(v)) {
      return ethers.getAddress(v);
    }
  }
  return null;
}

/**
 * @returns {string[]} Human-readable blockers before creating on-chain escrow.
 */
export function getEscrowPartyIssues({ buyerWallet, buyerStatus, sellerAddress }) {
  const issues = [];
  if (buyerStatus !== "ready" || !buyerWallet) {
    issues.push(
      "Buyer: open GigHub → Wallet, create or restore your in-app wallet (must show Ready), then try checkout again."
    );
  }
  if (!sellerAddress) {
    issues.push(
      "Seller: the gig owner must sign in, open GigHub → Wallet, and back up their wallet (same email as their seller account)."
    );
  }
  return issues;
}
