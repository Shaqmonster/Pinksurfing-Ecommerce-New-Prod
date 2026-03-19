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

/**
 * Create a gig with packages and media in a single request.
 */
export const createGigFull = (token, details, packages = [], mediaFiles = []) => {
  const form = new FormData();

  form.append("title", details.title);
  form.append("description", details.description);
  form.append("status", details.status || "active");
  if (details.category) form.append("category", details.category);
  if (details.subcategory) form.append("subcategory", details.subcategory);

  form.append("packages", JSON.stringify(packages));

  mediaFiles.forEach((file, idx) => {
    form.append("media_files", file);
    if (idx === 0) form.append("main_media_index", "0");
  });

  return axios.post(`${BASE_URL}/api/gigs/`, form, {
    headers: authHeader(token),
  });
};

export const updateGig = (token, gigId, details, packages = [], mediaFiles = []) => {
  const form = new FormData();

  if (details.title) form.append("title", details.title);
  if (details.description) form.append("description", details.description);
  if (details.status) form.append("status", details.status);
  if (details.category) form.append("category", details.category);
  if (details.subcategory) form.append("subcategory", details.subcategory);

  if (packages.length > 0) form.append("packages", JSON.stringify(packages));

  mediaFiles.forEach((file) => {
    form.append("media_files", file);
  });

  return axios.patch(`${BASE_URL}/api/gigs/${gigId}/`, form, {
    headers: authHeader(token),
  });
};

export const deleteGig = (token, gigId) =>
  axios.delete(`${BASE_URL}/api/gigs/${gigId}/`, {
    headers: authHeader(token),
  });

export const getMyGigs = (token) =>
  axios.get(`${BASE_URL}/api/gigs/my_gigs/`, {
    headers: authHeader(token),
  });

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

export const getGigOrderDetail = (token, orderId) =>
  axios.get(`${BASE_URL}/api/gig-orders/${orderId}/`, {
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
  if (files && files.length) files.forEach((f) => form.append("files", f));
  return axios.post(`${BASE_URL}/api/gig-orders/${orderId}/deliver/`, form, {
    headers: authHeader(token),
  });
};

export const completeOrder = (token, orderId) =>
  axios.post(
    `${BASE_URL}/api/gig-orders/${orderId}/complete/`,
    {},
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );

export const cancelOrder = (token, orderId) =>
  axios.post(
    `${BASE_URL}/api/gig-orders/${orderId}/cancel/`,
    {},
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );

// ─── Chat ────────────────────────────────────────────────────────────────────

export const getConversations = (token) =>
  axios.get(`${BASE_URL}/api/chat/conversations/`, {
    headers: authHeader(token),
  });

export const createConversation = (token, participantEmail) =>
  axios.post(
    `${BASE_URL}/api/chat/conversations/`,
    { participant_email: participantEmail },
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );

export const getConversationMessages = (token, conversationId) =>
  axios.get(`${BASE_URL}/api/chat/conversations/${conversationId}/messages/`, {
    headers: authHeader(token),
  });

export const sendMessage = (token, conversationId, content, attachments = []) => {
  const form = new FormData();
  form.append("content", content);
  attachments.forEach((f) => form.append("attachments", f));
  return axios.post(
    `${BASE_URL}/api/chat/conversations/${conversationId}/messages/`,
    form,
    { headers: authHeader(token) }
  );
};
