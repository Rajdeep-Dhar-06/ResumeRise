import LoadingScreen from "../../../components/LoadingScreen.jsx";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth.jsx";
import { useState } from "react";

const Login = () => {
  const navigate = useNavigate();
  const { loading, handleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await handleLogin({ email, password });
    if (success) {
      navigate("/");
    }
  };

  if (loading) {
    return <LoadingScreen message="Logging in…" />;
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 md:p-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-10 shadow-2xl flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-100 mb-3 tracking-tight">Welcome back</h1>
          <p className="text-slate-400 text-base">Sign in to your ResumeRise account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label htmlFor="email" className="text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-slate-800 border border-slate-700 rounded-xl px-5 text-base text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-slate-800 border border-slate-700 rounded-xl px-5 text-base text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-xl transition-colors mt-6 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            Login
          </button>
        </form>

        <div className="pt-6 border-t border-slate-800/60">
          <p className="text-sm text-slate-400 text-center">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Login;
