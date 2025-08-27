import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Edit, Send, X, Download, CalendarIcon, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { InvoiceTemplate } from "./InvoiceTemplate";
import html2canvas from 'html2canvas';
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
  const [previewMode, setPreviewMode] = useState(true);
  const [editForm, setEditForm] = useState({
    client_name: "",
    client_address: "",
    total_amount: 0,
    hourly_rate: 0,
    due_date: ""
  });
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
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

  const downloadInvoicePDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Capture the invoice template as a canvas
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: invoiceRef.current.scrollWidth,
        height: invoiceRef.current.scrollHeight,
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
      
      // Save the PDF
      pdf.save(`invoice-${invoice.invoice_number}.pdf`);
      
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice Preview & Editor</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
              {invoice.status === 'draft' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {isEditing ? 'Cancel Edit' : 'Form Edit'}
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
                disabled={isGeneratingPDF}
              >
                <Download className="h-4 w-4 mr-1" />
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
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
                <CardTitle>Professional Invoice Preview</CardTitle>
                <Badge variant={invoice.status === 'draft' ? 'secondary' : invoice.status === 'sent' ? 'outline' : 'default'}>
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="w-full overflow-x-auto">
                <InvoiceTemplate
                  ref={invoiceRef}
                  invoice={{
                    ...invoice,
                    client_name: isEditing ? editForm.client_name : invoice.client_name,
                    client_address: isEditing ? editForm.client_address : invoice.client_address,
                    total_amount: isEditing ? editForm.total_amount : invoice.total_amount,
                    hourly_rate: isEditing ? editForm.hourly_rate : invoice.hourly_rate,
                    due_date: isEditing ? editForm.due_date : invoice.due_date,
                  }}
                  editable={!previewMode && !isEditing}
                  onEdit={(field, value) => {
                    setEditForm(prev => ({
                      ...prev,
                      [field]: field === 'total_amount' || field === 'hourly_rate' 
                        ? parseFloat(value) || 0 
                        : value
                    }));
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};