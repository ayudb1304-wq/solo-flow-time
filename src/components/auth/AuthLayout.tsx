import { ReactNode } from "react";
import { Timer, Zap } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
              <Timer className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">SoloFlow</h1>
          </div>
          
          <h2 className="text-2xl font-semibold mb-4">
            The All-in-One Tracker for Solo Freelancers
          </h2>
          
          <p className="text-lg text-white/80 mb-8">
            Stop juggling spreadsheets. Track time, manage projects, and get paid faster with our simple, powerful tools.
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-3 text-accent" />
              <span>Effortless time tracking</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-3 text-accent" />
              <span>Professional invoicing</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-3 text-accent" />
              <span>Client & project management</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-3 text-accent" />
              <span>Simple, focused workflow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 lg:w-1/2 bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
};