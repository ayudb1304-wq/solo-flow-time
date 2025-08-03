import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Timer, User, Bell, LogOut, Settings, Menu } from "lucide-react";
import { useAuth } from "./auth/AuthProvider";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

interface TopBarProps {
  onMenuClick?: () => void;
  onPageChange?: (page: string) => void;
}

export const TopBar = ({ onMenuClick, onPageChange }: TopBarProps) => {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-card shadow-soft">
      <div className="flex items-center justify-between px-3 md:px-6 py-4">
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/lovable-uploads/e339f632-47ba-4c99-aa28-fec9c874e878.png" 
              alt="SoloFlow Logo" 
              className="h-8 w-8"
            />
            <h1 className="text-lg md:text-xl font-bold text-foreground">SoloFlow</h1>
          </button>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden sm:block">
            <SubscriptionBadge />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 md:space-x-2">
                <Avatar className="h-7 w-7 md:h-8 md:w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium">
                  {profile?.freelancer_name || user?.email?.split('@')[0] || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onPageChange?.('profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPageChange?.('settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    // Error is already handled in AuthProvider
                    console.warn('Logout handled in AuthProvider');
                  }
                }} 
                className="text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};