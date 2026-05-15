import axios from "axios";

const API_BASE = import.meta.env.VITE_SERVER_URL;

export async function walletGetChallenge(authToken) {
  const resp = await axios.post(
    `${API_BASE}/api/wallet/challenge/`,
    {},
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  return resp.data; // { nonce }
}

export async function walletGetBackup(authToken) {
  const resp = await axios.get(`${API_BASE}/api/wallet/backup/`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return resp.data; // { exists, evm_address, encrypted_backup, crypto_params }
}

export async function walletPutBackup(authToken, payload) {
  const resp = await axios.post(`${API_BASE}/api/wallet/backup/`, payload, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return resp.data; // { ok, updated_at }
}

export async function walletDeleteBackup(authToken) {
  const resp = await axios.delete(`${API_BASE}/api/wallet/backup/`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return resp.data;
}

