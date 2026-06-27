import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth.jsx";
import { useState } from "react";
import LoadingScreen from "../../../components/LoadingScreen.jsx";

const Register = () => {
  const navigate = useNavigate();
  const { loading, handleRegister } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await handleRegister({ username, email, password });
    if (success) {
      navigate("/");
    }
  };

  if (loading) {
    return <LoadingScreen message="Creating your account…" />;
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 md:p-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-10 shadow-2xl flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-100 mb-3 tracking-tight">Create account</h1>
          <p className="text-slate-400 text-base">Get started with ResumeRise</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label htmlFor="username" className="text-sm font-medium text-slate-300">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-14 bg-slate-800 border border-slate-700 rounded-xl px-5 text-base text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

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
            Register
          </button>
        </form>

        <div className="pt-6 border-t border-slate-800/60">
          <p className="text-sm text-slate-400 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Register;
