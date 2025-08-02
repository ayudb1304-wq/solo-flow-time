import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Edit, Send, X, Download, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
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

interface InvoicePreviewEditorProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const InvoicePreviewEditor = ({ invoice, isOpen, onClose, onUpdate }: InvoicePreviewEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    client_name: "",
    client_address: "",
    total_amount: 0,
    hourly_rate: 0,
    due_date: ""
  });
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const { toast } = useToast();
  const { formatCurrency, getCurrencySymbol } = useCurrency();

  useEffect(() => {
    if (invoice) {
      setEditForm({
        client_name: invoice.client_name,
        client_address: invoice.client_address || "",
        total_amount: invoice.total_amount,
        hourly_rate: invoice.hourly_rate,
        due_date: invoice.due_date
      });
    }
  }, [invoice]);

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          client_name: editForm.client_name,
          client_address: editForm.client_address,
          total_amount: editForm.total_amount,
          hourly_rate: editForm.hourly_rate,
          due_date: editForm.due_date
        })
        .eq('id', invoice.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsSent = async () => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice marked as sent",
      });

      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    }
  };

  const downloadInvoicePDF = () => {
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
    doc.text(`${getCurrencySymbol()}${invoice.hourly_rate.toFixed(2)}/hr`, 120, 205);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice Preview & Editor</DialogTitle>
            <div className="flex items-center gap-2">
              {invoice.status === 'draft' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {isEditing ? 'Cancel Edit' : 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleMarkAsSent}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Mark as Sent
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={downloadInvoicePDF}
              >
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Edit Form */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="client-address">Client Address</Label>
                  <Input
                    id="client-address"
                    value={editForm.client_address}
                    onChange={(e) => setEditForm({...editForm, client_address: e.target.value})}
                    placeholder="Enter client address"
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
                  <Label>Due Date</Label>
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !editForm.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editForm.due_date ? format(new Date(editForm.due_date), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={editForm.due_date ? new Date(editForm.due_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setEditForm({...editForm, due_date: format(date, "yyyy-MM-dd")});
                            setDueDateOpen(false);
                          }
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <Button onClick={handleUpdate} className="w-full">
                  Update Invoice
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Invoice Preview */}
          <Card className={isEditing ? "" : "lg:col-span-2"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice Preview</CardTitle>
                <Badge variant={invoice.status === 'draft' ? 'secondary' : invoice.status === 'sent' ? 'outline' : 'default'}>
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 p-6 bg-white text-black rounded-lg border">
                <div className="text-center">
                  <h1 className="text-3xl font-bold">INVOICE</h1>
                  <p className="text-lg">#{invoice.invoice_number}</p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-2">From:</h3>
                    <p className="text-sm">Your Company Name</p>
                    <p className="text-sm">Your Address</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">To:</h3>
                    <p className="text-sm font-medium">{isEditing ? editForm.client_name : invoice.client_name}</p>
                    {(isEditing ? editForm.client_address : invoice.client_address) && (
                      <p className="text-sm">{isEditing ? editForm.client_address : invoice.client_address}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-2">Project:</h3>
                    <p className="text-sm">{invoice.projects.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm"><strong>Issue Date:</strong> {new Date(invoice.issue_date).toLocaleDateString()}</p>
                    <p className="text-sm"><strong>Due Date:</strong> {new Date(isEditing ? editForm.due_date : invoice.due_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span>Hourly Rate:</span>
                    <span>{getCurrencySymbol()}{(isEditing ? editForm.hourly_rate : invoice.hourly_rate).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(isEditing ? editForm.total_amount : invoice.total_amount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};