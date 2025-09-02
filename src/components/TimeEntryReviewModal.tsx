import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimeEntry {
  id: string;
  task_description: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
}

interface TimeEntryReviewModalProps {
  entry: TimeEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onEntryUpdated: () => void;
}

export const TimeEntryReviewModal: React.FC<TimeEntryReviewModalProps> = ({
  entry,
  isOpen,
  onClose,
  onEntryUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editedHours, setEditedHours] = useState('');
  const [editedMinutes, setEditedMinutes] = useState('');
  const { toast } = useToast();

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getTotalDuration = (): number => {
    if (!entry) return 0;
    if (entry.duration_seconds) return entry.duration_seconds;
    
    // Calculate from start/end times if duration not available
    if (entry.start_time && entry.end_time) {
      const start = new Date(entry.start_time);
      const end = new Date(entry.end_time);
      return Math.floor((end.getTime() - start.getTime()) / 1000);
    }
    
    return 0;
  };

  const handleKeepFullTime = async () => {
    if (!entry) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ needs_review: false })
        .eq('id', entry.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time entry kept as is",
      });

      onEntryUpdated();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDuration = async () => {
    if (!entry || !editedHours || !editedMinutes) {
      toast({
        title: "Error",
        description: "Please enter valid hours and minutes",
        variant: "destructive",
      });
      return;
    }

    const hours = parseInt(editedHours);
    const minutes = parseInt(editedMinutes);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0 || minutes >= 60) {
      toast({
        title: "Error",
        description: "Please enter valid time values",
        variant: "destructive",
      });
      return;
    }

    const newDurationSeconds = (hours * 3600) + (minutes * 60);
    
    setIsLoading(true);
    try {
      // Calculate new end time based on start time and new duration
      const startTime = new Date(entry.start_time);
      const newEndTime = new Date(startTime.getTime() + (newDurationSeconds * 1000));

      const { error } = await supabase
        .from('time_entries')
        .update({
          duration_seconds: newDurationSeconds,
          end_time: newEndTime.toISOString(),
          needs_review: false
        })
        .eq('id', entry.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time entry duration updated",
      });

      onEntryUpdated();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!entry) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time entry deleted",
      });

      onEntryUpdated();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (entry && isOpen) {
      const totalSeconds = getTotalDuration();
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      setEditedHours(hours.toString());
      setEditedMinutes(minutes.toString());
    }
  }, [entry, isOpen]);

  if (!entry) return null;

  const totalDuration = getTotalDuration();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Review Time Entry
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            We noticed a period of inactivity while this timer was running for a total of{' '}
            <span className="font-semibold text-foreground">
              {formatDuration(totalDuration)}
            </span>
            . Please review for accuracy.
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Task: {entry.task_description}</div>
            <div className="text-sm text-muted-foreground">
              Started: {new Date(entry.start_time).toLocaleString()}
            </div>
            {entry.end_time && (
              <div className="text-sm text-muted-foreground">
                Ended: {new Date(entry.end_time).toLocaleString()}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  value={editedHours}
                  onChange={(e) => setEditedHours(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="minutes">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={editedMinutes}
                  onChange={(e) => setEditedMinutes(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleKeepFullTime}
              disabled={isLoading}
              className="w-full"
            >
              Keep Full Time
            </Button>
            
            <Button
              onClick={handleEditDuration}
              disabled={isLoading}
              variant="secondary"
              className="w-full"
            >
              Save Edited Duration
            </Button>
            
            <Button
              onClick={handleDeleteEntry}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              Delete Entry
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};