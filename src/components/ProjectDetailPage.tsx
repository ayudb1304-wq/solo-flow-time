import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, Square, Trash2, Plus, Clock, CheckCircle2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Project {
  id: string;
  name: string;
  clients: {
    name: string;
  };
}

interface Task {
  id: string;
  description: string;
  status: string;
  created_at: string;
}

interface TimeEntry {
  id: string;
  task_description: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  invoice_id: string | null;
}

interface ProjectDetailPageProps {
  projectId: string;
  onBack: () => void;
  onGenerateInvoice: (projectId: string) => void;
}

export const ProjectDetailPage = ({ projectId, onBack, onGenerateInvoice }: ProjectDetailPageProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && projectId) {
      fetchProjectDetails();
      fetchTasks();
      fetchTimeEntries();
    }
  }, [user, projectId]);

  const fetchProjectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            name
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive",
      });
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    }
  };

  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('project_id', projectId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
      
      // Check for active timer
      const activeEntry = data?.find(entry => !entry.end_time);
      if (activeEntry) {
        setActiveTimer(activeEntry.task_id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch time entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskDescription.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          description: newTaskDescription.trim(),
          project_id: projectId,
          user_id: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task added successfully",
      });

      setNewTaskDescription("");
      fetchTasks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'todo' ? 'done' : 'todo';
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      fetchTasks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleStartTimer = async (taskId: string, taskDescription: string) => {
    try {
      // Stop any active timer first
      if (activeTimer) {
        await handleStopTimer();
      }

      const { error } = await supabase
        .from('time_entries')
        .insert({
          task_id: taskId,
          project_id: projectId,
          user_id: user?.id,
          task_description: taskDescription,
          start_time: new Date().toISOString(),
        });

      if (error) throw error;

      setActiveTimer(taskId);
      toast({
        title: "Timer started",
        description: `Started tracking time for: ${taskDescription}`,
      });

      fetchTimeEntries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;

    try {
      const activeEntry = timeEntries.find(entry => entry.task_description && !entry.end_time);
      if (!activeEntry) return;

      const endTime = new Date();
      const startTime = new Date(activeEntry.start_time);
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', activeEntry.id);

      if (error) throw error;

      setActiveTimer(null);
      toast({
        title: "Timer stopped",
        description: `Logged ${Math.floor(durationSeconds / 60)} minutes`,
      });

      fetchTimeEntries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const unInvoicedEntries = timeEntries.filter(entry => !entry.invoice_id && entry.end_time);

  if (loading) {
    return <div className="p-6">Loading project details...</div>;
  }

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
          <p className="text-muted-foreground">Client: {project.clients.name}</p>
        </div>
      </div>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <Button onClick={handleAddTask} disabled={!newTaskDescription.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={() => handleToggleTask(task.id, task.status)}
                  className="w-4 h-4"
                />
                <span className={`flex-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.description}
                </span>
                {task.status === 'todo' && (
                  <Button
                    size="sm"
                    variant={activeTimer === task.id ? "destructive" : "outline"}
                    onClick={() => activeTimer === task.id ? handleStopTimer() : handleStartTimer(task.id, task.description)}
                  >
                    {activeTimer === task.id ? (
                      <>
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Entries Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Entries
          </CardTitle>
          {unInvoicedEntries.length > 0 && (
            <Button onClick={() => onGenerateInvoice(projectId)} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Invoice
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No time entries yet. Start a timer to begin tracking.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.task_description}</TableCell>
                    <TableCell>{new Date(entry.start_time).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {entry.end_time ? (
                        formatDuration(entry.duration_seconds)
                      ) : (
                        <span className="text-primary">Running...</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.invoice_id ? (
                        <span className="text-sm bg-accent text-accent-foreground px-2 py-1 rounded">
                          Invoiced
                        </span>
                      ) : entry.end_time ? (
                        <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          Pending
                        </span>
                      ) : (
                        <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};