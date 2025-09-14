import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export const NotificationSystem = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listen for subscription status changes
    const subscription = supabase
      .channel('subscription-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;

          // Subscription activated
          if (oldRecord?.status !== 'active' && newRecord?.status === 'active') {
            toast({
              title: "🎉 Subscription Activated!",
              description: "Welcome to Pro! All premium features are now unlocked.",
              duration: 6000,
            });
          }

          // Subscription cancelled
          if (oldRecord?.status === 'active' && newRecord?.status === 'pending_cancellation') {
            toast({
              title: "Subscription Cancellation Scheduled",
              description: `Your Pro features will remain active until ${newRecord.period_end ? new Date(newRecord.period_end).toLocaleDateString() : 'the end of your billing period'}.`,
              duration: 8000,
            });
          }

          // Subscription reactivated  
          if (oldRecord?.cancel_at_period_end && !newRecord?.cancel_at_period_end && newRecord?.status === 'active') {
            toast({
              title: "🔄 Subscription Reactivated",
              description: "Your Pro subscription has been reactivated successfully!",
              duration: 5000,
            });
          }

          // Subscription expired/cancelled
          if ((oldRecord?.status === 'active' || oldRecord?.status === 'pending_cancellation') && newRecord?.status === 'cancelled') {
            toast({
              title: "Subscription Ended",
              description: "Your account has been moved to the trial plan. You can upgrade again anytime.",
              duration: 6000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, toast]);

  // This component doesn't render anything, it just handles notifications
  return null;
};