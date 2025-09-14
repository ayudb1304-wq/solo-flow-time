import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VerificationRequiredProps {
  userEmail?: string;
  onResendSuccess?: () => void;
}

export const VerificationRequired = ({ userEmail, onResendSuccess }: VerificationRequiredProps) => {
  const [email, setEmail] = useState(userEmail || "");
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.functions.invoke('resend-verification', {
        body: { email }
      });

      if (error) throw error;

      toast({
        title: "Verification email sent!",
        description: "Please check your inbox (including spam folder) for the verification email.",
      });
      
      onResendSuccess?.();
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast({
        title: "Failed to send verification email",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Email Verification Required</CardTitle>
          <CardDescription>
            Please verify your email address to access SoloFlow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Verification email sent to your inbox</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Check your email (including spam folder) and click the verification link to continue.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resend-email">Email Address</Label>
              <Input
                id="resend-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleResendVerification} 
              disabled={isResending}
              className="w-full"
              variant="outline"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Didn't receive the email? Check your spam folder or try resending.
            </p>
            <p className="mt-2">
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal" 
                onClick={() => supabase.auth.signOut()}
              >
                Sign out and try with a different email
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};