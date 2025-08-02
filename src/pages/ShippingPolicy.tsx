import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ShippingPolicy = () => {
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
            <CardTitle className="text-3xl font-bold">Shipping Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">Digital Service - No Physical Shipping</h2>
                <p>SoloFlow is a digital software service delivered entirely online. We do not ship any physical products.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Service Delivery</h2>
                <p>Our service is delivered digitally through the following methods:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li><strong>Immediate Access:</strong> Upon successful subscription, you gain instant access to all features</li>
                  <li><strong>Web Application:</strong> Access SoloFlow through any modern web browser</li>
                  <li><strong>Account Activation:</strong> Your account is activated automatically after payment confirmation</li>
                  <li><strong>Email Confirmation:</strong> You'll receive a confirmation email with login details</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Geographic Availability</h2>
                <p>SoloFlow is available worldwide to users with internet access. However, payment processing may be subject to restrictions in certain countries based on our payment processor's policies.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Service Delivery Timeline</h2>
                <ul className="list-disc pl-6 mt-2">
                  <li><strong>Free Trial:</strong> Instant activation upon account creation</li>
                  <li><strong>Paid Subscriptions:</strong> Immediate activation upon successful payment</li>
                  <li><strong>Upgrades:</strong> Instant access to upgraded features</li>
                  <li><strong>Downgrades:</strong> Changes take effect at the next billing cycle</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Service Interruptions</h2>
                <p>In the rare event of service interruptions:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>We strive for 99.9% uptime</li>
                  <li>Scheduled maintenance is announced in advance</li>
                  <li>Emergency maintenance may occur without prior notice</li>
                  <li>Service credits may be applied for extended outages</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Technical Requirements</h2>
                <p>To access SoloFlow, you need:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>A modern web browser (Chrome, Firefox, Safari, Edge)</li>
                  <li>Stable internet connection</li>
                  <li>JavaScript enabled</li>
                  <li>Cookies enabled for authentication</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Data Export and Portability</h2>
                <p>While we don't ship physical products, we provide digital data portability:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Export your data at any time</li>
                  <li>Multiple export formats available</li>
                  <li>No restrictions on data downloads</li>
                  <li>Assistance available for data migration</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Support and Assistance</h2>
                <p>For any questions about accessing our service or technical difficulties, please contact our support team through our Contact Us page.</p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};