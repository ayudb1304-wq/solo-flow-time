import { Button } from "./ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Settings,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export const Sidebar = ({ currentPage, onPageChange }: SidebarProps) => {
  return (
    <div className="w-64 bg-card border-r border-border shadow-soft min-h-[calc(100vh-73px)]">
      <div className="p-4">
        <Button className="w-full mb-6" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Quick Add
        </Button>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === currentPage;
            
            return (
              <button
                key={item.key}
                onClick={() => onPageChange(item.key)}
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
  );
};