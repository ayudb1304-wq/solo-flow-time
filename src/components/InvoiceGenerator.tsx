import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Send, DollarSign, Download } from "lucide-react";
import jsPDF from 'jspdf';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Project {
  id: string;
  name: string;
  clients: {
    name: string;
    address: string;
  };
}

interface TimeEntry {
  id: string;
  task_description: string;
  start_time: string;
  duration_seconds: number;
}

interface Profile {
  freelancer_name: string;
  company_address: string;
}

interface InvoiceGeneratorProps {
  projectId: string;
  onBack: () => void;
  onClose: () => void;
}

export const InvoiceGenerator = ({ projectId, onBack, onClose }: InvoiceGeneratorProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [hourlyRate, setHourlyRate] = useState<string>("75");
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency, getCurrencySymbol } = useCurrency();

  useEffect(() => {
    if (user && projectId) {
      fetchData();
    }
  }, [user, projectId]);

  const fetchData = async () => {
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            name,
            address
          )
        `)
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('freelancer_name, company_address')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch uninvoiced time entries
      const { data: timeData, error: timeError } = await supabase
        .from('time_entries')
        .select('id, task_description, start_time, duration_seconds')
        .eq('project_id', projectId)
        .is('invoice_id', null)
        .not('end_time', 'is', null)
        .order('start_time');

      if (timeError) throw timeError;
      setTimeEntries(timeData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch invoice data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration_seconds / 3600), 0);
    return totalHours * parseFloat(hourlyRate);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const generateInvoiceNumber = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      return `${new Date().getFullYear()}-001`;
    }

    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].invoice_number.split('-')[1]) || 0;
      return `${new Date().getFullYear()}-${String(lastNumber + 1).padStart(3, '0')}`;
    }

    return `${new Date().getFullYear()}-001`;
  };

  const downloadInvoicePDF = async () => {
    try {
      const invoiceNumber = await generateInvoiceNumber();
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
      doc.text(`#${invoiceNumber}`, pageWidth / 2, 40, { align: 'center' });
      
      // Reset text color for body
      doc.setTextColor(0, 0, 0);
      
      // From and To sections
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('From:', 20, 70);
      doc.setFont(undefined, 'normal');
      if (profile?.freelancer_name) {
        doc.text(profile.freelancer_name, 20, 82);
      } else {
        doc.text('Your Company Name', 20, 82);
      }
      if (profile?.company_address) {
        const addressLines = profile.company_address.split('\n');
        addressLines.forEach((line, index) => {
          doc.text(line, 20, 94 + (index * 10));
        });
      } else {
        doc.text('Your Address', 20, 94);
      }
      
      doc.setFont(undefined, 'bold');
      doc.text('To:', 120, 70);
      doc.setFont(undefined, 'normal');
      if (project?.clients.name) {
        doc.text(project.clients.name, 120, 82);
      }
      if (project?.clients.address) {
        const addressLines = project.clients.address.split('\n');
        addressLines.forEach((line, index) => {
          doc.text(line, 120, 94 + (index * 10));
        });
      }
      
      // Project and dates section
      doc.setFont(undefined, 'bold');
      doc.text('Project:', 20, 120);
      doc.setFont(undefined, 'normal');
      doc.text(project?.name || 'N/A', 20, 132);
      
      doc.setFont(undefined, 'bold');
      doc.text('Issue Date:', 120, 120);
      doc.setFont(undefined, 'normal');
      doc.text(new Date(issueDate).toLocaleDateString(), 120, 132);
      
      doc.setFont(undefined, 'bold');
      doc.text('Due Date:', 120, 144);
      doc.setFont(undefined, 'normal');
      doc.text(new Date(dueDate).toLocaleDateString(), 120, 156);
      
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
      doc.text(`${formatCurrency(parseFloat(hourlyRate))}/hr`, 120, 205);
      doc.text(formatCurrency(totalAmount), 160, 205);
      
      // Total section with colored background
      doc.setFillColor(34, 197, 94); // Green background
      doc.rect(20, 220, pageWidth - 40, 25, 'F');
      
      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Total Amount:', 25, 235);
      doc.text(formatCurrency(totalAmount), pageWidth - 25, 235, { align: 'right' });
      
      // Status badge
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      
      // Draft status (since it's being generated)
      doc.setFillColor(156, 163, 175); // Gray
      doc.setTextColor(255, 255, 255);
      
      const statusText = 'DRAFT';
      const statusWidth = doc.getTextWidth(statusText) + 10;
      doc.rect(pageWidth - statusWidth - 20, 255, statusWidth, 15, 'F');
      doc.text(statusText, pageWidth - statusWidth/2 - 20, 265, { align: 'center' });
      
      // Footer
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 20, { align: 'center' });
      
      doc.save(`invoice-${invoiceNumber}.pdf`);
      
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleGenerateInvoice = async (status: 'draft' | 'sent') => {
    if (timeEntries.length === 0) {
      toast({
        title: "Error",
        description: "No time entries to invoice",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const invoiceNumber = await generateInvoiceNumber();
      const totalAmount = calculateTotal();

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          project_id: projectId,
          user_id: user?.id,
          client_name: project?.clients.name || '',
          client_address: project?.clients.address || '',
          invoice_number: invoiceNumber,
          issue_date: issueDate,
          due_date: dueDate,
          status: status,
          total_amount: totalAmount,
          hourly_rate: parseFloat(hourlyRate),
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Update time entries with invoice ID
      const { error: updateError } = await supabase
        .from('time_entries')
        .update({ invoice_id: invoice.id })
        .in('id', timeEntries.map(entry => entry.id));

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Invoice ${status === 'draft' ? 'saved as draft' : 'marked as sent'}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading invoice data...</div>;
  }

  if (!project || !profile) {
    return <div className="p-6">Failed to load invoice data</div>;
  }

  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration_seconds / 3600), 0);
  const totalAmount = calculateTotal();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Invoice - {project.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hourly-rate">Hourly Rate ({getCurrencySymbol()})</Label>
                <Input
                  id="hourly-rate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="issue-date">Issue Date</Label>
                <Input
                  id="issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">From:</h3>
                  <p className="text-sm">
                    {profile.freelancer_name}<br />
                    {profile.company_address}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">To:</h3>
                  <p className="text-sm">
                    {project.clients.name}<br />
                    {project.clients.address}
                  </p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p><strong>Project:</strong> {project.name}</p>
                  <p><strong>Issue Date:</strong> {new Date(issueDate).toLocaleDateString()}</p>
                  <p><strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString()}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {totalHours.toFixed(2)} hours × {getCurrencySymbol()}{hourlyRate}/hour
                  </p>
                </div>
              </div>

              {/* Time Entries Table */}
              <div>
                <h3 className="font-semibold mb-3">Time Entries:</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => {
                      const hours = entry.duration_seconds / 3600;
                      const amount = hours * parseFloat(hourlyRate);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>{new Date(entry.start_time).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.task_description}</TableCell>
                          <TableCell>{formatDuration(entry.duration_seconds)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadInvoicePDF}
                disabled={generating}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleGenerateInvoice('draft')}
                disabled={generating}
              >
                <FileText className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => handleGenerateInvoice('sent')}
                disabled={generating}
              >
                <Send className="h-4 w-4 mr-2" />
                Save & Mark as Sent
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};