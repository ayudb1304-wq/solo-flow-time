import { forwardRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCurrency } from "@/hooks/useCurrency";
import "../styles/invoice.css";

interface InvoiceData {
  id?: string;
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

interface Profile {
  freelancer_name: string | null;
  company_address: string | null;
  logo_url: string | null;
  brand_color: string | null;
}

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  editable?: boolean;
  onEdit?: (field: string, value: string) => void;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, editable = false, onEdit }, ref) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const { user } = useAuth();
    const { formatCurrency } = useCurrency();

    useEffect(() => {
      if (user) {
        fetchProfile();
      }
    }, [user]);

    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('freelancer_name, company_address, logo_url, brand_color')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    const handleContentEdit = (field: string) => (e: React.FocusEvent<HTMLElement>) => {
      if (onEdit && editable) {
        const value = e.currentTarget.textContent || '';
        onEdit(field, value);
      }
    };

    const brandColor = profile?.brand_color || '#3b82f6';

    return (
      <div 
        ref={ref} 
        className="invoice-template"
        style={{
          '--primary': `${hexToHsl(brandColor)}`,
          '--primary-hover': `${hexToHsl(brandColor, -5)}`
        } as React.CSSProperties}
      >
        {/* Status Badge */}
        <div className={`invoice-status status-${invoice.status}`}>
          {invoice.status.toUpperCase()}
        </div>

        {/* Header */}
        <div className="invoice-header">
          <div className="invoice-header-content">
            <div>
              {profile?.logo_url && (
                <img 
                  src={profile.logo_url} 
                  alt="Company Logo" 
                  className="invoice-logo"
                />
              )}
            </div>
            <div className="invoice-title-section">
              <h1 className="invoice-title">INVOICE</h1>
              <p className="invoice-number">#{invoice.invoice_number}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="invoice-body">
          {/* Parties */}
          <div className="invoice-parties">
            <div className="party-section">
              <h3>From</h3>
              <div className="party-details">
                <div 
                  className="name"
                  contentEditable={editable}
                  onBlur={handleContentEdit('freelancer_name')}
                  suppressContentEditableWarning={true}
                >
                  {profile?.freelancer_name || 'Your Company Name'}
                </div>
                <div 
                  className="address"
                  contentEditable={editable}
                  onBlur={handleContentEdit('company_address')}
                  suppressContentEditableWarning={true}
                >
                  {profile?.company_address || 'Your Company Address'}
                </div>
              </div>
            </div>
            <div className="party-section">
              <h3>Billed To</h3>
              <div className="party-details">
                <div 
                  className="name"
                  contentEditable={editable}
                  onBlur={handleContentEdit('client_name')}
                  suppressContentEditableWarning={true}
                >
                  {invoice.client_name}
                </div>
                <div 
                  className="address"
                  contentEditable={editable}
                  onBlur={handleContentEdit('client_address')}
                  suppressContentEditableWarning={true}
                >
                  {invoice.client_address || 'Client Address'}
                </div>
              </div>
            </div>
          </div>

          {/* Meta Information */}
          <div className="invoice-meta">
            <div className="meta-item">
              <span className="meta-label">Project</span>
              <span className="meta-value">{invoice.projects.name}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Issue Date</span>
              <span className="meta-value">{new Date(invoice.issue_date).toLocaleDateString()}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Due Date</span>
              <span 
                className="meta-value"
                contentEditable={editable}
                onBlur={handleContentEdit('due_date')}
                suppressContentEditableWarning={true}
              >
                {new Date(invoice.due_date).toLocaleDateString()}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Status</span>
              <span className="meta-value">{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
            </div>
          </div>

          {/* Services Table */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Hours</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Professional Services</td>
                <td className="text-right amount-cell">{formatCurrency(invoice.hourly_rate)}/hour</td>
                <td className="text-right amount-cell">
                  {(invoice.total_amount / invoice.hourly_rate).toFixed(2)}
                </td>
                <td className="text-right amount-cell">{formatCurrency(invoice.total_amount)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="invoice-totals">
            <div className="totals-section">
              <div className="total-row">
                <span className="total-label">Subtotal</span>
                <span className="total-amount">{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="total-row">
                <span className="total-label">Total Amount Due</span>
                <span className="total-amount">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="invoice-notes">
            <h4>Payment Terms</h4>
            <p 
              contentEditable={editable}
              onBlur={handleContentEdit('notes')}
              suppressContentEditableWarning={true}
            >
              Payment is due within 30 days of invoice date. Thank you for your business!
            </p>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = "InvoiceTemplate";

// Helper function to convert hex to HSL
function hexToHsl(hex: string, lightnessAdjust: number = 0): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '217 91% 60%'; // fallback to default blue
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round((l * 100) + lightnessAdjust);
  
  return `${h} ${s}% ${Math.max(0, Math.min(100, l))}%`;
}