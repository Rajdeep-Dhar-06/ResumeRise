import { createContext, useState, useEffect } from "react";
import { getMe } from "../services/auth.api.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAndSetUser = async () => {
      try {
        const userData = await getMe();
        setUser(userData.user);
      } catch (error) {
        console.error("GetMe failed on initial mount:", error);
      } finally {
        setLoading(false);
      }
    };
    getAndSetUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
