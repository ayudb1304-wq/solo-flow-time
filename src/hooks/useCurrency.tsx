import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface CurrencySymbols {
  [key: string]: string;
}

export const CURRENCY_SYMBOLS: CurrencySymbols = {
  USD: "$",
  EUR: "€", 
  GBP: "£",
  INR: "₹",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥"
};

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "JPY", label: "Japanese Yen (¥)" }
];

export const useCurrency = () => {
  const [currency, setCurrency] = useState<string>("USD");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCurrency();
    }
  }, [user]);

  const fetchCurrency = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('currency')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setCurrency(data?.currency || "USD");
    } catch (error) {
      console.error('Error fetching currency:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrency = async (newCurrency: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ currency: newCurrency })
        .eq('user_id', user?.id);

      if (error) throw error;
      setCurrency(newCurrency);
      return true;
    } catch (error) {
      console.error('Error updating currency:', error);
      return false;
    }
  };

  const formatCurrency = (amount: number) => {
    const symbol = CURRENCY_SYMBOLS[currency] || "$";
    return `${symbol}${amount.toFixed(2)}`;
  };

  const getCurrencySymbol = () => {
    return CURRENCY_SYMBOLS[currency] || "$";
  };

  return {
    currency,
    loading,
    updateCurrency,
    formatCurrency,
    getCurrencySymbol
  };
};