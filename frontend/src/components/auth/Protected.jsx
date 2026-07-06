import { useAuth } from "../hooks/useAuth.jsx";
import { Navigate } from "react-router";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <p className="text-lg text-slate-400">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default Protected;
