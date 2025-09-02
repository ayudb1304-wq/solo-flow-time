import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Play } from "lucide-react";

interface WelcomeBackModalProps {
  open: boolean;
  onClose: () => void;
  idleDuration: number;
  taskDescription: string;
  onKeepTime: () => void;
  onDiscardAndStop: () => void;
  onDiscardAndContinue: () => void;
}

export const WelcomeBackModal = ({
  open,
  onClose,
  idleDuration,
  taskDescription,
  onKeepTime,
  onDiscardAndStop,
  onDiscardAndContinue
}: WelcomeBackModalProps) => {
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const handleKeepTime = () => {
    onKeepTime();
    onClose();
  };

  const handleDiscardAndStop = () => {
    onDiscardAndStop();
    onClose();
  };

  const handleDiscardAndContinue = () => {
    onDiscardAndContinue();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-amber-500" />
            Welcome back!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              While you were away, we paused your timer to protect your timesheet.
            </p>
            <p className="text-lg font-semibold text-amber-900 mt-2">
              You've been idle for {formatDuration(idleDuration)}
            </p>
            {taskDescription && (
              <p className="text-xs text-amber-700 mt-1">
                Task: {taskDescription}
              </p>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            What would you like to do with this time?
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleKeepTime} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Keep This Time
            </Button>
            
            <Button 
              onClick={handleDiscardAndContinue} 
              variant="outline" 
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Discard Idle Time & Continue Working
            </Button>
            
            <Button 
              onClick={handleDiscardAndStop} 
              variant="outline" 
              className="w-full text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Discard Idle Time & Stop Timer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};