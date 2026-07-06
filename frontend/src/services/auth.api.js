import api from "../../../lib/api.js";

/**
 * Auth API Services
 * Handles communication with the backend authentication endpoints.
 */

export async function register({ username, email, password }) {
  try {
    const response = await api.post("/api/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Register API error:", error);
    throw error; // Rethrow to let the UI hook display toast
  }
}

export async function login({ email, password }) {
  try {
    const response = await api.post("/api/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Login API error:", error);
    throw error; // Rethrow to let the UI hook display toast
  }
}

export async function logout() {
  try {
    const response = await api.get("/api/auth/logout");
    return response.data;
  } catch (error) {
    console.error("Logout API error:", error);
    throw error; // Rethrow to let the UI hook display toast
  }
}

export async function getMe() {
  try {
    const response = await api.get("/api/auth/get-me");
    return response.data;
  } catch (error) {
    console.error("GetMe API error:", error);
    throw error; // Rethrow
  }
}
