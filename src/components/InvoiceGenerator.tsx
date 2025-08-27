import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Send, DollarSign, Download } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceTemplate } from "./InvoiceTemplate";

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
  logo_url: string | null;
  brand_color: string | null;
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);
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
        .select('freelancer_name, company_address, logo_url, brand_color')
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

      console.log('Time entries query result:', { timeData, timeError, projectId });

      if (timeError) throw timeError;
      setTimeEntries(timeData || []);

      // Generate initial invoice number
      const invoiceNum = await generateInvoiceNumber();
      setInvoiceNumber(invoiceNum);
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
    if (!previewRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Capture the invoice template as a canvas
      const canvas = await html2canvas(previewRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: previewRef.current.scrollWidth,
        height: previewRef.current.scrollHeight,
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // If the content is longer than one page, we might need multiple pages
      if (imgHeight > pageHeight) {
        let heightLeft = imgHeight - pageHeight;
        let position = -pageHeight;
        
        while (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          position -= pageHeight;
        }
      }
      
      pdf.save(`invoice-${invoiceNumber}.pdf`);
      
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 }; // Default blue
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
              <CardTitle>Professional Invoice Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="w-full overflow-x-auto">
                 <InvoiceTemplate
                   ref={previewRef}
                   invoice={{
                     invoice_number: invoiceNumber,
                     client_name: project.clients.name,
                     client_address: project.clients.address,
                     issue_date: issueDate,
                     due_date: dueDate,
                     status: 'draft',
                     total_amount: totalAmount,
                     hourly_rate: parseFloat(hourlyRate),
                     projects: {
                       name: project.name
                     }
                   }}
                 />
              </div>

              {/* Time Entries Table */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Time Entries Breakdown:</h3>
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
                disabled={generating || isGeneratingPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
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