import { useEffect, useRef } from "react";
import { fundAddressViaAnvil, isLocalAnvilEscrow } from "../lib/devWalletFunding";
import { fetchEthBalance } from "../lib/gighubRpc";

const MIN_BALANCE_ETH = 0.05;
const MINT_AMOUNT = "100";

/**
 * On local Anvil, top up in-app wallet when balance is low (no faucets).
 */
export function useAnvilAutoFund(address, status, onFunded) {
  const attempted = useRef(false);

  useEffect(() => {
    attempted.current = false;
  }, [address]);

  useEffect(() => {
    if (!isLocalAnvilEscrow() || status !== "ready" || !address || attempted.current) return;

    let cancelled = false;
    attempted.current = true;

    (async () => {
      try {
        const bal = Number(await fetchEthBalance(address));
        if (cancelled || bal >= MIN_BALANCE_ETH) return;
        await fundAddressViaAnvil(address, MINT_AMOUNT);
        if (!cancelled) onFunded?.();
      } catch {
        // User can still use Mint button; Anvil may be stopped.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, status, onFunded]);
}
