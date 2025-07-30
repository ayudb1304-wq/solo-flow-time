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
    
    // Add invoice content
    doc.setFontSize(20);
    doc.text('INVOICE', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 50);
    doc.text(`Client: ${invoice.client_name}`, 20, 65);
    if (invoice.client_address) {
      doc.text(`Address: ${invoice.client_address}`, 20, 80);
    }
    doc.text(`Project: ${invoice.projects.name}`, 20, 95);
    doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 20, 110);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 125);
    doc.text(`Hourly Rate: $${invoice.hourly_rate.toFixed(2)}`, 20, 140);
    doc.text(`Total Amount: $${invoice.total_amount.toFixed(2)}`, 20, 155);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 170);
    
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
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
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
                    <span>${(isEditing ? editForm.hourly_rate : invoice.hourly_rate).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                    <span>Total Amount:</span>
                    <span>${(isEditing ? editForm.total_amount : invoice.total_amount).toFixed(2)}</span>
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