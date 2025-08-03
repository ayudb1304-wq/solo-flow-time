import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, FileText, BarChart3, Zap, Star, Check } from "lucide-react";
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
      description: "Start a timer with a single click, directly from your task list. No more clunky integrations or manual spreadsheets."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Client Management",
      description: "A clean, simple directory for your clients. See every project and invoice at a glance, without the clutter of a traditional CRM."
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Invoice Generation",
      description: "Turn your tracked hours into a professional invoice instantly. SoloFlow does the math for you, so you can get paid faster."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics & Reports",
      description: "Clear, simple reports that matter. See what you're earning and where your time is going, without overwhelming charts."
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
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
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
           The refreshingly simple, all-in-one platform for solo freelancers. 
           Ditch the spreadsheets and complex tools. Focus on your work, 
            not your software.
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
      <section id="features" className="container mx-auto px-4 py-12 md:py-20 relative z-10 bg-gradient-to-b from-primary/2 to-secondary/2 backdrop-blur-sm">
        <div 
          className="text-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.03}px)` }}
        >
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Finally, an All-in-One Tool That's Actually Simple
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

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-12 md:py-20 relative z-10 bg-gradient-to-b from-secondary/3 to-accent/3 backdrop-blur-sm">
        <div 
          className="text-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.03}px)` }}
        >
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Your Freelance Command Center, Simplified
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how SoloFlow transforms your chaotic workflow into an organized, efficient system
          </p>
        </div>

        {/* Step 1: Dashboard */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.02}px)` }}
        >
          <div className="order-2 lg:order-1">
            <img 
              src="/lovable-uploads/af2340bb-6107-4732-8fe9-c5fbd41fce9a.png" 
              alt="SoloFlow Dashboard Overview" 
              className="w-full rounded-lg shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-4">
            <h4 className="text-2xl font-bold text-foreground">See Everything That Matters, Instantly</h4>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Say goodbye to scattered information. Your SoloFlow dashboard provides a clear overview of your active projects, recent activity, and quick access to start tracking time. Get a bird's-eye view of your freelance world without feeling overwhelmed.
            </p>
          </div>
        </div>

        {/* Step 2: Clients */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.025}px)` }}
        >
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-foreground">A Single Hub for Your Clients</h4>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Stop hunting through emails and spreadsheets for client information. SoloFlow gives you one simple, clean directory for every client. Add contacts in seconds and have all their details in one organized hub, ready for any new project.
            </p>
          </div>
          <div>
            <img 
              src="/lovable-uploads/c3393c10-c430-44ba-8a9c-057552675889.png" 
              alt="SoloFlow Clients Management" 
              className="w-full rounded-lg shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* Step 3: Projects */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.02}px)` }}
        >
          <div className="order-2 lg:order-1">
            <img 
              src="/lovable-uploads/0c8eb70d-22bc-4d29-8c3a-56689c725cb6.png" 
              alt="SoloFlow Projects Organization" 
              className="w-full rounded-lg shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-4">
            <h4 className="text-2xl font-bold text-foreground">Organize Projects with Perfect Clarity</h4>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Finally, an end to confusing project lists. Create a new project and instantly link it to a client from your directory. See all your active work at a glance and know exactly who you're working for, eliminating guesswork.
            </p>
          </div>
        </div>

        {/* Step 4: Tasks */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.025}px)` }}
        >
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-foreground">Focus on Simple, Actionable To-Dos</h4>
            <p className="text-lg text-muted-foreground leading-relaxed">
              No complex timelines or Gantt charts. Inside each project is a straightforward to-do list. Quickly add the tasks you need to accomplish to keep your project moving forward. It's the simple, functional checklist you've always wanted.
            </p>
          </div>
          <div>
            <img 
              src="/lovable-uploads/58636014-5a12-483e-bf06-caf275ac083d.png" 
              alt="SoloFlow Task Management" 
              className="w-full rounded-lg shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* Step 5: Time Tracking */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.02}px)` }}
        >
          <div className="order-2 lg:order-1">
            <img 
              src="/lovable-uploads/4fa64490-8be7-413e-a798-7f38b0e29600.png" 
              alt="SoloFlow Time Tracking" 
              className="w-full rounded-lg shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-4">
            <h4 className="text-2xl font-bold text-foreground">Log Billable Hours, Effortlessly</h4>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Forget manual timers or spreadsheet formulas. A "Start" button lives right next to every task. Click it to start tracking your billable hours with perfect accuracy. Click "Stop" when you're done. Every second is logged and ready for invoicing.
            </p>
          </div>
        </div>

        {/* Step 6: Invoices */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.025}px)` }}
        >
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-foreground">Turn Your Hard Work into an Invoice</h4>
            <p className="text-lg text-muted-foreground leading-relaxed">
              This is the magic moment. Select a project, and SoloFlow automatically gathers all your unbilled time entries into a professional, clean invoice. No more manual calculations or copy-pasting. Get paid faster and for every minute you work.
            </p>
          </div>
          <div>
            <img 
              src="/lovable-uploads/d05ad3d7-f405-4837-aaeb-46fd7404ffc4.png" 
              alt="SoloFlow Invoice Generation" 
              className="w-full rounded-lg shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
            />
          </div>
        </div>

      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20 md:py-32 mt-16 md:mt-24 relative z-10 bg-gradient-to-b from-accent/2 to-background/50 backdrop-blur-sm flex flex-col items-center justify-center min-h-[80vh]">
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
          className="flex justify-center items-center w-full"
          style={{ transform: `translateY(${scrollY * 0.025}px)` }}
        >
          <div className="flex flex-col sm:flex-row gap-8 items-center justify-center max-w-4xl w-full px-4 min-h-[60vh]">
            {plans.map((plan, index) => (
              <Card key={index} className={`${plan.color} relative overflow-hidden shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-card/90 w-full max-w-sm`}>
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
                    className={`w-full ${plan.buttonColor} text-white shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105`}
                  >
                    {plan.name === 'Trial' ? 'Start Free' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16 md:py-20 relative z-10">
        <div 
          className="text-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 md:p-12 backdrop-blur-sm border border-primary/10 shadow-elegant mb-16"
          style={{ transform: `translateY(${scrollY * 0.015}px)` }}
        >
          <h4 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Stop Juggling. Start Flowing.
          </h4>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of freelancers who've simplified their workflow and increased their earnings
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6 bg-gradient-primary hover:opacity-90 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
          >
            Get Started for Free
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