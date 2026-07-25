import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { login, logout, register } from "../services/auth.api.js";
import { toast } from "sonner";
import { setAccessToken } from "../lib/api.js";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { user, setUser, loading } = context;

  // Loading States 
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /** @description Authenticate the user and set the session. */
  const handleLogin = async ({ email, password }) => {
    setIsLoggingIn(true);
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
      setIsLoggingIn(false);
    }
  };

  /** @description Register a new account and set the session. */
  const handleRegister = async ({ username, email, password }) => {
    setIsRegistering(true);
    try {
      const data = await register({ username, email, password });
      setAccessToken(data.accessToken);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Failed to create account. Please try again.");
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  /** @description Clear the session and log the user out. */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to log out account. Please try again.");
    } finally {
      setAccessToken("");
      setUser(null);
      setIsLoggingOut(false);
    }
  };

  return {
    user,
    loading,
    isLoggingIn,
    isRegistering,
    isLoggingOut,
    handleRegister,
    handleLogin,
    handleLogout,
  };
};
