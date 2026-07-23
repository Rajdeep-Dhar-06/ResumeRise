import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LOGIN_QUOTES } from "../../lib/quotes.js";

const Login = () => {
  const navigate = useNavigate();
  const { loading, handleLogin } = useAuth();
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
      navigate("/");
    }
  };

  return (
    <main className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground select-none">
      <LoadingScreen active={loading} minDelay={2000} quotes={LOGIN_QUOTES} message="Logging in…" />
      {/* Left panel: Auth Form */}
      <div className="flex flex-col p-6 md:p-10 h-full">
        {/* Brand header */}
        <div className="flex items-center gap-2 font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          ResumeRise
        </div>

        {/* Centered Form */}
        <div className="w-full max-w-sm mx-auto flex flex-col gap-6 my-auto">
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
                    <X className="h-4 w-4" />
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
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full mt-2 font-semibold">
              Login
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-foreground hover:underline hover:text-primary transition-all">
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Right panel: Clean & Exquisite Brand Showcase */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-muted/30 border-l border-border p-12">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          {/* Logo container with radial white glow */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl scale-150 pointer-events-none" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div className="space-y-2">

            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              ResumeRise
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload your resume and map skill gaps against real job requirements with a customized study roadmap.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;

