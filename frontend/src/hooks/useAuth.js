import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { login, logout, register, getMe } from "../services/auth.api.js";
import { toast } from "sonner";
import { setAccessToken } from "../lib/api.js";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { user, setUser, loading, setLoading } = context;

  /** @description Authenticate the user and set the session. */
  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await login({ email, password });
      setAccessToken(data.accessToken);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Invalid email or password. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /** @description Register a new account and set the session. */
  const handleRegister = async ({ username, email, password }) => {
    setLoading(true);
    try {
      const data = await register({ username, email, password });
      setAccessToken(data.accessToken);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      const isConflict = error?.response?.status === 409;
      toast.error(
        isConflict
          ? "An account with this email or username already exists."
          : "Failed to create account. Please check your details and try again."
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  /** @description Clear the session and log the user out. */
  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed on backend:", error);
    } finally {
      setAccessToken("");
      setUser(null);
      setLoading(false);
    }
    return true;
  };

  return {
    user,
    loading,
    handleLogin,
    handleRegister,
    handleLogout,
  };
};
