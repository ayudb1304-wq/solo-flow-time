import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, Square, Trash2, Plus, Clock, CheckCircle2, FileText, ChevronDown, ChevronRight, Receipt, DollarSign, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskAttachments } from "@/components/TaskAttachments";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCurrency } from "@/hooks/useCurrency";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { InvoicePreviewEditor } from "@/components/InvoicePreviewEditor";
import jsPDF from 'jspdf';

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

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_address: string | null;
  total_amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  created_at: string;
  hourly_rate: number;
  projects: {
    name: string;
  };
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { checkLimit } = useSubscription();

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  useEffect(() => {
    if (user && projectId) {
      fetchProjectDetails();
      fetchTasks();
      fetchTimeEntries();
      fetchInvoices();
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

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          projects (
            name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Sent</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice marked as paid",
      });

      fetchInvoices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });

      fetchInvoices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    // Check if PDF export is allowed
    const limitCheck = checkLimit('canExportPDF');
    if (!limitCheck.allowed) {
      toast({
        title: "Feature Not Available",
        description: limitCheck.message,
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Add header background
    doc.setFillColor(59, 130, 246); // Blue background
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Invoice title
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(`#${invoice.invoice_number}`, pageWidth / 2, 40, { align: 'center' });
    
    // Reset text color for body
    doc.setTextColor(0, 0, 0);
    
    // From and To sections
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('From:', 20, 70);
    doc.setFont(undefined, 'normal');
    doc.text('Your Company Name', 20, 82);
    doc.text('Your Address', 20, 94);
    
    doc.setFont(undefined, 'bold');
    doc.text('To:', 120, 70);
    doc.setFont(undefined, 'normal');
    doc.text(project?.clients.name || 'Client', 120, 82);
    
    // Project and dates section
    doc.setFont(undefined, 'bold');
    doc.text('Project:', 20, 120);
    doc.setFont(undefined, 'normal');
    doc.text(project?.name || 'N/A', 20, 132);
    
    doc.setFont(undefined, 'bold');
    doc.text('Issue Date:', 120, 120);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(invoice.issue_date).toLocaleDateString(), 120, 132);
    
    doc.setFont(undefined, 'bold');
    doc.text('Due Date:', 120, 144);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(invoice.due_date).toLocaleDateString(), 120, 156);
    
    // Add a line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 170, pageWidth - 20, 170);
    
    // Services/billing section
    doc.setFillColor(248, 250, 252); // Light gray background
    doc.rect(20, 180, pageWidth - 40, 30, 'F');
    
    doc.setFont(undefined, 'bold');
    doc.text('Description', 25, 195);
    doc.text('Rate', 120, 195);
    doc.text('Amount', 160, 195);
    
    doc.setFont(undefined, 'normal');
    doc.text('Professional Services', 25, 205);
    doc.text(`${formatCurrency(invoice.hourly_rate || 0)}/hr`, 120, 205);
    doc.text(formatCurrency(invoice.total_amount), 160, 205);
    
    // Total section with colored background
    doc.setFillColor(34, 197, 94); // Green background
    doc.rect(20, 220, pageWidth - 40, 25, 'F');
    
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Total Amount:', 25, 235);
    doc.text(formatCurrency(invoice.total_amount), pageWidth - 25, 235, { align: 'right' });
    
    // Status badge
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    
    // Different colors for different statuses
    if (invoice.status === 'paid') {
      doc.setFillColor(34, 197, 94); // Green
      doc.setTextColor(255, 255, 255);
    } else if (invoice.status === 'sent') {
      doc.setFillColor(251, 191, 36); // Yellow
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setFillColor(156, 163, 175); // Gray
      doc.setTextColor(255, 255, 255);
    }
    
    const statusText = invoice.status.toUpperCase();
    const statusWidth = doc.getTextWidth(statusText) + 10;
    doc.rect(pageWidth - statusWidth - 20, 255, statusWidth, 15, 'F');
    doc.text(statusText, pageWidth - statusWidth/2 - 20, 265, { align: 'center' });
    
    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    // Save the PDF
    doc.save(`invoice-${invoice.invoice_number}.pdf`);
    
    toast({
      title: "Success",
      description: "Invoice PDF downloaded successfully",
    });
  };

  const unInvoicedEntries = timeEntries.filter(entry => !entry.invoice_id && entry.end_time);

  if (loading) {
    return <div className="p-6">Loading project details...</div>;
  }

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <Button variant="ghost" onClick={onBack} className="self-start">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm md:text-base text-muted-foreground">Client: {project.clients.name}</p>
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
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              className="flex-1"
            />
            <Button onClick={handleAddTask} disabled={!newTaskDescription.trim()} className="sm:w-auto">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <Collapsible key={task.id}>
                <div className="flex items-center gap-2 sm:gap-3 p-3 bg-muted/50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={() => handleToggleTask(task.id, task.status)}
                    className="w-4 h-4 flex-shrink-0"
                  />
                  <span className={`flex-1 text-sm sm:text-base ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.description}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <CollapsibleTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleTaskExpansion(task.id)}
                        className="text-muted-foreground p-1 sm:p-2"
                      >
                        {expandedTasks.has(task.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    {task.status === 'todo' && (
                      <Button
                        size="sm"
                        variant={activeTimer === task.id ? "destructive" : "outline"}
                        onClick={() => activeTimer === task.id ? handleStopTimer() : handleStartTimer(task.id, task.description)}
                        className="hidden sm:flex"
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
                    {task.status === 'todo' && (
                      <Button
                        size="sm"
                        variant={activeTimer === task.id ? "destructive" : "outline"}
                        onClick={() => activeTimer === task.id ? handleStopTimer() : handleStartTimer(task.id, task.description)}
                        className="sm:hidden p-1"
                      >
                        {activeTimer === task.id ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-muted-foreground hover:text-destructive p-1 sm:p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="ml-7 mr-3 mb-3 p-3 bg-background border rounded-lg">
                    <TaskAttachments taskId={task.id} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Entries Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Entries
          </CardTitle>
          {unInvoicedEntries.length > 0 && (
            <Button onClick={() => onGenerateInvoice(projectId)} className="flex items-center gap-2 w-full sm:w-auto">
              <FileText className="h-4 w-4" />
              Generate Invoice
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {timeEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 px-4">No time entries yet. Start a timer to begin tracking.</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
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
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {timeEntries.map((entry) => (
                  <Card key={entry.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-medium truncate flex-1">{entry.task_description}</p>
                        <div className="flex-shrink-0">
                          {entry.invoice_id ? (
                            <Badge variant="secondary" className="text-xs">Invoiced</Badge>
                          ) : entry.end_time ? (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          ) : (
                            <Badge className="text-xs">Active</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{new Date(entry.start_time).toLocaleDateString()}</span>
                        <span>
                          {entry.end_time ? (
                            formatDuration(entry.duration_seconds)
                          ) : (
                            <span className="text-primary font-medium">Running...</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoices Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoices ({invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 px-4">No invoices created yet.</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(invoice.total_amount)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {invoice.status === 'draft' ? 'Edit' : 'View'}
                            </Button>
                            {invoice.status === 'sent' && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsPaid(invoice.id)}
                              >
                                Mark Paid
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadInvoicePDF(invoice)}
                              disabled={!checkLimit('canExportPDF').allowed}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-sm">#{invoice.invoice_number}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                          </div>
                        </div>
                        {getStatusBadge(invoice.status)}
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Issue Date:</span>
                          <span>{new Date(invoice.issue_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Due Date:</span>
                          <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditInvoice(invoice)}
                          className="flex-1 min-w-0"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {invoice.status === 'draft' ? 'Edit' : 'View'}
                        </Button>
                        {invoice.status === 'sent' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            className="flex-1 min-w-0"
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadInvoicePDF(invoice)}
                          disabled={!checkLimit('canExportPDF').allowed}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Editor */}
      {selectedInvoice && (
        <InvoicePreviewEditor
          invoice={selectedInvoice}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedInvoice(null);
          }}
          onUpdate={fetchInvoices}
        />
      )}
    </div>
  );
};