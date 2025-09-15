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
  Star,
  Calendar,
  CalendarIcon
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  due_date: string | null;
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
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { checkLimit } = useSubscription();
  const isMobile = useIsMobile();
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
          due_date: selectedDueDate?.toISOString().split('T')[0] || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      setNewProjectName("");
      setSelectedClientId("");
      setSelectedDueDate(undefined);
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
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="space-y-6 md:space-y-8 p-4 md:p-6">
        {/* Welcome Header */}
        <div className="text-center space-y-2 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Welcome Back!
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg">
            Here's what's happening with your freelance business today
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="relative overflow-hidden group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card to-primary/5 border-border shadow-soft">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-1 md:space-y-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-2xl md:text-3xl font-bold text-card-foreground">{stats.totalHours.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">All time tracked</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 bg-primary/10 rounded-xl flex items-center justify-center shadow-soft">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card to-status-active/5 border-border shadow-soft">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-1 md:space-y-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl md:text-3xl font-bold text-card-foreground">{projects.length}</p>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 bg-status-active/10 rounded-xl flex items-center justify-center shadow-soft">
                  <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-status-active" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card to-accent/5 border-border shadow-soft">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-1 md:space-y-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="text-2xl md:text-3xl font-bold text-card-foreground">{clients.length}</p>
                  <p className="text-xs text-muted-foreground">All clients</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 bg-accent/10 rounded-xl flex items-center justify-center shadow-soft">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card to-status-pending/5 border-border shadow-soft">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-1 md:space-y-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Pending Revenue</p>
                  <p className="text-2xl md:text-3xl font-bold text-card-foreground">{formatCurrency(stats.pendingInvoices)}</p>
                  <p className="text-xs text-muted-foreground">From sent invoices</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 bg-status-pending/10 rounded-xl flex items-center justify-center shadow-soft">
                  <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-status-pending" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Active Projects */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm bg-card/80">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                    <div className="p-1.5 md:p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                      <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                    Active Projects
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs md:text-sm">
                      {projects.length}
                    </Badge>
                  </CardTitle>
                  {!isMobile && (
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
                          <div className="grid gap-3">
                            <Label className="text-sm font-medium">Due Date (Optional)</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "h-11 justify-start text-left font-normal",
                                    !selectedDueDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-3 h-4 w-4" />
                                  {selectedDueDate ? format(selectedDueDate, "PPP") : <span>Pick a due date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={selectedDueDate}
                                  onSelect={setSelectedDueDate}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
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
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {projects.length === 0 ? (
                  <div className="text-center py-6 md:py-8">
                    <Briefcase className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                    <h3 className="text-base md:text-lg font-semibold mb-2">No projects yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Create your first project to get started</p>
                    <Button onClick={() => setIsDialogOpen(true)} size={isMobile ? "sm" : "default"}>Add Project</Button>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-3 md:p-4 rounded-lg border border-border bg-card hover:shadow-medium transition-all duration-200 cursor-pointer"
                      onClick={() => onProjectSelect?.(project.id)}
                    >
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">{project.name}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">{project.clients.name}</p>
                        </div>
                        <Badge variant="secondary" className="bg-status-active text-white text-xs">
                          Active
                        </Badge>
                      </div>
                      
                      <div className={cn(
                        "grid gap-3 md:gap-4 text-xs md:text-sm",
                        isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                      )}>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium">{new Date(project.created_at).toLocaleDateString()}</p>
                        </div>
                        {project.due_date ? (
                          <div>
                            <p className="text-muted-foreground">Due Date</p>
                            <p className="font-medium">{new Date(project.due_date).toLocaleDateString()}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-medium capitalize">{project.status}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 md:mt-4">
                        <div className="flex-1 mr-3 md:mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">Progress</span>
                            <span className="text-xs font-medium">{calculateProjectCompletion(project.id)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 md:h-2">
                            <div 
                              className="bg-primary h-1.5 md:h-2 rounded-full transition-all duration-300"
                              style={{ width: `${calculateProjectCompletion(project.id)}%` }}
                            />
                          </div>
                        </div>
                        <Button size={isMobile ? "sm" : "sm"} variant="timer" onClick={(e) => {
                          e.stopPropagation();
                          onProjectSelect?.(project.id);
                        }}>
                          <Play className="h-3 w-3 mr-1" />
                          {isMobile ? "View" : "View"}
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
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Timer className="h-4 w-4 md:h-5 md:w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {timeEntries.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs md:text-sm text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  timeEntries.slice(0, isMobile ? 3 : 5).map((entry) => (
                    <div key={entry.id} className="flex flex-col space-y-1.5 md:space-y-2 pb-3 md:pb-4 border-b border-border last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <p className="text-xs md:text-sm font-medium text-foreground line-clamp-2">{entry.task_description}</p>
                          <p className="text-xs text-muted-foreground">{entry.projects.name}</p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {formatDuration(entry.duration_seconds)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{getTimeAgo(entry.start_time)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className={cn(isMobile ? "lg:hidden" : "")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-muted-foreground">Total Hours</span>
                  <span className="font-semibold text-sm md:text-base">{stats.totalHours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-muted-foreground">Active Projects</span>
                  <span className="font-semibold text-sm md:text-base">{projects.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-muted-foreground">Total Clients</span>
                  <span className="font-semibold text-sm md:text-base">{clients.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-muted-foreground">Total Revenue</span>
                  <span className="font-semibold text-secondary text-sm md:text-base">{formatCurrency(stats.totalRevenue)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      {isMobile && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-2xl border-0 z-50"
              disabled={!checkLimit('maxProjects', projects.length).allowed}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Add New Project
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-3">
                <Label htmlFor="mobile-project-name" className="text-sm font-medium">Project Name</Label>
                <Input
                  id="mobile-project-name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="h-11"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="mobile-client" className="text-sm font-medium">Client</Label>
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
              <div className="grid gap-3">
                <Label className="text-sm font-medium">Due Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-11 justify-start text-left font-normal",
                        !selectedDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4" />
                      {selectedDueDate ? format(selectedDueDate, "PPP") : <span>Pick a due date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDueDate}
                      onSelect={setSelectedDueDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
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
      )}
    </div>
  );
};