import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Calendar, Clock, Users, TrendingUp, Crown, AlertCircle } from 'lucide-react';

interface SubscriptionData {
  user_id: string;
  freelancer_name: string;
  currency: string;
  status: string;
  cancel_at_period_end: boolean;
  period_end: string | null;
  days_remaining: number | null;
  next_billing_date: string | null;
  subscription_summary: string;
  health_status: string;
}

export const SubscriptionDashboard = () => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    } else {
      setSubscriptionData(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    if (!user) {
      setSubscriptionData(null);
      setLoading(false);
      return;
    }

    try {
      // Use the secure subscription_dashboard view
      const { data, error } = await supabase
        .from('subscription_dashboard')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription data:', error);
        throw error;
      }

      if (data) {
        // Data is already processed by the subscription_dashboard view
        setSubscriptionData({
          user_id: data.user_id,
          freelancer_name: data.freelancer_name,
          currency: data.currency || 'INR',
          status: data.status,
          cancel_at_period_end: data.cancel_at_period_end,
          period_end: data.period_end,
          days_remaining: data.days_remaining,
          next_billing_date: data.next_billing_date ? new Date(data.next_billing_date).toLocaleDateString() : null,
          subscription_summary: data.subscription_summary,
          health_status: data.health_status
        });
      } else {
        // No subscription data found
        setSubscriptionData(null);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      // Handle authorization errors gracefully
      if (error.message?.includes('insufficient_privilege') || error.message?.includes('unauthorized')) {
        setSubscriptionData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading subscription details...</div>;
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Please sign in to view subscription details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No subscription data available</p>
            <p className="text-sm text-muted-foreground mt-1">You may need to set up your subscription first</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500 hover:bg-green-600';
      case 'CANCELLED': return 'bg-red-500 hover:bg-red-600'; 
      case 'TRIAL': return 'bg-blue-500 hover:bg-blue-600';
      case 'EXPIRED': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Crown className="h-4 w-4" />;
      case 'CANCELLED': return <AlertCircle className="h-4 w-4" />;
      case 'TRIAL': return <Users className="h-4 w-4" />;
      case 'EXPIRED': return <Clock className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Subscription Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{subscriptionData.freelancer_name}</h3>
              <p className="text-muted-foreground">{subscriptionData.subscription_summary}</p>
            </div>
            <Badge className={`${getStatusColor(subscriptionData.health_status)} text-white`}>
              {getStatusIcon(subscriptionData.health_status)}
              <span className="ml-1">{subscriptionData.health_status}</span>
            </Badge>
          </div>

          {/* Billing Information */}
          {subscriptionData.status === 'active' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Next Billing Date</p>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionData.next_billing_date || 'Not set'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Days Remaining</p>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionData.days_remaining !== null 
                      ? `${subscriptionData.days_remaining} days` 
                      : 'Unlimited'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Notice */}
          {subscriptionData.cancel_at_period_end && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">Subscription Scheduled for Cancellation</h4>
                  <p className="text-orange-700 text-sm mt-1">
                    Your Pro features will remain active until{' '}
                    <strong>{subscriptionData.next_billing_date}</strong>. 
                    After this date, your account will be moved to the trial plan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {subscriptionData.status === 'trial' && (
              <Button className="flex-1">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            )}
            
            {subscriptionData.cancel_at_period_end && (
              <Button variant="outline" className="flex-1">
                Reactivate Subscription
              </Button>
            )}

            <Button variant="outline" onClick={fetchSubscriptionData}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};