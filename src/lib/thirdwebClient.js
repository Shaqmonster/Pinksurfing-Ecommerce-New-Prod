import { createThirdwebClient } from "thirdweb";

/** @type {import('thirdweb').ThirdwebClient | null} */
let cachedClient = null;
/** @type {string} */
let cachedClientId = "";

/**
 * @param {string | undefined | null} clientId
 * @returns {import('thirdweb').ThirdwebClient | null}
 */
export function createThirdwebClientFromId(clientId) {
  const id = typeof clientId === "string" ? clientId.trim() : "";
  if (!id) return null;
  return createThirdwebClient({ clientId: id });
}

/**
 * Browser-safe Thirdweb client (public client id only).
 * Do not pass secret keys here — use server-side APIs if you need a secret.
 *
 * @returns {import('thirdweb').ThirdwebClient | null}
 */
export function getThirdwebClient() {
  const id = typeof import.meta.env.VITE_THIRDWEB_CLIENT_ID === "string" ? import.meta.env.VITE_THIRDWEB_CLIENT_ID.trim() : "";
  if (!id) return null;
  if (cachedClient && cachedClientId === id) return cachedClient;
  cachedClientId = id;
  cachedClient = createThirdwebClient({ clientId: id });
  return cachedClient;
}
