import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export type SubscriptionPlan = 'trial' | 'pro';

interface SubscriptionLimits {
  maxClients: number;
  maxProjects: number;
  maxInvoicesPerMonth: number;
  canExportPDF: boolean;
  hasAdvancedFeatures: boolean;
}

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  limits: SubscriptionLimits;
  loading: boolean;
  checkLimit: (feature: keyof SubscriptionLimits, currentCount?: number) => { allowed: boolean; message?: string };
  refreshSubscription: () => Promise<void>;
}

const PLAN_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  trial: {
    maxClients: 3,
    maxProjects: 5,
    maxInvoicesPerMonth: 10,
    canExportPDF: false,
    hasAdvancedFeatures: false,
  },
  pro: {
    maxClients: -1, // unlimited
    maxProjects: -1, // unlimited
    maxInvoicesPerMonth: -1, // unlimited
    canExportPDF: true,
    hasAdvancedFeatures: true,
  },
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const [plan, setPlan] = useState<SubscriptionPlan>('trial');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
      
      // Set up real-time subscription for subscription changes
      const subscription = supabase
        .channel('subscription-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Subscription updated:', payload);
            if (payload.new && typeof payload.new === 'object' && 'subscription_status' in payload.new) {
              const newStatus = (payload.new as any).subscription_status;
              const oldStatus = plan;
              
              setPlan(newStatus);
              
              // Show success message when upgrading to pro
              if (oldStatus === 'trial' && newStatus === 'pro') {
                toast({
                  title: "🎉 Payment Successful!",
                  description: "Welcome to Pro! All premium features are now unlocked.",
                });
              }
              
              // Show message when downgrading
              if (oldStatus === 'pro' && newStatus === 'trial') {
                toast({
                  title: "Subscription Updated",
                  description: "Your subscription has been changed to trial.",
                });
              }
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    } else {
      setPlan('trial');
      setLoading(false);
    }
  }, [user, plan, toast]);

  const fetchSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('subscription_status, subscription_period_end, subscription_cancel_at_period_end')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no subscription record exists, create one with trial status
      if (!data) {
        await supabase
          .from('user_subscriptions')
          .insert({ 
            user_id: user?.id,
            subscription_status: 'trial'
          });
        setPlan('trial');
        return;
      }
      
      // Check if subscription has expired and should revert to trial
      const currentStatus = data.subscription_status as SubscriptionPlan || 'trial';
      const periodEnd = data.subscription_period_end;
      const cancelAtPeriodEnd = data.subscription_cancel_at_period_end;
      
      // If subscription was cancelled and period has ended, revert to trial
      if (cancelAtPeriodEnd && periodEnd && new Date(periodEnd) <= new Date() && currentStatus !== 'trial') {
        await supabase
          .from('user_subscriptions')
          .update({ 
            subscription_status: 'trial',
            subscription_cancel_at_period_end: false,
            subscription_period_end: null
          })
          .eq('user_id', user?.id);
        
        setPlan('trial');
      } else {
        setPlan(currentStatus);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setPlan('trial');
    } finally {
      setLoading(false);
    }
  };

  const limits = PLAN_LIMITS[plan];

  const checkLimit = (feature: keyof SubscriptionLimits, currentCount?: number) => {
    const limit = limits[feature];
    
    if (typeof limit === 'boolean') {
      return {
        allowed: limit,
        message: !limit ? `This feature is only available on Pro plan` : undefined,
      };
    }
    
    if (typeof limit === 'number') {
      if (limit === -1) return { allowed: true }; // unlimited
      
      if (currentCount !== undefined) {
        const allowed = currentCount < limit;
        return {
          allowed,
          message: !allowed ? `You've reached the limit of ${limit} for your ${plan} plan` : undefined,
        };
      }
    }
    
    return { allowed: true };
  };

  const refreshSubscription = async () => {
    if (user) {
      await fetchSubscriptionStatus();
    }
  };

  return (
    <SubscriptionContext.Provider value={{ plan, limits, loading, checkLimit, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};