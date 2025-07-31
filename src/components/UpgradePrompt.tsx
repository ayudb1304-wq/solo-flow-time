import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Zap } from "lucide-react";

interface UpgradePromptProps {
  title: string;
  message: string;
  onUpgrade: () => void;
}

export const UpgradePrompt = ({ title, message, onUpgrade }: UpgradePromptProps) => {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader className="text-center">
        <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
          <Crown className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">{message}</p>
        <Button onClick={onUpgrade} className="w-full">
          <Zap className="h-4 w-4 mr-2" />
          Upgrade to Pro
        </Button>
      </CardContent>
    </Card>
  );
};