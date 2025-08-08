import { Button } from "./ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Settings,
  X,
  Sparkles,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { useSubscription } from "@/hooks/useSubscription";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, key: "dashboard", gradient: "from-blue-500 to-cyan-500" },
  { name: "Clients", icon: Users, key: "clients", gradient: "from-purple-500 to-pink-500" },
  { name: "Projects", icon: Briefcase, key: "projects", gradient: "from-green-500 to-emerald-500" },
  { name: "Invoices", icon: FileText, key: "invoices", gradient: "from-orange-500 to-red-500" },
  { name: "Settings", icon: Settings, key: "settings", gradient: "from-gray-500 to-slate-500" },
];

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PremiumSection = () => {
  const { plan } = useSubscription();
  
  if (plan === 'pro') {
    return (
      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-medium text-emerald-500">Pro Plan Active</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Enjoying unlimited projects and advanced features!
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <Crown className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-primary">Premium Features</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Unlock unlimited projects, advanced reporting, and more.
      </p>
    </div>
  );
};

export const Sidebar = ({ currentPage, onPageChange, isOpen, onClose }: SidebarProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNavigation = (page: string) => {
    onPageChange(page);
    onClose(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-card via-card/95 to-card/90 border-r border-border/50 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl transform transition-all duration-500 ease-out md:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "min-h-[calc(100vh-73px)] md:min-h-[calc(100vh-73px)]"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-border/30">
          <div className="flex justify-between items-center mb-4 md:hidden">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">SoloFlow</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="hidden md:block">
            <SubscriptionBadge />
          </div>
        </div>
        
        {/* Navigation */}
        <div className="p-4 space-y-2">
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
              Workspace
            </p>
          </div>
          
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === currentPage;
              
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavigation(item.key)}
                  className={cn(
                    "w-full group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-[0_8px_20px_rgba(0,0,0,0.15)] scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted/60 hover:scale-105 hover:shadow-md"
                  )}
                >
                  {/* Background glow for active state */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-xl -z-10" />
                  )}
                  
                  {/* Icon with gradient background */}
                  <div className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-300",
                    isActive 
                      ? "bg-white/20 backdrop-blur-sm" 
                      : `bg-gradient-to-br ${item.gradient} bg-opacity-10 group-hover:bg-opacity-20`
                  )}>
                    <Icon className={cn(
                      "h-4 w-4 transition-all duration-300",
                      isActive ? "text-white" : "text-foreground/80 group-hover:text-foreground"
                    )} />
                    
                    {/* Sparkle effect for active item */}
                    {isActive && (
                      <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-accent animate-pulse" />
                    )}
                  </div>
                  
                  <span className="flex-1 text-left">{item.name}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/30 bg-gradient-to-t from-card/95 to-transparent">
          <PremiumSection />
        </div>
      </div>
    </>
  );
};