import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Building, Settings, Crown, Zap, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  id: string;
  freelancer_name: string | null;
  company_address: string | null;
  subscription_status: string | null;
  subscription_cancel_at_period_end: boolean | null;
  subscription_period_end: string | null;
  created_at: string;
}

export const SettingsPage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [formData, setFormData] = useState({
    freelancer_name: "",
    company_address: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        freelancer_name: data.freelancer_name || "",
        company_address: data.company_address || "",
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to fetch profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          freelancer_name: formData.freelancer_name,
          company_address: formData.company_address,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      fetchProfile();
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpgrade = async (planId: 'pro' | 'business') => {
    setUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-subscription', {
        body: { planId, userId: user?.id }
      });

      if (error) throw error;

      // Open Razorpay payment page
      window.open(data.short_url, '_blank');
      
      toast({
        title: "Redirecting to payment",
        description: "Complete your payment to upgrade your plan",
      });

      // For testing: simulate subscription activation after 5 seconds
      setTimeout(async () => {
        try {
          await supabase.functions.invoke('test-subscription-update', {
            body: { 
              userId: user?.id, 
              plan: planId 
            }
          });
          toast({
            title: "Success",
            description: `Upgraded to ${planId} plan successfully!`,
          });
          // Refresh the page to update subscription status
          window.location.reload();
        } catch (error) {
          console.error('Error updating subscription:', error);
        }
      }, 5000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access to premium features until the end of your current billing period.')) {
      return;
    }

    setUpgrading(true);
    try {
      const { error } = await supabase.functions.invoke('cancel-razorpay-subscription');

      if (error) throw error;

      toast({
        title: "Subscription Scheduled for Cancellation",
        description: "You'll continue to have access until the end of your billing period.",
      });

      // Refresh to update the UI
      fetchProfile();

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro': return <Zap className="h-4 w-4" />;
      case 'business': return <Crown className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-blue-500';
      case 'business': return 'bg-purple-500';
      default: return 'bg-green-500';
    }
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="freelancer-name">Freelancer Name</Label>
              <Input
                id="freelancer-name"
                value={formData.freelancer_name}
                onChange={(e) => handleInputChange('freelancer_name', e.target.value)}
                placeholder="Enter your freelancer name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="company-address">Company Address</Label>
              <Textarea
                id="company-address"
                value={formData.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                placeholder="Enter your company address for invoices"
                rows={4}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Company Info"}
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Subscription & Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getPlanIcon(profile?.subscription_status || 'trial')}
                <div>
                  <h3 className="font-semibold capitalize">
                    {profile?.subscription_status || 'trial'} Plan
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.subscription_status === 'trial' && 'Limited features - Upgrade for full access'}
                    {profile?.subscription_status === 'pro' && 'Unlimited clients & projects'}
                    {profile?.subscription_status === 'business' && 'Everything + multi-user access'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className={`${getPlanColor(profile?.subscription_status || 'trial')} text-white`}>
                {profile?.subscription_status === 'trial' ? 'Free' : 'Active'}
              </Badge>
            </div>

            {/* Cancel Subscription for Active Plans */}
            {(profile?.subscription_status === 'pro' || profile?.subscription_status === 'business') && (
              <div className="mt-6 pt-4 border-t">
                <div className="text-right">
                  <Button 
                    onClick={handleCancelSubscription}
                    disabled={upgrading}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive text-xs"
                  >
                    {upgrading ? 'Processing...' : 'Cancel subscription'}
                  </Button>
                </div>
              </div>
            )}

            {/* Upgrade Options */}
            {profile?.subscription_status === 'trial' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pro Plan */}
                <Card className="border-2 border-blue-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Zap className="h-5 w-5" />
                      Pro Plan
                    </CardTitle>
                    <div className="text-2xl font-bold">₹799<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-2 text-sm">
                      <li>✓ Unlimited clients & projects</li>
                      <li>✓ Advanced invoicing</li>
                      <li>✓ Detailed reports</li>
                      <li>✓ Priority support</li>
                    </ul>
                    <Button 
                      onClick={() => handleUpgrade('pro')} 
                      disabled={upgrading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {upgrading ? 'Processing...' : 'Upgrade to Pro'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Business Plan */}
                <Card className="border-2 border-purple-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <Crown className="h-5 w-5" />
                      Business Plan
                    </CardTitle>
                    <div className="text-2xl font-bold">₹1599<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-2 text-sm">
                      <li>✓ Everything in Pro</li>
                      <li>✓ Multi-user access</li>
                      <li>✓ API integrations</li>
                      <li>✓ White-label options</li>
                    </ul>
                    <Button 
                      onClick={() => handleUpgrade('business')} 
                      disabled={upgrading}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {upgrading ? 'Processing...' : 'Upgrade to Business'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Account Created</Label>
                <p className="text-sm bg-muted p-2 rounded">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Plan Status</Label>
                <p className="text-sm bg-muted p-2 rounded capitalize">
                  {profile?.subscription_status || "trial"}
                  {profile?.subscription_cancel_at_period_end && " (Cancelling)"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email Verified</Label>
                <p className="text-sm bg-muted p-2 rounded">
                  {user?.email_confirmed_at ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};