import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Zap, AlertCircle } from "lucide-react";

interface UpgradePromptProps {
  title: string;
  message: string;
  onUpgrade: () => void;
  variant?: 'default' | 'cancellation';
  loading?: boolean;
}

export const UpgradePrompt = ({ title, message, onUpgrade, variant = 'default', loading = false }: UpgradePromptProps) => {
  const iscancellationVariant = variant === 'cancellation';
  
  return (
    <Card className={`${iscancellationVariant 
      ? 'bg-gradient-to-br from-orange-50 to-orange-25 border-orange-200' 
      : 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'}`}>
      <CardHeader className="text-center">
        <div className={`h-12 w-12 ${iscancellationVariant ? 'bg-orange-500' : 'bg-primary'} rounded-lg flex items-center justify-center mx-auto mb-4`}>
          {iscancellationVariant ? (
            <AlertCircle className="h-6 w-6 text-white" />
          ) : (
            <Crown className="h-6 w-6 text-primary-foreground" />
          )}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">{message}</p>
        <Button 
          onClick={onUpgrade} 
          disabled={loading}
          className={`w-full ${iscancellationVariant ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
        >
          <Zap className="h-4 w-4 mr-2" />
          {loading ? 'Processing...' : (iscancellationVariant ? 'Resubscribe Now' : 'Upgrade to Pro')}
        </Button>
      </CardContent>
    </Card>
  );
};