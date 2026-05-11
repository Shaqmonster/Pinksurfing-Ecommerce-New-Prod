import axios from "axios";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

function headers(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getVisitForProduct(token, productId) {
  const res = await axios.get(
    `${BASE_URL}/api/property-visits/by-product/${productId}/`,
    { headers: headers(token) }
  );
  return res.data;
}

export async function createPropertyVisit(token, payload) {
  const res = await axios.post(`${BASE_URL}/api/property-visits/`, payload, {
    headers: headers(token),
  });
  return res.data;
}

export async function createVisitPaymentLink(token, visitId) {
  const res = await axios.post(
    `${BASE_URL}/api/property-visits/${visitId}/payment-link/`,
    {},
    { headers: headers(token) }
  );
  return res.data;
}

export async function buyerRescheduleVisit(token, visitId, scheduledAtIso) {
  const res = await axios.post(
    `${BASE_URL}/api/property-visits/${visitId}/buyer/reschedule/`,
    { scheduled_at: scheduledAtIso },
    { headers: headers(token) }
  );
  return res.data;
}

export async function buyerRespondVendorReschedule(token, visitId, accept) {
  const res = await axios.post(
    `${BASE_URL}/api/property-visits/${visitId}/buyer/respond-reschedule/`,
    { accept },
    { headers: headers(token) }
  );
  return res.data;
}

export async function submitVisitDispute(token, visitId, disputeReason) {
  const res = await axios.post(
    `${BASE_URL}/api/property-visits/${visitId}/buyer/dispute/`,
    { dispute_reason: disputeReason },
    { headers: headers(token) }
  );
  return res.data;
}
