import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { login, logout, register, getMe } from "../services/auth.api.js";
import { toast } from "sonner";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { user, setUser, loading, setLoading } = context;

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    const toastId = toast.loading("Logging in...");
    try {
      const data = await login({ email, password });
      setUser(data.user);
      toast.success("Welcome back!", { id: toastId });
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Invalid email or password. Please try again.", { id: toastId });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, email, password }) => {
    setLoading(true);
    const toastId = toast.loading("Creating your account...");
    try {
      const data = await register({ username, email, password });
      setUser(data.user);
      toast.success("Account created successfully!", { id: toastId });
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      const isConflict = error?.response?.status === 409;
      toast.error(
        isConflict
          ? "An account with this email or username already exists."
          : "Failed to create account. Please check your details and try again.",
        { id: toastId }
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const toastId = toast.loading("Logging out...");
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed on backend:", error);
    } finally {
      setUser(null);
      setLoading(false);
      toast.success("Logged out successfully.", { id: toastId });
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
