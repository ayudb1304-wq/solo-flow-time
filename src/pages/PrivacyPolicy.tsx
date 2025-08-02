import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PrivacyPolicy = () => {
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
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Account information (name, email, password)</li>
                  <li>Project and client data you input</li>
                  <li>Payment information (processed securely by our payment providers)</li>
                  <li>Usage data and analytics</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
                <p>We use the information we collect to provide, maintain, and improve our services:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>To operate and maintain your account</li>
                  <li>To process payments and transactions</li>
                  <li>To send important updates about our service</li>
                  <li>To provide customer support</li>
                  <li>To improve our platform and develop new features</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
                <p>We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>With your explicit consent</li>
                  <li>To trusted service providers who assist in operating our platform</li>
                  <li>When required by law or to protect our rights</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
                <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
                <p>We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and data at any time.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
                <p>You have the right to access, update, or delete your personal information. Contact us to exercise these rights.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
                <p>We use cookies to enhance your experience and analyze platform usage. You can control cookie settings through your browser.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
                <p>If you have questions about this Privacy Policy, please contact us through our Contact Us page.</p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};