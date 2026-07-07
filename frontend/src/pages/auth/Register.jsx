import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { useInterview } from "../../hooks/useInterview.js";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const REGISTER = [
  "Creating a brand-new human instance...",
  "Allocating memory for your greatness...",
  "Scaling our user base by exactly one..."
];

const Register = () => {
  const navigate = useNavigate();
  const { loading, handleRegister } = useAuth();
  const { getReports } = useInterview();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      toast.error("Please fill in all registration fields.");
      return;
    }
    const success = await handleRegister({ username, email, password });
    if (success) {
      await getReports();
      navigate("/");
    }
  };

  return (
    <main className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground select-none">
      <LoadingScreen active={loading} minDelay={2000} quotes={REGISTER} message="Creating your account…" />
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
            <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
            <p className="text-sm text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative w-full">
                <Input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pr-10"
                />
                {username && (
                  <button
                    type="button"
                    onClick={() => setUsername("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

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
              <Label htmlFor="password">Password</Label>
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
              Register
            </Button>
          </form>


          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-foreground hover:underline hover:text-primary transition-all">
              Login
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

export default Register;
