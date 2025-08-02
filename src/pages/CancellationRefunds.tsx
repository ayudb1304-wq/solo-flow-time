import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CancellationRefunds = () => {
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
            <CardTitle className="text-3xl font-bold">Cancellation and Refund Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Subscription Cancellation</h2>
                <p>You may cancel your SoloFlow subscription at any time through your account settings. Your cancellation will take effect at the end of your current billing period.</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>No cancellation fees apply</li>
                  <li>You retain access until the end of your paid period</li>
                  <li>Your account will automatically move to the free trial plan</li>
                  <li>You can reactivate your subscription at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Refund Policy</h2>
                <p>We offer a 30-day money-back guarantee for new subscribers:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Full refund available within 30 days of initial subscription</li>
                  <li>Refunds are processed within 5-10 business days</li>
                  <li>Refunds are issued to the original payment method</li>
                  <li>Annual subscriptions are eligible for prorated refunds within 30 days</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Refund Exclusions</h2>
                <p>The following are not eligible for refunds:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Subscription renewals (beyond the initial 30-day period)</li>
                  <li>Accounts terminated for violation of terms of service</li>
                  <li>Third-party service fees or charges</li>
                  <li>Partial month usage (except during the 30-day guarantee period)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. How to Request a Refund</h2>
                <p>To request a refund:</p>
                <ol className="list-decimal pl-6 mt-2">
                  <li>Contact our support team through the Contact Us page</li>
                  <li>Include your account email and reason for refund</li>
                  <li>Provide your order/transaction ID if available</li>
                  <li>We will process your request within 2 business days</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Data Retention After Cancellation</h2>
                <p>After cancellation:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Your data is retained for 90 days in case you want to reactivate</li>
                  <li>You can export your data at any time before cancellation</li>
                  <li>After 90 days, data may be permanently deleted</li>
                  <li>You can request immediate data deletion upon cancellation</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Billing Disputes</h2>
                <p>If you notice any billing errors or unauthorized charges, please contact us immediately. We will investigate and resolve all legitimate disputes promptly.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Changes to This Policy</h2>
                <p>We may update this policy from time to time. Changes will be posted on this page with an updated effective date.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
                <p>For questions about cancellations or refunds, please contact our support team through our Contact Us page or email support@soloflow.pro.</p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};