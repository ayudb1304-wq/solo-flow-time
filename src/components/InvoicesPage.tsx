import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Eye, DollarSign, Download, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { useSubscription } from "@/hooks/useSubscription";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoicePreviewEditor } from "@/components/InvoicePreviewEditor";
import jsPDF from 'jspdf';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_address: string | null;
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  hourly_rate: number;
  projects: {
    name: string;
  };
}

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { checkLimit } = useSubscription();

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    setMarkingPaid(invoiceId);
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
        description: "Failed to update invoice",
        variant: "destructive",
      });
    } finally {
      setMarkingPaid(null);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
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

  const downloadInvoicePDF = (invoice: Invoice) => {
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
    doc.text(invoice.client_name, 120, 82);
    if (invoice.client_address) {
      doc.text(invoice.client_address, 120, 94);
    }
    
    // Project and dates section
    doc.setFont(undefined, 'bold');
    doc.text('Project:', 20, 120);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.projects.name, 20, 132);
    
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
    doc.text(`${formatCurrency(invoice.hourly_rate)}/hr`, 120, 205);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'sent':
        return <Badge variant="outline">Sent</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalRevenue = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.total_amount, 0);

  const pendingRevenue = invoices
    .filter(invoice => invoice.status === 'sent')
    .reduce((sum, invoice) => sum + invoice.total_amount, 0);

  if (loading) {
    return <div className="p-6">Loading invoices...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices and track payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingRevenue)}</div>
            <p className="text-xs text-muted-foreground">From sent invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
              <p className="text-muted-foreground">Start tracking time and generate your first invoice</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.client_name}</TableCell>
                    <TableCell>{invoice.projects.name}</TableCell>
                    <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
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
                            disabled={markingPaid === invoice.id}
                          >
                            {markingPaid === invoice.id ? "Marking..." : "Mark Paid"}
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