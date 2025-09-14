import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
      return;
    }

    // Handle email verification callback
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      if (error === 'access_denied' && errorDescription?.includes('expired')) {
        toast({
          variant: "destructive",
          title: "Verification link expired",
          description: "Please request a new verification email by signing up again.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: errorDescription || "Please try again or contact support.",
        });
      }
      // Clean up URL params
      window.history.replaceState({}, '', '/auth');
    } else if (searchParams.get('type') === 'signup' && searchParams.get('token_hash')) {
      // User came back from successful verification
      toast({
        title: "Account activated successfully!",
        description: "You can now sign in to access your dashboard.",
      });
      setIsLogin(true);
      // Clean up URL params
      window.history.replaceState({}, '', '/auth');
    }
  }, [user, navigate, searchParams, toast]);

  return (
    <AuthLayout>
      {isLogin ? (
        <LoginForm onToggleMode={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onToggleMode={() => setIsLogin(true)} />
      )}
    </AuthLayout>
  );
};