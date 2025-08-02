import { Button } from "./ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { name: "Clients", icon: Users, key: "clients" },
  { name: "Projects", icon: Briefcase, key: "projects" },
  { name: "Invoices", icon: FileText, key: "invoices" },
  { name: "Settings", icon: Settings, key: "settings" },
];

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

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
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-soft transform transition-transform duration-300 ease-in-out md:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "min-h-[calc(100vh-73px)] md:min-h-[calc(100vh-73px)]"
      )}>
        <div className="p-4">
          {/* Mobile Close Button */}
          <div className="flex justify-end mb-4 md:hidden">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === currentPage;
              
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavigation(item.key)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};