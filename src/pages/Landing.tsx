import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, FileText, BarChart3, Zap, Crown, Star, Check } from "lucide-react";
import { useState } from "react";

interface LandingProps {
  onGetStarted: () => void;
}

export const Landing = ({ onGetStarted }: LandingProps) => {
  const [activeTab, setActiveTab] = useState<'freelancer' | 'agency'>('freelancer');

  const features = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Time Tracking",
      description: "Track time spent on projects with precision and generate detailed reports"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Client Management",
      description: "Organize all your client information and project history in one place"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Invoice Generation",
      description: "Create professional invoices automatically from your tracked time"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics & Reports",
      description: "Get insights into your productivity and revenue trends"
    }
  ];

  const plans = [
    {
      icon: <Star className="h-5 w-5" />,
      name: "Trial",
      price: "Free",
      period: "Forever",
      description: "Perfect for getting started",
      features: [
        "Up to 3 clients",
        "Up to 5 projects",
        "Basic time tracking",
        "Simple invoicing",
        "Basic reports"
      ],
      color: "border-gray-200",
      buttonColor: "bg-gray-600 hover:bg-gray-700"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      name: "Pro",
      price: "₹799",
      period: "/month",
      description: "For growing freelancers",
      features: [
        "Unlimited clients & projects",
        "Advanced invoicing",
        "Detailed reports",
        "Priority support",
        "Export capabilities"
      ],
      color: "border-blue-200 border-2",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      popular: true
    },
    {
      icon: <Crown className="h-5 w-5" />,
      name: "Business",
      price: "₹1599",
      period: "/month",
      description: "For agencies and teams",
      features: [
        "Everything in Pro",
        "Multi-user access",
        "API integrations",
        "White-label options",
        "Custom branding"
      ],
      color: "border-purple-200",
      buttonColor: "bg-purple-600 hover:bg-purple-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">SoloFlow</h1>
          </div>
          <Button onClick={onGetStarted} variant="outline">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Streamline Your
            <span className="text-transparent bg-clip-text bg-gradient-primary"> Freelance</span>
            <br />Business
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            The all-in-one platform for freelancers and agencies to track time, manage clients, 
            and generate professional invoices. Focus on what you do best while we handle the rest.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={onGetStarted}
              size="lg" 
              className="text-lg px-8 py-6 bg-gradient-primary hover:opacity-90"
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-6"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need to Succeed
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help freelancers and agencies work more efficiently
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4">
                  <div className="text-primary">
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Start free and upgrade as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`${plan.color} relative overflow-hidden`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="text-primary">{plan.icon}</div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={onGetStarted}
                  className={`w-full ${plan.buttonColor} text-white`}
                >
                  {plan.name === 'Trial' ? 'Start Free' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-foreground mb-6">
            Ready to Transform Your Business?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of freelancers who have streamlined their workflow with SoloFlow
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="text-lg px-8 py-6 bg-gradient-primary hover:opacity-90"
          >
            Start Your Free Trial Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">SoloFlow</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                The complete project management solution for freelancers and solo entrepreneurs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="/shipping" className="text-muted-foreground hover:text-foreground transition-colors">Shipping Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="/cancellation-refunds" className="text-muted-foreground hover:text-foreground transition-colors">Cancellation & Refunds</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <p className="text-muted-foreground text-sm">
                support@soloflow.pro
              </p>
            </div>
          </div>
          <div className="border-t pt-8 text-center">
            <p className="text-muted-foreground text-sm">© 2024 SoloFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};