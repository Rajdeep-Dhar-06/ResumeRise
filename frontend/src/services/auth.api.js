import api from "../lib/api.js";

/**
  @description Register a new user account.
 */
export async function register({ username, email, password }) {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    password,
  });
  return response.data;
}

/**
 * @description Log in with email and password.
 */
export async function login({ email, password }) {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });
  return response.data;
}

/**
 * @description Log out the current user and clear the session cookie.
 */
export async function logout() {
  const response = await api.post("/api/auth/logout");
  return response.data;
}

/**
 * @description Fetch the currently authenticated user's profile.
 */
export async function getMe() {
  const response = await api.get("/api/auth/get-me");
  return response.data;
}
