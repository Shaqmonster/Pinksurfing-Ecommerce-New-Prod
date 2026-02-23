import axios from "axios";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

// Create a new buyer request (multipart/form-data for images)
export const createBuyerRequest = async (token, { title, description, budget, deadline, category, images }) => {
  const form = new FormData();
  form.append("title", title);
  form.append("description", description);
  form.append("budget", budget);
  if (deadline) form.append("deadline", deadline);
  if (category) form.append("category", category);
  images.forEach((img, i) => form.append(`image${i + 1}`, img));

  return axios.post(`${BASE_URL}/api/buyer_requests/customer/requests/`, form, {
    headers: authHeader(token),
  });
};

// Get the authenticated customer's own requests (includes nested bids)
export const getMyRequests = async (token) => {
  return axios.get(`${BASE_URL}/api/buyer_requests/customer/requests/`, {
    headers: authHeader(token),
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
