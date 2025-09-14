import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import { Landing } from "./pages/Landing";
import NotFound from "./pages/NotFound";
import { TermsOfService } from "./pages/TermsOfService";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { ContactUs } from "./pages/ContactUs";
import { CancellationRefunds } from "./pages/CancellationRefunds";
import { ShippingPolicy } from "./pages/ShippingPolicy";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NotificationSystem } from "@/components/NotificationSystem";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing onGetStarted={() => navigate("/auth")} />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/cancellation-refunds" element={<CancellationRefunds />} />
        <Route path="/shipping" element={<ShippingPolicy />} />
        <Route path="*" element={<Landing onGetStarted={() => navigate("/auth")} />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/cancellation-refunds" element={<CancellationRefunds />} />
      <Route path="/shipping" element={<ShippingPolicy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading SoloFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SubscriptionProvider>
          <ErrorBoundary>
            <NotificationSystem />
            <AppContent />
          </ErrorBoundary>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
