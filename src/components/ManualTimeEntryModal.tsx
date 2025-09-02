import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

interface Task {
  id: string;
  description: string;
}

interface ManualTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  tasks: Task[];
  onEntryAdded: () => void;
}

export const ManualTimeEntryModal = ({ 
  isOpen, 
  onClose, 
  projectId, 
  tasks, 
  onEntryAdded 
}: ManualTimeEntryModalProps) => {
  const [taskId, setTaskId] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [useStartEndTime, setUseStartEndTime] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setTaskId("");
    setDate(new Date());
    setUseStartEndTime(true);
    setStartTime("");
    setEndTime("");
    setDuration("");
    setDescription("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const parseDuration = (durationStr: string): number | null => {
    if (!durationStr.trim()) return null;
    
    // Support formats like: "1.5h", "90m", "1:30", "1h 30m"
    const normalizedStr = durationStr.toLowerCase().replace(/\s+/g, '');
    
    // Pattern for "1h30m", "2h", "45m"
    const hoursMinutesMatch = normalizedStr.match(/^(?:(\d+(?:\.\d+)?)h)?(?:(\d+)m)?$/);
    if (hoursMinutesMatch) {
      const hours = parseFloat(hoursMinutesMatch[1] || "0");
      const minutes = parseInt(hoursMinutesMatch[2] || "0");
      return Math.floor(hours * 3600 + minutes * 60);
    }
    
    // Pattern for "1:30" (hours:minutes)
    const timeMatch = normalizedStr.match(/^(\d+):(\d+)$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      return hours * 3600 + minutes * 60;
    }
    
    // Pattern for decimal hours "1.5"
    const decimalMatch = normalizedStr.match(/^(\d+(?:\.\d+)?)$/);
    if (decimalMatch) {
      const hours = parseFloat(decimalMatch[1]);
      return Math.floor(hours * 3600);
    }
    
    return null;
  };

  const validateForm = (): string | null => {
    if (!taskId) return "Please select a task";
    if (!date) return "Please select a date";
    
    if (useStartEndTime) {
      if (!startTime || !endTime) return "Please enter both start and end times";
      
      const start = new Date(`${format(date, 'yyyy-MM-dd')}T${startTime}`);
      const end = new Date(`${format(date, 'yyyy-MM-dd')}T${endTime}`);
      
      if (end <= start) return "End time must be after start time";
    } else {
      if (!duration.trim()) return "Please enter a duration";
      const durationSeconds = parseDuration(duration);
      if (!durationSeconds || durationSeconds <= 0) {
        return "Invalid duration format. Use formats like '1h 30m', '90m', '1:30', or '1.5'";
      }
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedTask = tasks.find(t => t.id === taskId);
      let startDateTime: Date;
      let endDateTime: Date;
      let durationSeconds: number;

      if (useStartEndTime) {
        startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${startTime}`);
        endDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${endTime}`);
        durationSeconds = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000);
      } else {
        durationSeconds = parseDuration(duration)!;
        // Default to 9 AM start time for duration-only entries
        startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T09:00`);
        endDateTime = new Date(startDateTime.getTime() + durationSeconds * 1000);
      }

      const { error } = await supabase
        .from('time_entries')
        .insert({
          task_id: taskId,
          project_id: projectId,
          user_id: user?.id,
          task_description: selectedTask?.description || 'General Project Work',
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          duration_seconds: durationSeconds,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${Math.floor(durationSeconds / 60)} minutes to the project`,
      });

      onEntryAdded();
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add time entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Manual Time Entry</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Task Selection */}
          <div className="space-y-2">
            <Label htmlFor="task">Task *</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Project Work</SelectItem>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Entry Method Toggle */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="entry-method"
                checked={useStartEndTime}
                onCheckedChange={setUseStartEndTime}
              />
              <Label htmlFor="entry-method" className="text-sm">
                {useStartEndTime ? "Start & End Time" : "Duration"}
              </Label>
            </div>

            {useStartEndTime ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 1h 30m, 90m, 1:30, 1.5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Formats: "1h 30m", "90m", "1:30", or "1.5" (hours)
                </p>
              </div>
            )}
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes about the work done..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Adding..." : "Save Entry"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};