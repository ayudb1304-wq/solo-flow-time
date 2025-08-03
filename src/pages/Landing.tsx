import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, FileText, BarChart3, Zap, Crown, Star, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface LandingProps {
  onGetStarted: () => void;
}

export const Landing = ({ onGetStarted }: LandingProps) => {
  const [activeTab, setActiveTab] = useState<'freelancer' | 'agency'>('freelancer');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Parallax background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        ></div>
        <div 
          className="absolute top-40 right-20 w-24 h-24 bg-secondary/10 rounded-full blur-lg animate-pulse delay-1000"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        ></div>
        <div 
          className="absolute bottom-40 left-1/4 w-40 h-40 bg-accent/5 rounded-full blur-xl animate-pulse delay-2000"
          style={{ transform: `translateY(${scrollY * -0.1}px)` }}
        ></div>
        <div 
          className="absolute top-1/2 right-1/4 w-20 h-20 bg-primary/8 rounded-full blur-md animate-pulse delay-3000"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        ></div>
      </div>
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 shadow-elegant">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/e339f632-47ba-4c99-aa28-fec9c874e878.png" 
              alt="SoloFlow Logo" 
              className="h-8 w-8"
            />
            <h1 className="text-xl font-bold text-foreground">SoloFlow</h1>
          </div>
          <Button onClick={onGetStarted} variant="outline">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center relative z-10 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur-sm">
        <div 
          className="max-w-4xl mx-auto"
          style={{ transform: `translateY(${scrollY * 0.05}px)` }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Streamline Your
            <span className="text-transparent bg-clip-text bg-gradient-primary"> Freelance</span>
            <br />Business
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            The all-in-one platform for freelancers and agencies to track time, manage clients, 
            and generate professional invoices. Focus on what you do best while we handle the rest.
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={onGetStarted}
              size="lg" 
              className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6 bg-gradient-primary hover:opacity-90 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 relative z-10 bg-gradient-to-b from-primary/2 to-secondary/2 backdrop-blur-sm">
        <div 
          className="text-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.03}px)` }}
        >
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need to Succeed
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help freelancers and agencies work more efficiently
          </p>
        </div>
        
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          style={{ transform: `translateY(${scrollY * 0.02}px)` }}
        >
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105 group backdrop-blur-sm bg-card/80">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-gradient-primary/20 transition-colors duration-300 group-hover:shadow-glow">
                  <div className="text-primary group-hover:scale-110 transition-transform duration-300">
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
      <section className="container mx-auto px-4 py-12 md:py-20 relative z-10 bg-gradient-to-b from-accent/2 to-background/50 backdrop-blur-sm">
        <div 
          className="text-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.04}px)` }}
        >
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Start free and upgrade as you grow.
          </p>
        </div>

        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto"
          style={{ transform: `translateY(${scrollY * 0.025}px)` }}
        >
          {plans.map((plan, index) => (
            <Card key={index} className={`${plan.color} relative overflow-hidden shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-card/90`}>
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
                  onClick={plan.name === 'Business' ? undefined : onGetStarted}
                  className={`w-full ${plan.name === 'Business' ? 'bg-gray-400 cursor-not-allowed' : plan.buttonColor} text-white shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105`}
                  disabled={plan.name === 'Business'}
                >
                  {plan.name === 'Trial' ? 'Start Free' : plan.name === 'Business' ? 'Coming Soon' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center relative z-10 bg-gradient-to-b from-primary/3 to-secondary/3 backdrop-blur-sm">
        <div 
          className="max-w-3xl mx-auto"
          style={{ transform: `translateY(${scrollY * 0.035}px)` }}
        >
          <h3 className="text-3xl font-bold text-foreground mb-6">
            Ready to Transform Your Business?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of freelancers who have streamlined their workflow with SoloFlow
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6 bg-gradient-primary hover:opacity-90 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
          >
            Start Your Free Trial Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-b from-muted/30 to-muted/50 py-12 relative z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/lovable-uploads/e339f632-47ba-4c99-aa28-fec9c874e878.png" 
                  alt="SoloFlow Logo" 
                  className="h-8 w-8"
                />
                <h3 className="text-xl font-bold text-foreground">SoloFlow</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                The complete project management solution for freelancers and solo entrepreneurs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/shipping" className="text-muted-foreground hover:text-foreground transition-colors">Shipping Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link to="/cancellation-refunds" className="text-muted-foreground hover:text-foreground transition-colors">Cancellation & Refunds</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <p className="text-muted-foreground text-sm">
                abhiogade@gmail.com
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