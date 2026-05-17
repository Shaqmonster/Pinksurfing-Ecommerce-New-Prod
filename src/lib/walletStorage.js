/** @deprecated Legacy single-user vault key (migrated to per-email keys on login). */
export const LEGACY_WALLET_STORAGE_KEY = "ps_inapp_wallet_v1";

const WALLET_KEY_PREFIX = "ps_inapp_wallet_v1:";

export function normalizeAccountEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function walletStorageKeyForEmail(email) {
  const normalized = normalizeAccountEmail(email);
  if (!normalized) return null;
  return `${WALLET_KEY_PREFIX}${normalized}`;
}

export function readWalletVault(email) {
  const key = walletStorageKeyForEmail(email);
  if (key) {
    try {
      const scoped = localStorage.getItem(key);
      if (scoped) return scoped;
    } catch {
      /* ignore */
    }
  }
  try {
    return localStorage.getItem(LEGACY_WALLET_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeWalletVault(email, encrypted_b64) {
  const key = walletStorageKeyForEmail(email);
  if (!key) {
    localStorage.setItem(LEGACY_WALLET_STORAGE_KEY, encrypted_b64);
    return;
  }
  localStorage.setItem(key, encrypted_b64);
  if (localStorage.getItem(LEGACY_WALLET_STORAGE_KEY) === encrypted_b64) {
    localStorage.removeItem(LEGACY_WALLET_STORAGE_KEY);
  }
}

export function clearWalletVault(email) {
  const key = walletStorageKeyForEmail(email);
  if (key) localStorage.removeItem(key);
  localStorage.removeItem(LEGACY_WALLET_STORAGE_KEY);
}

export function migrateLegacyWalletVault(email) {
  const normalized = normalizeAccountEmail(email);
  if (!normalized) return false;
  let legacy = null;
  try {
    legacy = localStorage.getItem(LEGACY_WALLET_STORAGE_KEY);
  } catch {
    return false;
  }
  if (!legacy) return false;
  const scopedKey = walletStorageKeyForEmail(normalized);
  if (!localStorage.getItem(scopedKey)) {
    localStorage.setItem(scopedKey, legacy);
  }
  localStorage.removeItem(LEGACY_WALLET_STORAGE_KEY);
  return true;
}

export function hasWalletVault(email) {
  return Boolean(readWalletVault(email));
}

/** Logout: drop session keys but keep per-account wallet vaults on this device. */
export function clearAuthLocalData() {
  const preserve = (key) => {
    if (!key) return false;
    if (key === "theme") return true;
    if (key.startsWith(WALLET_KEY_PREFIX)) return true;
    if (key === LEGACY_WALLET_STORAGE_KEY) return true;
    if (key.startsWith("ps_gighub_order_escrow_map")) return true;
    return false;
  };

  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    for (const key of keys) {
      if (!preserve(key)) localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }

  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

export function emailFromAuthUser(user) {
  if (!user || typeof user !== "object") return "";
  return (
    user.email ||
    user.Email ||
    user.user_email ||
    user.customer?.email ||
    ""
  );
}

export function emailFromJwt(token) {
  if (!token || typeof token !== "string") return "";
  try {
    const part = token.replace(/^Bearer\s+/i, "").split(".")[1];
    if (!part) return "";
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return json.email || json.user_email || "";
  } catch {
    return "";
  }
}
