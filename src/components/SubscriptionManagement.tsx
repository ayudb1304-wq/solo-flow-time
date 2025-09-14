import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { CancellationModal } from './CancellationModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  status: 'trial' | 'active' | 'pending_cancellation' | 'cancelled' | 'past_due';
  cancel_at_period_end: boolean;
  period_end: string | null;
  razorpay_subscription_id?: string;
}

interface SubscriptionManagementProps {
  subscription: SubscriptionData | null;
  onRefresh: () => void;
  onUpgrade: () => void;
  upgrading?: boolean;
}

export const SubscriptionManagement = ({
  subscription,
  onRefresh,
  onUpgrade,
  upgrading = false
}: SubscriptionManagementProps) => {
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleCancelSubscription = async (reason: string, feedback?: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('cancel-razorpay-subscription', {
        body: { 
          cancellation_reason: reason,
          feedback: feedback 
        }
      });

      if (error) throw error;

      toast({
        title: "Subscription Scheduled for Cancellation",
        description: "You'll continue to have access until the end of your billing period.",
      });

      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('reactivate-subscription');

      if (error) throw error;

      toast({
        title: "Subscription Reactivated",
        description: "Your Pro subscription has been reactivated successfully.",
      });

      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPlanIcon = (status: string) => {
    switch (status) {
      case 'active': return <Zap className="h-5 w-5 text-blue-500" />;
      case 'pending_cancellation': return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default: return <Crown className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPlanBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (status === 'active' && !cancelAtPeriodEnd) {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
    if (status === 'active' && cancelAtPeriodEnd) {
      return <Badge variant="destructive">Cancelling</Badge>;
    }
    if (status === 'pending_cancellation') {
      return <Badge variant="destructive">Pending Cancellation</Badge>;
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const currentStatus = subscription?.status || 'trial';
  const isProActive = currentStatus === 'active' && !subscription?.cancel_at_period_end;
  const isPendingCancellation = currentStatus === 'active' && subscription?.cancel_at_period_end;
  const isTrialOrCancelled = currentStatus === 'trial' || currentStatus === 'cancelled';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription & Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {getPlanIcon(currentStatus)}
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {currentStatus === 'active' ? 'Pro Plan' : 'Trial Plan'}
                  {isPendingCancellation && (
                    <span className="text-orange-600 font-normal text-sm">(Cancelling)</span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isProActive && 'Unlimited clients & projects'}
                  {isPendingCancellation && subscription?.period_end && (
                    <span className="text-orange-600">
                      Active until {formatDate(subscription.period_end)}
                    </span>
                  )}
                  {isTrialOrCancelled && 'Limited features - Upgrade for full access'}
                </p>
              </div>
            </div>
            {getPlanBadge(currentStatus, subscription?.cancel_at_period_end || false)}
          </div>

          {/* Next Billing Date */}
          {subscription?.period_end && (currentStatus === 'active') && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {isPendingCancellation ? 'Access ends on' : 'Next billing date:'} {formatDate(subscription.period_end)}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {isProActive && (
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Pro features active</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancellationModal(true)}
                  disabled={processing}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Cancel Subscription
                </Button>
              </div>
            )}

            {isPendingCancellation && (
              <div className="space-y-3">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-800">Subscription Cancellation Scheduled</h4>
                      <p className="text-orange-700 text-sm mt-1">
                        Your subscription will remain active until <strong>{formatDate(subscription?.period_end || '')}</strong>. 
                        After this date, your account will be moved to the trial plan.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleReactivateSubscription}
                  disabled={processing}
                  className="w-full"
                >
                  {processing ? 'Processing...' : 'Reactivate Subscription'}
                </Button>
              </div>
            )}

            {(isTrialOrCancelled || isPendingCancellation) && (
              <div className="space-y-4">
                {isPendingCancellation && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm font-medium">
                      💡 Reactivate your subscription to continue enjoying premium features beyond your current period.
                    </p>
                  </div>
                )}
                
                {/* Pro Plan Upgrade Card */}
                <Card className="border-2 border-blue-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Zap className="h-5 w-5" />
                      Pro Plan
                    </CardTitle>
                    <div className="text-2xl font-bold">
                      ₹799<span className="text-sm font-normal text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Unlimited clients & projects
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Advanced invoicing & PDF export
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Detailed reports & analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Priority support
                      </li>
                    </ul>
                    <Button
                      onClick={onUpgrade}
                      disabled={upgrading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {upgrading ? 'Processing...' : 
                       isPendingCancellation ? 'Reactivate Pro Plan' : 'Upgrade to Pro'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CancellationModal
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        onConfirmCancel={handleCancelSubscription}
        periodEndDate={subscription?.period_end || undefined}
        loading={processing}
      />
    </>
  );
};