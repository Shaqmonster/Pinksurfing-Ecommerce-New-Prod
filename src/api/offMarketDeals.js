import axios from "axios";

const SERVER = import.meta.env.VITE_SERVER_URL || "";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchDealStats() {
  const { data } = await axios.get(`${SERVER}/api/off-market-deals/stats/`);
  return data;
}

export async function fetchDealTags() {
  const { data } = await axios.get(`${SERVER}/api/off-market-deals/tags/`);
  return data.tags || [];
}

export async function fetchDeals(params = {}, token) {
  const { data } = await axios.get(`${SERVER}/api/off-market-deals/`, {
    params,
    headers: authHeaders(token),
  });
  return data;
}

export async function fetchDealDetail(dealId, token) {
  const { data } = await axios.get(`${SERVER}/api/off-market-deals/${dealId}/`, {
    headers: authHeaders(token),
  });
  return data;
}

export async function fetchDealFull(dealId, token) {
  const { data } = await axios.get(`${SERVER}/api/off-market-deals/${dealId}/full/`, {
    headers: authHeaders(token),
  });
  return data;
}

export async function initiateDealUnlock(dealId, token) {
  const { data } = await axios.post(
    `${SERVER}/api/off-market-deals/${dealId}/unlock/`,
    {},
    { headers: authHeaders(token) }
  );
  return data;
}

export async function fetchUnlockStatus(unlockId, token) {
  const { data } = await axios.get(
    `${SERVER}/api/off-market-deals/unlock/${unlockId}/status/`,
    { headers: authHeaders(token) }
  );
  return data;
}

export async function fetchDealRoom(roomId, token) {
  const { data } = await axios.get(
    `${SERVER}/api/off-market-deals/rooms/${roomId}/`,
    { headers: authHeaders(token) }
  );
  return data;
}

export async function transitionDealRoom(roomId, payload, token) {
  const { data } = await axios.patch(
    `${SERVER}/api/off-market-deals/rooms/${roomId}/`,
    payload,
    { headers: authHeaders(token) }
  );
  return data;
}

export async function updateEscrowChecklist(roomId, checklist, token) {
  const { data } = await axios.patch(
    `${SERVER}/api/off-market-deals/rooms/${roomId}/escrow-checklist/`,
    { escrow_checklist: checklist },
    { headers: authHeaders(token) }
  );
  return data;
}

export function formatMoney(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0";
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B+`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${Math.round(num / 1000)}K`;
  return `$${num.toLocaleString()}`;
}
