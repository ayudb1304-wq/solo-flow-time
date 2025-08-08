import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  Clock, 
  Users, 
  Briefcase, 
  DollarSign, 
  Play, 
  Plus,
  Timer,
  TrendingUp,
  Sparkles,
  Activity,
  Target,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useCurrency } from "@/hooks/useCurrency";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string;
  status: string;
  created_at: string;
  clients: {
    name: string;
  };
  completionPercentage?: number;
}

interface Task {
  id: string;
  project_id: string;
  status: string;
}

interface TimeEntry {
  id: string;
  task_description: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  projects: {
    name: string;
  };
}

interface Invoice {
  id: string;
  status: string;
  total_amount: number;
}

interface DashboardProps {
  onProjectSelect?: (projectId: string) => void;
}

export const Dashboard = ({ onProjectSelect }: DashboardProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    totalHours: 0,
    activeProjects: 0,
    totalClients: 0,
    pendingInvoices: 0,
    totalRevenue: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { checkLimit } = useSubscription();
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchProjects(),
        fetchClients(),
        fetchTimeEntries(),
        fetchInvoices(),
        fetchTasks(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            name
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, project_id, status');

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const calculateProjectCompletion = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.project_id === projectId);
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(task => task.status === 'done');
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          projects (
            name
          )
        `)
        .order('start_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTimeEntries(data || []);
      
      // Calculate total hours
      const totalSeconds = (data || []).reduce((acc, entry) => {
        return acc + (entry.duration_seconds || 0);
      }, 0);
      
      setStats(prev => ({ ...prev, totalHours: totalSeconds / 3600 }));
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, status, total_amount');

      if (error) throw error;
      setInvoices(data || []);
      
      const pendingAmount = (data || [])
        .filter(invoice => invoice.status === 'sent')
        .reduce((sum, invoice) => sum + invoice.total_amount, 0);
        
      const totalRevenue = (data || [])
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.total_amount, 0);
      
      setStats(prev => ({ 
        ...prev, 
        pendingInvoices: pendingAmount,
        totalRevenue,
        activeProjects: projects.length,
        totalClients: clients.length
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim() || !selectedClientId) return;

    // Check subscription limits
    const limitCheck = checkLimit('maxProjects', projects.length);
    if (!limitCheck.allowed) {
      toast({
        title: "Limit Reached",
        description: limitCheck.message,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName.trim(),
          client_id: selectedClientId,
          user_id: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      setNewProjectName("");
      setSelectedClientId("");
      setIsDialogOpen(false);
      // Refresh all data to update stats
      fetchAllData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0h 0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Welcome Back!
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's what's happening with your freelance business today
        </p>
      </div>

      {/* Premium Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 dark:from-blue-950/50 dark:to-cyan-950/50 dark:border-blue-800/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Hours</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.totalHours.toFixed(1)}h</p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70">All time tracked</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-xl" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/50 dark:from-purple-950/50 dark:to-pink-950/50 dark:border-purple-800/50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Active Projects</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{projects.length}</p>
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70">Currently active</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 dark:from-green-950/50 dark:to-emerald-950/50 dark:border-green-800/50">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Clients</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{clients.length}</p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">All clients</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-xl" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/50 dark:from-orange-950/50 dark:to-amber-950/50 dark:border-orange-800/50">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Pending Revenue</p>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(stats.pendingInvoices)}</p>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70">From sent invoices</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-full blur-xl" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm bg-card/80">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  Active Projects
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {projects.length}
                  </Badge>
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
                      disabled={!checkLimit('maxProjects', projects.length).allowed}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" />
                        Add New Project
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="grid gap-3">
                        <Label htmlFor="project-name" className="text-sm font-medium">Project Name</Label>
                        <Input
                          id="project-name"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="Enter project name"
                          className="h-11"
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="client" className="text-sm font-medium">Client</Label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleAddProject} 
                        disabled={!newProjectName.trim() || !selectedClientId}
                        className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-11"
                      >
                        Create Project
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                  <Button onClick={() => setIsDialogOpen(true)}>Add Project</Button>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg border border-border bg-card hover:shadow-medium transition-all duration-200 cursor-pointer"
                    onClick={() => onProjectSelect?.(project.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.clients.name}</p>
                      </div>
                      <Badge variant="secondary" className="bg-status-active text-white">
                        Active
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">{new Date(project.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{project.status}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">Progress</span>
                          <span className="text-xs font-medium">{calculateProjectCompletion(project.id)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${calculateProjectCompletion(project.id)}%` }}
                          />
                        </div>
                      </div>
                      <Button size="sm" variant="timer" onClick={(e) => {
                        e.stopPropagation();
                        onProjectSelect?.(project.id);
                      }}>
                        <Play className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timeEntries.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                timeEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex flex-col space-y-2 pb-4 border-b border-border last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{entry.task_description}</p>
                        <p className="text-xs text-muted-foreground">{entry.projects.name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(entry.duration_seconds)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{getTimeAgo(entry.start_time)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Hours</span>
                <span className="font-semibold">{stats.totalHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Projects</span>
                <span className="font-semibold">{projects.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Clients</span>
                <span className="font-semibold">{clients.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="font-semibold text-secondary">{formatCurrency(stats.totalRevenue)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};