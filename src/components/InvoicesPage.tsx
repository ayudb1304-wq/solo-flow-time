import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Eye, DollarSign, Download, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from 'jspdf';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
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
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    client_name: "",
    total_amount: 0,
    due_date: "",
    hourly_rate: 0
  });
  const { user } = useAuth();
  const { toast } = useToast();

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
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setEditForm({
      client_name: invoice.client_name,
      total_amount: invoice.total_amount,
      due_date: invoice.due_date,
      hourly_rate: invoice.hourly_rate
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          client_name: editForm.client_name,
          total_amount: editForm.total_amount,
          due_date: editForm.due_date,
          hourly_rate: editForm.hourly_rate
        })
        .eq('id', editingInvoice.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    }
  };

  const downloadInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Add invoice content
    doc.setFontSize(20);
    doc.text('INVOICE', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 50);
    doc.text(`Client: ${invoice.client_name}`, 20, 65);
    doc.text(`Project: ${invoice.projects.name}`, 20, 80);
    doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 20, 95);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 110);
    doc.text(`Amount: $${invoice.total_amount.toFixed(2)}`, 20, 125);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 140);
    
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
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingRevenue.toFixed(2)}</div>
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
                    <TableCell>${invoice.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {invoice.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditInvoice(invoice)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
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
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
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

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client-name">Client Name</Label>
              <Input
                id="client-name"
                value={editForm.client_name}
                onChange={(e) => setEditForm({...editForm, client_name: e.target.value})}
                placeholder="Enter client name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total-amount">Total Amount</Label>
              <Input
                id="total-amount"
                type="number"
                value={editForm.total_amount}
                onChange={(e) => setEditForm({...editForm, total_amount: parseFloat(e.target.value) || 0})}
                placeholder="Enter total amount"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hourly-rate">Hourly Rate</Label>
              <Input
                id="hourly-rate"
                type="number"
                value={editForm.hourly_rate}
                onChange={(e) => setEditForm({...editForm, hourly_rate: parseFloat(e.target.value) || 0})}
                placeholder="Enter hourly rate"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={editForm.due_date}
                onChange={(e) => setEditForm({...editForm, due_date: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateInvoice}>Update Invoice</Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};