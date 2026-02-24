import axios from "axios";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

// ─── Worker ─────────────────────────────────────────────────────────────────

export const createGigWorkerProfile = (token, { bio, profile_picture }) => {
  const form = new FormData();
  form.append("bio", bio);
  if (profile_picture) form.append("profile_picture", profile_picture);
  return axios.post(`${BASE_URL}/api/gigs/worker/`, form, {
    headers: authHeader(token),
  });
};

export const getMyGigWorkerProfile = (token) =>
  axios.get(`${BASE_URL}/api/gigs/worker/me/`, {
    headers: authHeader(token),
  });

// ─── Discovery ───────────────────────────────────────────────────────────────

export const listGigs = (params = {}) =>
  axios.get(`${BASE_URL}/api/gigs/`, { params });

export const getGig = (gigId) =>
  axios.get(`${BASE_URL}/api/gigs/${gigId}/`);

export const getGigCategories = () =>
  axios.get(`${BASE_URL}/api/gigs/categories/`);

export const getGigSubcategories = (categoryId) =>
  axios.get(`${BASE_URL}/api/gigs/subcategories/`, {
    params: categoryId ? { category: categoryId } : {},
  });

// ─── Create / Manage Gigs (Seller) ──────────────────────────────────────────

export const createGig = (token, payload) =>
  axios.post(`${BASE_URL}/api/gigs/`, payload, {
    headers: { ...authHeader(token), "Content-Type": "application/json" },
  });

export const addGigPackage = (token, gigId, payload) =>
  axios.post(`${BASE_URL}/api/gigs/${gigId}/packages/`, payload, {
    headers: { ...authHeader(token), "Content-Type": "application/json" },
  });

export const addGigMedia = (token, gigId, file, isMain = false) => {
  const form = new FormData();
  form.append("file", file);
  form.append("media_type", file.type.startsWith("video") ? "video" : "image");
  form.append("is_main", isMain);
  return axios.post(`${BASE_URL}/api/gigs/${gigId}/media/`, form, {
    headers: authHeader(token),
  });
};

// ─── Orders (Buyer) ──────────────────────────────────────────────────────────

export const createGigOrder = (token, { gig_id, package_id, addons = [] }) =>
  axios.post(
    `${BASE_URL}/api/gig-orders/`,
    { gig_id, package_id, addons },
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );

export const createStripeCheckoutSession = (token, orderId) =>
  axios.post(
    `${BASE_URL}/api/gig-orders/payments/create-checkout-session/${orderId}/`,
    {},
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );

export const getMyGigOrders = (token) =>
  axios.get(`${BASE_URL}/api/gig-orders/`, {
    headers: authHeader(token),
  });

export const submitOrderRequirements = (token, orderId, answers) =>
  axios.post(
    `${BASE_URL}/api/gig-orders/${orderId}/submit_requirements/`,
    { answers },
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );

export const deliverOrder = (token, orderId, { message, files }) => {
  const form = new FormData();
  form.append("message", message);
  files.forEach((f) => form.append("files", f));
  return axios.post(`${BASE_URL}/api/gig-orders/${orderId}/deliver/`, form, {
    headers: authHeader(token),
  });
};

// ─── Chat ────────────────────────────────────────────────────────────────────

export const getConversations = (token) =>
  axios.get(`${BASE_URL}/api/chat/conversations/`, {
    headers: authHeader(token),
  });
