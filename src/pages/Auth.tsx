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

    // Parse both search params and hash for auth callbacks
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    
    // Check for verification success
    const verified = urlParams.get('verified');
    const type = urlParams.get('type') || hashParams.get('type');
    
    // Check for errors (can be in search or hash)
    const error = urlParams.get('error') || hashParams.get('error');
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
    const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
    
    if (verified === '1' || (type === 'signup' && !error)) {
      // Successful verification
      toast({
        title: "Account activated successfully!",
        description: "You can now sign in to access your dashboard.",
      });
      setIsLogin(true);
      // Clean up URL
      window.history.replaceState({}, '', '/auth');
    } else if (error) {
      // Handle various error cases
      if (error === 'access_denied' && (errorDescription?.includes('expired') || errorCode === 'otp_expired')) {
        toast({
          variant: "destructive",
          title: "Verification link expired",
          description: "Please use the 'Resend verification email' option below to get a new link.",
        });
      } else if (errorCode === 'otp_invalid') {
        toast({
          variant: "destructive",
          title: "Invalid verification link", 
          description: "This verification link is invalid. Please request a new one.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: errorDescription || "Please try again or contact support.",
        });
      }
      // Clean up URL
      window.history.replaceState({}, '', '/auth');
    }
  }, [user, navigate, toast]);

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