import axios from "axios";

/**
 * Shared Axios instance for all API calls.
 * Reads the base URL from environment variables so you only
 * need to update one place when deploying to production.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  withCredentials: true,
});

export default api;
