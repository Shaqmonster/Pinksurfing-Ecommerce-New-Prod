import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { authContext } from "./authContext";
import { encryptJsonToB64, decryptJsonFromB64 } from "../lib/cryptoVault";
import { walletGetBackup, walletGetChallenge, walletPutBackup } from "../api/wallet";
import {
  clearWalletVault,
  emailFromAuthUser,
  emailFromJwt,
  hasWalletVault,
  migrateLegacyWalletVault,
  normalizeAccountEmail,
  readWalletVault,
  writeWalletVault,
} from "../lib/walletStorage";

export const inAppWalletContext = createContext(null);

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
  const { authToken, user } = useContext(authContext);

  const accountEmail = useMemo(() => {
    const fromUser = emailFromAuthUser(user);
    if (fromUser) return normalizeAccountEmail(fromUser);
    return normalizeAccountEmail(emailFromJwt(authToken));
  }, [user, authToken]);

  const [status, setStatus] = useState("booting"); // booting | ready | none | error
  const [address, setAddress] = useState("");
  const [wallet, setWallet] = useState(null);
  const [lastError, setLastError] = useState("");
  const [serverBackup, setServerBackup] = useState(false);
  const [syncingBackup, setSyncingBackup] = useState(false);
  const autoBackupAttempted = useRef(false);

  const hasLocal = useMemo(() => hasWalletVault(accountEmail), [accountEmail]);

  useEffect(() => {
    autoBackupAttempted.current = false;
  }, [accountEmail]);

  const loadFromLocal = useCallback(async () => {
    if (accountEmail) migrateLegacyWalletVault(accountEmail);
    const encrypted_b64 = readWalletVault(accountEmail);
    if (!encrypted_b64) return false;
    const json = await decryptJsonFromB64({ encrypted_b64, password: "" });
    if (!json?.mnemonic) throw new Error("Local vault missing mnemonic.");
    const w = await buildWalletFromMnemonic(json.mnemonic);
    setWallet(w);
    setAddress(w.address);
    return w.address;
  }, [accountEmail]);

  const backupToServer = useCallback(
    async (w, encrypted_b64, crypto_params) => {
      if (!authToken) return false;

      const { nonce } = await walletGetChallenge(authToken);
      const sig = await w.signMessage(`Pinksurfing Wallet Backup:\n${nonce}`);

      await walletPutBackup(authToken, {
        evm_address: w.address,
        encrypted_backup: encrypted_b64,
        crypto_params,
        signature: sig,
      });
      setServerBackup(true);
      return true;
    },
    [authToken]
  );

  const ensureServerBackup = useCallback(async () => {
    if (!authToken || !wallet) return false;
    try {
      setSyncingBackup(true);
      const existing = await walletGetBackup(authToken);
      if (
        existing?.exists &&
        existing?.evm_address?.toLowerCase() === wallet.address.toLowerCase()
      ) {
        setServerBackup(true);
        return true;
      }

      const encrypted_b64 = readWalletVault(accountEmail);
      let payload = encrypted_b64;
      let crypto_params = existing?.crypto_params || {};

      if (!payload) {
        const json = { mnemonic: wallet.mnemonic?.phrase };
        if (!json.mnemonic) throw new Error("Cannot backup: wallet has no mnemonic.");
        const packed = await encryptJsonToB64({ json, password: "" });
        payload = packed.encrypted_b64;
        crypto_params = packed.crypto_params;
        writeWalletVault(accountEmail, payload);
      }

      await backupToServer(wallet, payload, crypto_params);
      return true;
    } catch (e) {
      setLastError(e?.message || String(e));
      return false;
    } finally {
      setSyncingBackup(false);
    }
  }, [authToken, wallet, accountEmail, backupToServer]);

  const createWallet = useCallback(
    async ({ wordCount = 12 } = {}) => {
      setLastError("");
      const w = ethers.Wallet.createRandom();
      const phrase = w.mnemonic?.phrase;
      if (!phrase) throw new Error("Failed to generate mnemonic.");

      if (wordCount === 12 && phrase.trim().split(/\s+/).length !== 12) {
        // ethers may default to 12; keep this guard anyway.
      }

      const { encrypted_b64, crypto_params } = await encryptJsonToB64({
        json: { mnemonic: phrase },
        password: "",
      });

      writeWalletVault(accountEmail, encrypted_b64);
      setWallet(w);
      setAddress(w.address);
      setStatus("ready");

      if (authToken) {
        try {
          await backupToServer(w, encrypted_b64, crypto_params);
        } catch (e) {
          setLastError(
            e?.response?.data?.detail ||
              e?.message ||
              "Wallet created on this device but account backup failed. Use “Sync to account” after login."
          );
        }
      }

      return { mnemonic: phrase, address: w.address };
    },
    [authToken, accountEmail, backupToServer]
  );

  const importMnemonic = useCallback(
    async (mnemonic) => {
      setLastError("");
      const w = await buildWalletFromMnemonic(mnemonic);
      const { encrypted_b64, crypto_params } = await encryptJsonToB64({
        json: { mnemonic: normalizeMnemonic(mnemonic) },
        password: "",
      });
      writeWalletVault(accountEmail, encrypted_b64);
      setWallet(w);
      setAddress(w.address);
      setStatus("ready");

      if (authToken) {
        try {
          await backupToServer(w, encrypted_b64, crypto_params);
        } catch (e) {
          setLastError(
            e?.response?.data?.detail ||
              e?.message ||
              "Wallet imported locally but account backup failed. Try “Sync to account”."
          );
        }
      }

      return { address: w.address };
    },
    [authToken, accountEmail, backupToServer]
  );

  const restoreFromServer = useCallback(async () => {
    if (!authToken) return false;
    const data = await walletGetBackup(authToken);
    if (!data?.exists || !data?.encrypted_backup) {
      setServerBackup(false);
      return false;
    }

    const json = await decryptJsonFromB64({ encrypted_b64: data.encrypted_backup, password: "" });
    if (!json?.mnemonic) throw new Error("Server vault missing mnemonic.");

    const w = await buildWalletFromMnemonic(json.mnemonic);
    writeWalletVault(accountEmail, data.encrypted_backup);
    setWallet(w);
    setAddress(w.address);
    setServerBackup(true);
    return true;
  }, [authToken, accountEmail]);

  const resetWallet = useCallback(async () => {
    clearWalletVault(accountEmail);
    setWallet(null);
    setAddress("");
    setServerBackup(false);
    setStatus("none");
  }, [accountEmail]);

  // Boot: per-account local vault, then server restore for the logged-in user.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setStatus("booting");
        setLastError("");

        if (!authToken) {
          const offlineOk = await loadFromLocal().catch(() => false);
          if (cancelled) return;
          if (offlineOk) {
            setStatus("ready");
            setServerBackup(false);
            return;
          }
          setWallet(null);
          setAddress("");
          setStatus("none");
          return;
        }

        if (!accountEmail) {
          setStatus("booting");
          return;
        }

        const localAddress = await loadFromLocal().catch(() => null);
        if (cancelled) return;
        if (localAddress) {
          setStatus("ready");
          try {
            const data = await walletGetBackup(authToken);
            setServerBackup(
              Boolean(
                data?.exists &&
                  data.evm_address?.toLowerCase() === String(localAddress).toLowerCase()
              )
            );
          } catch {
            setServerBackup(false);
          }
          return;
        }

        const serverOk = await restoreFromServer().catch(() => false);
        if (cancelled) return;
        if (serverOk) {
          setStatus("ready");
          return;
        }

        setWallet(null);
        setAddress("");
        setServerBackup(false);
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
  }, [authToken, accountEmail, loadFromLocal, restoreFromServer]);

  // After login + local wallet, push backup if missing (e.g. created before server sync).
  useEffect(() => {
    if (
      status !== "ready" ||
      !wallet ||
      !authToken ||
      !accountEmail ||
      serverBackup ||
      autoBackupAttempted.current
    ) {
      return;
    }
    autoBackupAttempted.current = true;
    ensureServerBackup();
  }, [status, wallet, authToken, accountEmail, serverBackup, ensureServerBackup]);

  const value = useMemo(
    () => ({
      status,
      address,
      wallet,
      lastError,
      hasLocal,
      serverBackup,
      syncingBackup,
      accountEmail,
      createWallet,
      importMnemonic,
      restoreFromServer,
      ensureServerBackup,
      resetWallet,
    }),
    [
      status,
      address,
      wallet,
      lastError,
      hasLocal,
      serverBackup,
      syncingBackup,
      accountEmail,
      createWallet,
      importMnemonic,
      restoreFromServer,
      ensureServerBackup,
      resetWallet,
    ]
  );

  return <inAppWalletContext.Provider value={value}>{children}</inAppWalletContext.Provider>;
}

export function useInAppWallet() {
  const ctx = useContext(inAppWalletContext);
  if (!ctx) throw new Error("useInAppWallet must be used within InAppWalletProvider");
  return ctx;
}
