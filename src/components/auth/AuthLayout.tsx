import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ThreeBackground } from "@/components/ThreeBackground";
import { Sparkles, Crown, Shield } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <ThreeBackground />
      
      {/* Premium background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-accent/15 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-gradient-to-tr from-secondary/25 to-transparent rounded-full blur-2xl animate-pulse delay-2000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto">
          {/* Premium branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <img 
                  src="/lovable-uploads/e339f632-47ba-4c99-aa28-fec9c874e878.png" 
                  alt="SoloFlow Logo" 
                  className="h-12 w-12"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                SoloFlow
              </h1>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full border border-primary/20 mb-4 backdrop-blur-sm">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Premium Access</span>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            
            <p className="text-muted-foreground text-lg font-light">
              Welcome to your premium freelance command center
            </p>
          </div>

          <Card className="backdrop-blur-xl bg-card/80 border border-border/50 shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all duration-500">
            <div className="p-8">
              {children}
            </div>
          </Card>
          
          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Secured with enterprise-grade encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};