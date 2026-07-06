import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { useInterview } from "../../hooks/useInterview.js";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LOGIN = [
  "Authenticating human...",
  "Fetching cookies (the digital kind)...",
  "Looking under the couch for your data...",
  "Untangling the internet..."
];

const Login = () => {
  const navigate = useNavigate();
  const { loading, handleLogin } = useAuth();
  const { getReports } = useInterview();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }
    const success = await handleLogin({ email, password });
    if (success) {
      await getReports();
      navigate("/");
    }
  };

  return (
    <main className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground select-none">
      <LoadingScreen active={loading} minDelay={2000} quotes={LOGIN} message="Logging in…" />
      {/* Left panel: Auth Form */}
      <div className="flex flex-col p-6 md:p-10 justify-between h-full">
        {/* Brand header */}
        <div className="flex items-center gap-2 font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </div>
          ResumeRise
        </div>

        {/* Centered Form */}
        <div className="w-full max-w-sm mx-auto flex flex-col gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Login to your account</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative w-full">
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pr-10"
                />
                {email && (
                  <button
                    type="button"
                    onClick={() => setEmail("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Password recovery coming soon!");
                  }}
                  className="text-xs text-muted-foreground hover:underline hover:text-primary transition-all"
                >
                  Forgot your password?
                </a>
              </div>
              <div className="relative w-full">
                <Input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                {password && (
                  <button
                    type="button"
                    onClick={() => setPassword("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full mt-2 font-semibold">
              Login
            </Button>
          </form>

          {/* Divider */}
          {/* <div className="relative flex items-center justify-center text-xs uppercase">
            <span className="absolute inset-x-0 h-px bg-border" />
            <span className="relative bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div> */}

          {/* Social login option */}
          {/* <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 font-medium"
            onClick={() => toast.info("GitHub login coming soon!")}
          >
            <svg className="size-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
              <path fill="currentColor" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-21.8-1.4c-.6 2-3 3.2-5.9 2.6-3-1-4.2-3.6-3.6-5.9 .6-2 3-3.2 5.9-2.6 3 1 4.2 3.6 3.6 5.9zm-8.8-10c-1.2 1.3-3.9 1-5.9-1.2-2-2.3-2.6-5.1-1.4-6.4 1.2-1.3 3.9-1 5.9 1.2 2 2.3 2.6 5.1 1.4 6.4zm-15.3-8.2c-.5-1.7-2.9-2.2-5.4-1-2.6 1.3-4.2 3.6-3.7 5.3 .5 1.7 2.9 2.2 5.4 1 2.6-1.3 4.2-3.6 3.7-5.3zm-32.9-34.9c-.8-1.7-3.1-1.5-5.4 .5-2.2 2-2.3 4.5-1.5 6.3 .8 1.7 3.1 1.5 5.4-.5 2.2-2 2.3-4.5 1.5-6.3zm-19-11c-.5-1.7-2.7-2-5.1-.7-2.4 1.3-3.8 3.5-3.3 5.2 .5 1.7 2.7 2 5.1 .7 2.4-1.3 3.8-3.5 3.3-5.2zm-5.4-11c-.5-1.7-2.7-2-5.1-.7-2.4 1.3-3.8 3.5-3.3 5.2 .5 1.7 2.7 2 5.1 .7 2.4-1.3 3.8-3.5 3.3-5.2zm-4.7-18.7c-.8-1.7-3.1-1.5-5.4 .5-2.2 2-2.3 4.5-1.5 6.3 .8 1.7 3.1 1.5 5.4-.5 2.2-2 2.3-4.5 1.5-6.3zm0 0M496 248C496 111.2 384.8 0 248 0S0 111.2 0 248c0 109.7 70.8 202.4 169.2 235.1 12.4 2.3 16.9-5.4 16.9-12 0-5.9-.2-21.4-.3-42-69.7 15.1-84.3-33.6-84.3-33.6-11.4-29-27.8-36.7-27.8-36.7-22.8-15.5 1.7-15.2 1.7-15.2 25.2 1.8 38.5 25.9 38.5 25.9 22.4 38.3 58.7 27.2 73 20.8 2.3-16.2 8.7-27.2 15.8-33.5-55.6-6.3-114-27.8-114-123.8 0-27.3 9.8-49.7 25.8-67.1-2.6-6.3-11.2-31.8 2.5-66.2 0 0 21-6.7 68.8 25.6 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c47.8-32.3 68.8-25.6 68.8-25.6 13.7 34.4 5.1 59.9 2.5 66.2 16 17.4 25.8 39.8 25.8 67.1 0 96.2-58.4 117.4-114.2 123.6 9 7.8 17 23.2 17 46.8 0 33.8-.3 61.1-.3 69.4 0 6.7 4.5 14.5 17 12C425.2 450.3 496 357.7 496 248z" />
            </svg>
            Login with GitHub
          </Button> */}

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-foreground hover:underline hover:text-primary transition-all">
              Sign up
            </Link>
          </div>
        </div>

        {/* Empty placeholder for alignment bottom */}
        <div className="hidden lg:block text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>

      {/* Right panel: Glowing & Gradient ResumeRise Logo Showcase */}
      <div className="relative hidden h-full bg-muted/20 lg:flex flex-col items-center justify-center border-l border-border overflow-hidden p-8">
        {/* Glow decorative backdrop */}
        <div className="absolute size-[500px] rounded-full bg-[radial-gradient(circle,_var(--color-primary)_0%,_transparent_70%)] opacity-10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center gap-8 z-10">
          {/* Large glowing gradient logo wrapper */}
          <div className="relative flex size-36 items-center justify-center rounded-[2.25rem] bg-gradient-to-tr from-primary via-indigo-500 to-violet-500 border border-primary/30 shadow-[0_0_50px_10px_rgba(99,102,241,0.25)]">
            <Sparkles className="size-16 text-white" />
          </div>

          {/* Title & subtitle */}
          <div className="text-center max-w-sm">
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              ResumeRise
            </h2>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Upload your resume and map skill gaps against real job requirements with a customized study roadmap.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
