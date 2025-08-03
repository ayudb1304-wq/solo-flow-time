import { Badge } from "@/components/ui/badge";
import { Zap, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export const SubscriptionBadge = () => {
  const { plan, loading } = useSubscription();

  if (loading) {
    return <Badge variant="secondary" className="animate-pulse">
      <div className="h-3 w-12 bg-muted-foreground/20 rounded animate-pulse" />
    </Badge>;
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <Zap className="h-3 w-3 mr-1" />;
      default:
        return <Star className="h-3 w-3 mr-1" />;
    }
  };

  const getPlanVariant = (plan: string) => {
    switch (plan) {
      case 'pro':
        return "default";
      default:
        return "outline";
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'Pro Plan';
      default:
        return 'Trial';
    }
  };

  return (
    <Badge variant={getPlanVariant(plan)} className="flex items-center">
      {getPlanIcon(plan)}
      {getPlanLabel(plan)}
    </Badge>
  );
};