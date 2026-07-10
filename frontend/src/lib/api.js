import axios from "axios";

let accessToken = "";

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  withCredentials: true,
});

// Request Interceptor: attach the Bearer token if it exists
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle token expiration (401/403 errors)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 or 403 (unauthorized/expired token) and we haven't already retried
    if (
      (error.response?.status === 401 || error.response?.status === 403) && 
      !originalRequest._retry && 
      !originalRequest.url?.endsWith("/refresh")
    ) {
      originalRequest._retry = true;
      try {
        // Request a new access token from /refresh endpoint
        const response = await axios.post(
          `${api.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken: newAccessToken } = response.data;
        
        // Save the new access token
        setAccessToken(newAccessToken);
        
        // Update Authorization header on original request and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // If refresh fails, we clear the access token and reject
        setAccessToken("");
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
