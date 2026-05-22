import axios from "axios";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const getIdentityStatus = (token, context) =>
  axios.get(`${BASE_URL}/api/identity/status/`, {
    headers: authHeader(token),
    params: context ? { context } : undefined,
  });

export const createIdentitySession = (token, { context, callbackUrl }) =>
  axios.post(
    `${BASE_URL}/api/identity/session/`,
    { context, callback_url: callbackUrl },
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );

export const getIdentitySessionDecision = (token, sessionId) =>
  axios.get(`${BASE_URL}/api/identity/session/${sessionId}/`, {
    headers: authHeader(token),
  });
