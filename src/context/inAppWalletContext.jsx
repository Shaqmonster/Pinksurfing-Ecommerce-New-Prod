import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { authContext } from "./authContext";
import { encryptJsonToB64, decryptJsonFromB64 } from "../lib/cryptoVault";
import { walletGetBackup, walletGetChallenge, walletPutBackup } from "../api/wallet";

const STORAGE_KEY = "ps_inapp_wallet_v1";

export const inAppWalletContext = createContext(null);

function readLocalVault() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLocalVault(encrypted_b64) {
  localStorage.setItem(STORAGE_KEY, encrypted_b64);
}

function clearLocalVault() {
  localStorage.removeItem(STORAGE_KEY);
}

function normalizeMnemonic(phrase) {
  return phrase
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .join(" ");
}

async function buildWalletFromMnemonic(mnemonic) {
  const phrase = normalizeMnemonic(mnemonic);
  return ethers.Wallet.fromPhrase(phrase);
}

export function InAppWalletProvider({ children }) {
  const { authToken } = useContext(authContext);

  const [status, setStatus] = useState("booting"); // booting | ready | none | error
  const [address, setAddress] = useState("");
  const [wallet, setWallet] = useState(null);
  const [lastError, setLastError] = useState("");

  const hasLocal = useMemo(() => !!readLocalVault(), []);

  const loadFromLocal = useCallback(async () => {
    const encrypted_b64 = readLocalVault();
    if (!encrypted_b64) return false;
    const json = await decryptJsonFromB64({ encrypted_b64, password: "" });
    if (!json?.mnemonic) throw new Error("Local vault missing mnemonic.");
    const w = await buildWalletFromMnemonic(json.mnemonic);
    setWallet(w);
    setAddress(w.address);
    return true;
  }, []);

  const backupToServer = useCallback(
    async (w, encrypted_b64, crypto_params) => {
      if (!authToken) return;

      const { nonce } = await walletGetChallenge(authToken);
      const sig = await w.signMessage(`Pinksurfing Wallet Backup:\n${nonce}`);

      await walletPutBackup(authToken, {
        evm_address: w.address,
        encrypted_backup: encrypted_b64,
        crypto_params,
        signature: sig,
      });
    },
    [authToken]
  );

  const createWallet = useCallback(
    async ({ wordCount = 12 } = {}) => {
      setLastError("");
      const w = ethers.Wallet.createRandom();
      const phrase = w.mnemonic?.phrase;
      if (!phrase) throw new Error("Failed to generate mnemonic.");

      const words = phrase.trim().split(/\s+/);
      if (wordCount === 12 && words.length !== 12) {
        // ethers may default to 12; keep this guard anyway.
      }

      const { encrypted_b64, crypto_params } = await encryptJsonToB64({
        json: { mnemonic: phrase },
        password: "",
      });

      writeLocalVault(encrypted_b64);
      setWallet(w);
      setAddress(w.address);
      setStatus("ready");

      if (authToken) {
        await backupToServer(w, encrypted_b64, crypto_params);
      }

      return { mnemonic: phrase, address: w.address };
    },
    [authToken, backupToServer]
  );

  const importMnemonic = useCallback(
    async (mnemonic) => {
      setLastError("");
      const w = await buildWalletFromMnemonic(mnemonic);
      const { encrypted_b64, crypto_params } = await encryptJsonToB64({
        json: { mnemonic: normalizeMnemonic(mnemonic) },
        password: "",
      });
      writeLocalVault(encrypted_b64);
      setWallet(w);
      setAddress(w.address);
      setStatus("ready");

      if (authToken) {
        await backupToServer(w, encrypted_b64, crypto_params);
      }

      return { address: w.address };
    },
    [authToken, backupToServer]
  );

  const restoreFromServer = useCallback(async () => {
    if (!authToken) return false;
    const data = await walletGetBackup(authToken);
    if (!data?.exists || !data?.encrypted_backup) return false;

    const json = await decryptJsonFromB64({ encrypted_b64: data.encrypted_backup, password: "" });
    if (!json?.mnemonic) throw new Error("Server vault missing mnemonic.");

    const w = await buildWalletFromMnemonic(json.mnemonic);
    writeLocalVault(data.encrypted_backup);
    setWallet(w);
    setAddress(w.address);
    return true;
  }, [authToken]);

  const resetWallet = useCallback(async () => {
    clearLocalVault();
    setWallet(null);
    setAddress("");
    setStatus("none");
  }, []);

  // Boot: load local first; if none and logged in, try server restore.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setStatus("booting");
        setLastError("");

        const localOk = await loadFromLocal().catch(() => false);
        if (cancelled) return;
        if (localOk) {
          setStatus("ready");
          return;
        }

        const serverOk = await restoreFromServer().catch(() => false);
        if (cancelled) return;
        if (serverOk) {
          setStatus("ready");
          return;
        }

        setStatus("none");
      } catch (e) {
        if (cancelled) return;
        setLastError(e?.message || String(e));
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken, loadFromLocal, restoreFromServer]);

  const value = useMemo(
    () => ({
      status,
      address,
      wallet,
      lastError,
      hasLocal,
      createWallet,
      importMnemonic,
      restoreFromServer,
      resetWallet,
    }),
    [status, address, wallet, lastError, hasLocal, createWallet, importMnemonic, restoreFromServer, resetWallet]
  );

  return <inAppWalletContext.Provider value={value}>{children}</inAppWalletContext.Provider>;
}

export function useInAppWallet() {
  const ctx = useContext(inAppWalletContext);
  if (!ctx) throw new Error("useInAppWallet must be used within InAppWalletProvider");
  return ctx;
}

