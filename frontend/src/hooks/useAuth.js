import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.jsx";
import { login, logout, register, getMe } from "../services/auth.api.js";
import toast from "react-hot-toast";

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
      toast.error(error?.response?.data?.error || "Login failed. Please check your credentials.", { id: toastId });
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
      toast.error(error?.response?.data?.error || "Registration failed. Please try again.", { id: toastId });
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
      setUser(null);
      toast.success("Logged out successfully.", { id: toastId });
      return true;
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.", { id: toastId });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleGetMe = async () => {
    setLoading(true);
    try {
      const data = await getMe();
      setUser(data.user);
    } catch (error) {
      console.error("GetMe failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getAndSetUser = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        console.error("GetMe failed:", error);
      } finally {
        setLoading(false);
      }
    };
    getAndSetUser();
  }, [setLoading, setUser]);

  return {
    user,
    loading,
    handleLogin,
    handleRegister,
    handleLogout,
    handleGetMe,
  };
};
