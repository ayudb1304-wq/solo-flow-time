import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p>By accessing and using SoloFlow, you accept and agree to be bound by the terms and provision of this agreement.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
                <p>SoloFlow is a project management platform designed for freelancers and solo entrepreneurs to manage clients, projects, tasks, and invoices.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
                <p>You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Subscription and Payment</h2>
                <p>Paid subscriptions are billed in advance on a monthly or yearly basis. All fees are non-refundable except as expressly stated in our refund policy.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Data Privacy</h2>
                <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
                <p>SoloFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Contact Information</h2>
                <p>For questions about these Terms of Service, please contact us through our Contact Us page.</p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};