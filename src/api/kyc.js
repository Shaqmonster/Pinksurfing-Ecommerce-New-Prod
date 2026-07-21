import axios from "axios";

const SSO_URL =
  import.meta.env.VITE_AUTH_URL || "https://auth.pinksurfing.com";

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

/** GET /api/kyc/status/ */
export const getKycStatus = (token) =>
  axios.get(`${SSO_URL}/api/kyc/status/`, { headers: authHeader(token) });

/** GET /api/user/ */
export const getSsoUser = (token) =>
  axios.get(`${SSO_URL}/api/user/`, { headers: authHeader(token) });

/** POST /api/kyc/launch/ */
export const launchKyc = (token, returnUrl) =>
  axios.post(
    `${SSO_URL}/api/kyc/launch/`,
    { return_url: returnUrl },
    {
      headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
      },
    }
  );
