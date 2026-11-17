import axios from "axios";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

// Create a request. requestType "product" = a buyer asking vendors for an item (bids);
// "job" = freelance work posted in GigHub (proposals from gig workers).
export const createBuyerRequest = async (
  token,
  {
    requestType = "job",
    title,
    description,
    budget,
    deadline,
    category,
    jobCategory,
    jobSubcategory,
    jobCategorySlug,
    quantity,
    condition,
    shipToZip,
    images = [],
  }
) => {
  const form = new FormData();
  form.append("request_type", requestType);
  form.append("title", title);
  form.append("description", description);
  form.append("budget", budget);
  if (deadline) form.append("deadline", deadline);
  if (category) form.append("category", category);
  if (jobCategory) form.append("job_category", jobCategory);
  if (jobSubcategory) form.append("job_subcategory", jobSubcategory);
  if (jobCategorySlug) form.append("job_category_slug", jobCategorySlug);
  if (quantity) form.append("quantity", String(quantity));
  if (condition) form.append("condition", condition);
  if (shipToZip) form.append("ship_to_zip", shipToZip);
  images.forEach((img, i) => form.append(`image${i + 1}`, img));

  return axios.post(`${BASE_URL}/api/buyer_requests/customer/requests/`, form, {
    headers: authHeader(token),
  });
};

// The signed-in user's own requests. type: "product" | "job" (omit for both).
export const getMyRequests = async (token, type) => {
  return axios.get(`${BASE_URL}/api/buyer_requests/customer/requests/`, {
    headers: authHeader(token),
    params: type ? { type } : undefined,
  });
};

// Get a single request detail
export const getRequestDetail = async (token, requestId) => {
  return axios.get(`${BASE_URL}/api/buyer_requests/customer/requests/${requestId}/`, {
    headers: authHeader(token),
  });
};

// Accept a vendor bid — backend creates a Product and returns product_id
export const acceptBid = async (token, requestId, bidId) => {
  return axios.post(
    `${BASE_URL}/api/buyer_requests/customer/requests/${requestId}/accept_bid/`,
    { bid_id: bidId },
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );
};

// Delete a buyer request
export const deleteRequest = async (token, requestId) => {
  return axios.delete(`${BASE_URL}/api/buyer_requests/customer/requests/${requestId}/`, {
    headers: authHeader(token),
  });
};

// Add a product to cart (used after accepting a bid)
export const addToCart = async (token, productId) => {
  return axios.post(
    `${BASE_URL}/api/customer/cart/add/${productId}/`,
    {},
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );
};

// Fetch categories for the dropdown
export const getCategories = async () => {
  return axios.get(`${BASE_URL}/api/product/schema/categories/`);
};

// ── Marketplace (open requests visible to all signed-in users) ─────────────

// Get all open buyer requests for the marketplace
export const getOpenRequests = async (token) => {
  return axios.get(`${BASE_URL}/api/buyer_requests/vendor/explore/`, {
    headers: authHeader(token),
  });
};

// Get a single open request detail
export const getOpenRequestDetail = async (token, id) => {
  return axios.get(`${BASE_URL}/api/buyer_requests/vendor/explore/${id}/`, {
    headers: authHeader(token),
  });
};

// Submit a bid/offer on an open request
export const createBidOffer = async (token, { request_id, bid_amount, delivery_time_days, proposal }, images = []) => {
  const form = new FormData();
  form.append("request_id", String(request_id));
  form.append("bid_amount", String(bid_amount));
  form.append("delivery_time_days", String(delivery_time_days));
  form.append("proposal", proposal);
  images.forEach((img, i) => form.append(`image${i + 1}`, img));
  return axios.post(`${BASE_URL}/api/buyer_requests/vendor/bids/`, form, {
    headers: authHeader(token),
  });
};

// Get current user's submitted bids (to check if already bid on a request)
export const getMySubmittedBids = async (token) => {
  return axios.get(`${BASE_URL}/api/buyer_requests/vendor/bids/`, {
    headers: authHeader(token),
  });
};

// Withdraw/delete a submitted bid
export const withdrawBidOffer = async (token, bidId) => {
  return axios.delete(`${BASE_URL}/api/buyer_requests/vendor/bids/${bidId}/`, {
    headers: authHeader(token),
  });
};

// ── GigHub jobs (freelance): gig workers send proposals, the poster hires one ──

export const getOpenJobs = async (token, category) => {
  return axios.get(`${BASE_URL}/api/buyer_requests/jobs/explore/`, {
    headers: authHeader(token),
    params: category ? { category } : undefined,
  });
};

export const getJobDetail = async (token, id) => {
  return axios.get(`${BASE_URL}/api/buyer_requests/jobs/explore/${id}/`, {
    headers: authHeader(token),
  });
};

export const createJobProposal = async (token, { request_id, amount, delivery_days, cover_letter }) => {
  return axios.post(
    `${BASE_URL}/api/buyer_requests/jobs/proposals/`,
    { request_id, amount, delivery_days, cover_letter },
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );
};

export const getMyProposals = async (token) => {
  return axios.get(`${BASE_URL}/api/buyer_requests/jobs/proposals/`, {
    headers: authHeader(token),
  });
};

export const withdrawProposal = async (token, proposalId) => {
  return axios.delete(`${BASE_URL}/api/buyer_requests/jobs/proposals/${proposalId}/`, {
    headers: authHeader(token),
  });
};

// Poster only: every proposal on one of their jobs.
export const getJobProposals = async (token, requestId) => {
  return axios.get(`${BASE_URL}/api/buyer_requests/customer/requests/${requestId}/proposals/`, {
    headers: authHeader(token),
  });
};

export const hireProposal = async (token, requestId, proposalId) => {
  return axios.post(
    `${BASE_URL}/api/buyer_requests/customer/requests/${requestId}/hire/`,
    { proposal_id: proposalId },
    { headers: { ...authHeader(token), "Content-Type": "application/json" } }
  );
};
