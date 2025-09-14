import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, FileText, BarChart3, Zap, Star, Check, ArrowRight, Sparkles, Shield, Crown } from "lucide-react";
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
      name: "Starter",
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
      gradient: "from-slate-100 to-slate-200",
      borderGradient: "from-slate-300 to-slate-400",
      buttonVariant: "secondary" as const
    },
    {
      icon: <Crown className="h-5 w-5" />,
      name: "Professional",
      price: "₹799",
      period: "/month",
      description: "For serious freelancers & agencies",
      features: [
        "Unlimited clients & projects",
        "Advanced invoicing with branding",
        "Comprehensive analytics & insights", 
        "Priority email support",
        "Data export & backup",
        "Custom invoice templates",
        "Advanced reporting dashboard"
      ],
      gradient: "from-primary/20 via-primary/10 to-primary/5",
      borderGradient: "from-primary via-primary/80 to-primary/60",
      buttonVariant: "default" as const,
      popular: true,
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/3 overflow-hidden relative">
      {/* Premium background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div 
          className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.1}px) rotate(${scrollY * 0.05}deg)` }}
        />
        <div 
          className="absolute top-1/4 -right-40 w-96 h-96 bg-gradient-to-bl from-secondary/15 via-accent/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"
          style={{ transform: `translateY(${scrollY * 0.15}px) rotate(${scrollY * -0.03}deg)` }}
        />
        <div 
          className="absolute -bottom-40 left-1/3 w-72 h-72 bg-gradient-to-tr from-accent/20 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse delay-2000"
          style={{ transform: `translateY(${scrollY * -0.1}px) rotate(${scrollY * 0.08}deg)` }}
        />
        
        {/* Floating particles removed */}
      </div>
      {/* Premium Header */}
      <header className="border-b border-border/20 bg-background/90 backdrop-blur-xl sticky top-0 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/assets/soloflow-logo.png" 
                alt="SoloFlow Logo" 
                className="h-8 w-8"
              />
            </div>
            <strong className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              SoloFlow
            </strong>
            <div className="hidden sm:flex items-center gap-1 ml-2 px-2 py-1 bg-primary/10 rounded-full">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">Premium</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 font-medium">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 font-medium">How it Works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 font-medium">Pricing</a>
          </nav>
          <Button 
            onClick={onGetStarted} 
            variant="outline" 
            className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              Sign In
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>
        </div>
      </header>

      {/* Premium Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-28 text-center relative z-10">
        <div 
          className="max-w-5xl mx-auto"
          style={{ transform: `translateY(${scrollY * 0.05}px)` }}
        >
          {/* Premium badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full border border-primary/20 mb-8 backdrop-blur-sm">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium Freelance Management</span>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          
          <h1 className="text-4xl md:text-7xl font-bold mb-8 leading-[0.9] tracking-tight">
            <span className="text-foreground">Get Paid For</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-accent">
              Every Minute You Work
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto font-light">
            The sophisticated, all-in-one platform for premium freelancers and agencies. 
            <br className="hidden md:block" />
            <span className="text-foreground/80 font-medium">Transform chaos into profit</span> with enterprise-grade tools designed for excellence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={onGetStarted}
              size="lg" 
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)] transition-all duration-500 hover:scale-105 border-0 group"
            >
              <span className="flex items-center gap-3">
                Start Your Premium Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Free forever starter plan • No credit card required</span>
            </div>
          </div>
          
          {/* Social proof */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground font-medium">Built for freelancers who value simplicity</p>
            <div className="flex items-center gap-2 border border-border/50 rounded-full px-4 py-2 opacity-80 bg-background/50 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Clutter-Free by Design</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-12 md:py-20 relative z-10 bg-gradient-to-b from-primary/2 to-secondary/2 backdrop-blur-sm">
        <div 
          className="text-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.03}px)` }}
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Finally, an All-in-One Tool That's Actually Simple
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The simple, intuitive alternative to complex project management tools. No steep learning curve, just clarity.
            <br />Powerful features designed to help freelancers and agencies work more efficiently
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

      {/* How It Works Section with Enhanced Parallax */}
      <section id="how-it-works" className="container mx-auto px-4 py-12 md:py-20 relative z-10 bg-gradient-to-b from-secondary/3 to-accent/3 backdrop-blur-sm">
        <div 
          className="text-center mb-16"
          style={{ transform: `translateY(${scrollY * 0.03}px)` }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full border border-primary/20 mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Workflow Excellence</span>
          </div>
          
          <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Your Freelance
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Command Center
            </span>
          </h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
            See how SoloFlow transforms your chaotic workflow into an organized, efficient system that scales with your ambitions.
          </p>
        </div>

        {/* Step 1: Dashboard with Enhanced Parallax */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center mb-20"
          style={{ transform: `translateY(${scrollY * 0.02}px) translateX(${scrollY * 0.01}px)` }}
        >
          <div className="order-2 lg:order-1">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img 
                src="/assets/dashboard-screenshot.png" 
                alt="SoloFlow Dashboard Overview" 
                className="w-full rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all duration-500 hover:scale-105 relative z-10"
                style={{ transform: `translateY(${scrollY * -0.01}px)` }}
              />
            </div>
          </div>
          <div 
            className="order-1 lg:order-2 space-y-6"
            style={{ transform: `translateY(${scrollY * 0.015}px)` }}
          >
            <h4 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              See Everything That Matters,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"> Instantly</span>
            </h4>
            <p className="text-lg text-muted-foreground leading-relaxed font-light">
              Say goodbye to scattered information. Your SoloFlow dashboard provides a crystal-clear overview of your active projects, recent activity, and quick access to start tracking time. Get a bird's-eye view of your freelance empire without feeling overwhelmed.
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
              src="/assets/clients-screenshot.png" 
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

      {/* Premium Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-24 md:py-40 mt-20 md:mt-32 relative z-10 bg-gradient-to-b from-background/95 via-primary/2 to-background/90 backdrop-blur-sm flex flex-col items-center justify-center min-h-[90vh]">
        <div 
          className="text-center mb-20"
          style={{ transform: `translateY(${scrollY * 0.04}px)` }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full border border-primary/20 mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium Plans</span>
          </div>
          
          <h3 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Invest in Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Professional Growth
            </span>
          </h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
            Choose the perfect plan to scale your freelance business. Start free, upgrade when you're ready to unlock your full potential.
          </p>
        </div>

        <div 
          className="flex justify-center items-center w-full"
          style={{ transform: `translateY(${scrollY * 0.025}px)` }}
        >
          <div className="flex flex-col sm:flex-row gap-8 items-center justify-center max-w-4xl w-full px-4 min-h-[60vh]">
          {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative overflow-visible transition-all duration-500 hover:scale-105 w-full max-w-sm group ${
                  plan.premium 
                    ? 'border-2 bg-gradient-to-br from-primary/5 to-accent/5 shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] border-primary/30' 
                    : 'border border-border/50 bg-card/80 backdrop-blur-sm shadow-elegant hover:shadow-glow'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-2 -right-2 z-20">
                    <div className="bg-gradient-to-r from-primary to-accent text-white px-3 py-1 text-xs font-bold rounded-full border-2 border-background shadow-lg">
                      ⭐ Most Popular
                    </div>
                  </div>
                )}
                
                {plan.premium && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-full backdrop-blur-sm">
                    <Crown className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-primary">Premium</span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6 relative">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className={`p-3 rounded-full ${plan.premium ? 'bg-gradient-to-r from-primary/20 to-accent/20' : 'bg-muted/50'} group-hover:scale-110 transition-transform duration-300`}>
                      <div className={plan.premium ? 'text-primary' : 'text-muted-foreground'}>
                        {plan.icon}
                      </div>
                    </div>
                  </div>
                  <CardTitle className={`text-2xl mb-2 ${plan.premium ? 'text-foreground' : 'text-foreground'}`}>
                    {plan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <span className={`text-4xl font-bold ${plan.premium ? 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent' : 'text-foreground'}`}>
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground font-medium">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className={`p-1 rounded-full ${plan.premium ? 'bg-primary/20' : 'bg-green-500/20'} mt-0.5`}>
                          <Check className={`h-3 w-3 ${plan.premium ? 'text-primary' : 'text-green-600'}`} />
                        </div>
                        <span className="text-sm leading-relaxed font-medium text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={onGetStarted}
                    variant={plan.buttonVariant}
                    size="lg"
                    className={`w-full transition-all duration-300 hover:scale-105 font-medium ${
                      plan.premium 
                        ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] border-0' 
                        : 'shadow-elegant hover:shadow-glow'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {plan.name === 'Starter' ? 'Start Free' : 'Upgrade to Pro'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
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
                  src="/assets/soloflow-logo.png" 
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