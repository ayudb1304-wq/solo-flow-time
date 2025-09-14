import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowRight, Mail, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm = ({ onToggleMode }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const { login, resetPassword, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to SoloFlow.",
      });
    } catch (error: any) {
      // Check if it's an email verification error
      if (error.message?.includes("Email not confirmed") || 
          error.message?.includes("email confirmation") ||
          error.message?.includes("not verified")) {
        toast({
          variant: "destructive",
          title: "Email verification required",
          description: "Please verify your email address first. Check your inbox for a verification email and click the link to activate your account.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Invalid credentials. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address.",
      });
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      // Error toast is handled in resetPassword function
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      // Error is already handled in signInWithGoogle
    } finally {
      setGoogleLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Reset Password</h2>
          <p className="text-muted-foreground">Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="resetEmail" className="text-sm font-medium text-foreground">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                placeholder="Enter your email"
                disabled={resetLoading}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-500 hover:scale-105 border-0 group text-lg font-medium"
            disabled={resetLoading}
          >
            {resetLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-3">
                Send Reset Email
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            )}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <button
            onClick={() => setShowForgotPassword(false)}
            className="text-primary hover:text-primary/80 font-medium hover:underline transition-all duration-300"
          >
            Back to Sign In
          </button>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={onToggleMode}
              className="text-primary hover:text-primary/80 font-medium hover:underline transition-all duration-300"
            >
              Create one now
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
        <p className="text-muted-foreground">Sign in to your premium account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-primary hover:text-primary/80 font-medium hover:underline transition-all duration-300"
          >
            Forgot your password?
          </button>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-500 hover:scale-105 border-0 group text-lg font-medium"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="flex items-center gap-3">
              Sign In
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
        className="w-full h-12 border-border/50 hover:bg-accent/50 transition-all duration-300"
      >
        {googleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <span className="flex items-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </span>
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button
            onClick={onToggleMode}
            className="text-primary hover:text-primary/80 font-medium hover:underline transition-all duration-300"
          >
            Create one now
          </button>
        </p>
      </div>
    </div>
  );
};