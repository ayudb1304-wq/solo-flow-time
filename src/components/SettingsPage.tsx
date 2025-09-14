import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User, Building, Settings, Crown, Zap, Star, DollarSign, Upload, Palette, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useCurrency, CURRENCY_OPTIONS } from "@/hooks/useCurrency";
import { useSubscription } from "@/hooks/useSubscription";

interface Profile {
  id: string;
  freelancer_name: string | null;
  company_address: string | null;
  currency: string | null;
  created_at: string;
  logo_url: string | null;
  brand_color: string | null;
}

interface UserSubscription {
  subscription_status: string;
  subscription_cancel_at_period_end: boolean;
  subscription_period_end: string | null;
}

export const SettingsPage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [hasGoogleAccount, setHasGoogleAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    freelancer_name: "",
    company_address: "",
  });
  const [brandColor, setBrandColor] = useState("#3b82f6");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { currency, updateCurrency } = useCurrency();
  const { plan, refreshSubscription } = useSubscription();
  const { linkGoogleAccount } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkGoogleAccount();
    }
  }, [user]);

  const checkGoogleAccount = async () => {
    if (!user) return;
    
    try {
      // Check if user has Google identity linked
      const { data: { identities } } = await supabase.auth.getUserIdentities();
      const hasGoogle = identities?.some(identity => identity.provider === 'google') || false;
      setHasGoogleAccount(hasGoogle);
    } catch (error) {
      console.error('Error checking Google account:', error);
      setHasGoogleAccount(false);
    }
  };

  const handleGoogleAccountAction = async () => {
    if (hasGoogleAccount) {
      // Show info that account is already linked
      toast({
        title: "Google Account Linked",
        description: "Your Google account is already linked to this account",
      });
    } else {
      try {
        await linkGoogleAccount();
        // Check again after linking
        setTimeout(() => {
          checkGoogleAccount();
        }, 1000);
      } catch (error) {
        console.error('Failed to link Google account:', error);
      }
    }
  };

  const fetchProfile = async () => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      
      // Fetch subscription data
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('subscription_status, subscription_cancel_at_period_end, subscription_period_end')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (subscriptionError) throw subscriptionError;
      
      setProfile(profileData);
      setUserSubscription(subscriptionData || {
        subscription_status: 'trial',
        subscription_cancel_at_period_end: false,
        subscription_period_end: null
      });
      
      setFormData({
        freelancer_name: profileData.freelancer_name || "",
        company_address: profileData.company_address || "",
      });
      setBrandColor(profileData.brand_color || "#3b82f6");
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

  const handleCurrencyChange = async (newCurrency: string) => {
    const success = await updateCurrency(newCurrency);
    if (success) {
      toast({
        title: "Success",
        description: "Currency preference updated successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update currency preference",
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = async (planId: 'pro') => {
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
        description: "Complete your payment to upgrade your plan. Your subscription will be activated automatically upon successful payment.",
      });

      // Set up a more robust check for subscription status after payment
      let pollCount = 0;
      const maxPolls = 60; // Check for up to 5 minutes (60 * 5 seconds)
      
      const checkPaymentStatus = setInterval(async () => {
        try {
          pollCount++;
          await refreshSubscription();
          
          // Check if user becomes pro
          const { data: subData } = await supabase
            .from('user_subscriptions')
            .select('subscription_status, updated_at')
            .eq('user_id', user?.id)
            .maybeSingle();
          
          if (subData?.subscription_status === 'pro') {
            clearInterval(checkPaymentStatus);
            await fetchProfile(); // Refresh profile data
            // Note: Success message is now handled by the real-time subscription in useSubscription
          }
          
          // Stop polling after maximum attempts
          if (pollCount >= maxPolls) {
            clearInterval(checkPaymentStatus);
            toast({
              title: "Payment status check timeout",
              description: "If payment was successful, please refresh the page or contact support if issues persist.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 5000); // Check every 5 seconds

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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a PNG or JPEG image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      // Update profile with logo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });

      fetchProfile();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBrandColorSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ brand_color: brandColor })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Brand color updated successfully",
      });

      fetchProfile();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update brand color",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro': return <Zap className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
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

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notifications">Idle Time Notifications</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Push Notifications</div>
                    <div className="text-xs text-muted-foreground">
                      Get notified when your timer is idle for extended periods
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if ('Notification' in window) {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                          toast({
                            title: "Success",
                            description: "Push notifications enabled for idle timer alerts",
                          });
                        } else if (permission === 'denied') {
                          toast({
                            title: "Permission Denied",
                            description: "Please enable notifications manually in your browser settings",
                            variant: "destructive",
                          });
                        }
                      } else {
                        toast({
                          title: "Not Supported",
                          description: "Push notifications are not supported in this browser",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'}
                  >
                    {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' ? 'Enabled' : 'Enable'}
                  </Button>
                </div>
                
                {/* Show help text if permission was denied */}
                {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-sm text-amber-800">
                      <div className="font-medium mb-1">Notifications are blocked</div>
                      <div className="text-xs space-y-1">
                        <p>To enable notifications manually:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                          <li><strong>Chrome:</strong> Click the lock icon → Site settings → Notifications → Allow</li>
                          <li><strong>Firefox:</strong> Click the shield icon → Permissions → Notifications → Allow</li>
                          <li><strong>Safari:</strong> Safari menu → Settings → Websites → Notifications → Allow</li>
                        </ul>
                        <p className="mt-2">Then refresh this page to retry.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  <div className="font-medium mb-1">How it works:</div>
                  <ul className="space-y-0.5 text-xs">
                    <li>• Browser tab title changes after 15 minutes of inactivity</li>
                    <li>• Push notification appears after 17 minutes (if enabled)</li>
                    <li>• Welcome back modal helps you manage idle time when you return</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Google Account</h4>
                  <p className="text-xs text-muted-foreground">
                    {hasGoogleAccount 
                      ? "Your Google account is linked for easier sign-in" 
                      : "Link your Google account for easier sign-in"
                    }
                  </p>
                </div>
                <Button
                  variant={hasGoogleAccount ? "secondary" : "outline"}
                  size="sm"
                  onClick={handleGoogleAccountAction}
                  className="flex items-center gap-2"
                >
                  {hasGoogleAccount ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Linked
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4" />
                      Link Google Account
                    </>
                  )}
                </Button>
              </div>
            </div>
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
                 {getPlanIcon(userSubscription?.subscription_status || 'trial')}
                 <div>
                   <h3 className="font-semibold capitalize">
                     {userSubscription?.subscription_status || 'trial'} Plan
                     {userSubscription?.subscription_cancel_at_period_end && (
                       <span className="text-orange-600 font-normal text-sm ml-2">(Cancelling)</span>
                     )}
                   </h3>
                   <p className="text-sm text-muted-foreground">
                     {userSubscription?.subscription_status === 'trial' && 'Limited features - Upgrade for full access'}
                     {userSubscription?.subscription_status === 'pro' && !userSubscription?.subscription_cancel_at_period_end && 'Unlimited clients & projects'}
                     {userSubscription?.subscription_cancel_at_period_end && userSubscription?.subscription_period_end && (
                       <span className="text-orange-600">
                         Active until {new Date(userSubscription.subscription_period_end).toLocaleDateString()}
                       </span>
                     )}
                   </p>
                 </div>
               </div>
               <Badge variant="secondary" className={`${getPlanColor(userSubscription?.subscription_status || 'trial')} text-white`}>
                 {userSubscription?.subscription_status === 'trial' ? 'Free' : 
                  userSubscription?.subscription_cancel_at_period_end ? 'Cancelling' : 'Active'}
               </Badge>
             </div>

            {/* Cancel Subscription for Active Plans */}
            {userSubscription?.subscription_status === 'pro' && !userSubscription?.subscription_cancel_at_period_end && (
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

            {/* Upgrade Options for Trial Users or Users with Cancelled Subscriptions */}
            {(userSubscription?.subscription_status === 'trial' || userSubscription?.subscription_cancel_at_period_end) && (
              <div className="space-y-4">
                {userSubscription?.subscription_cancel_at_period_end && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm font-medium">
                      💡 Reactivate your subscription to continue enjoying premium features beyond your current period.
                    </p>
                  </div>
                )}
                <div className="flex justify-center">
                  {/* Pro Plan */}
                  <Card className="border-2 border-blue-200 max-w-sm">
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
                        {upgrading ? 'Processing...' : userSubscription?.subscription_cancel_at_period_end ? 'Reactivate Pro Plan' : 'Upgrade to Pro'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Cancellation Notice */}
            {userSubscription?.subscription_cancel_at_period_end && userSubscription?.subscription_period_end && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-800">Subscription Cancellation Scheduled</h4>
                    <p className="text-orange-700 text-sm mt-1">
                      Your subscription will remain active until <strong>{new Date(userSubscription.subscription_period_end).toLocaleDateString()}</strong>. 
                      After this date, your account will be automatically moved to the trial plan.
                    </p>
                    <p className="text-orange-600 text-xs mt-2">
                      You can resubscribe at any time using the upgrade options above.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Branding - Pro Users Only */}
        {plan === 'pro' && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Invoice Branding
                <Badge variant="secondary" className="bg-blue-500 text-white">Pro</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Company Logo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {/* Logo Preview */}
                    <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/50">
                      {profile?.logo_url ? (
                        <img
                          src={profile.logo_url}
                          alt="Company Logo"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">No logo</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Button */}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="mb-2"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingLogo ? "Uploading..." : "Upload Logo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG or JPEG, max 5MB. Recommended: 400x200px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Brand Color Section */}
                <div className="space-y-3">
                  <Label htmlFor="brand-color" className="text-sm font-medium">Brand Color</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        id="brand-color"
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-12 h-10 rounded border border-input cursor-pointer"
                      />
                      <Input
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        placeholder="#3b82f6"
                        className="w-32"
                      />
                    </div>
                    <Button onClick={handleBrandColorSave} disabled={saving} size="sm">
                      {saving ? "Saving..." : "Save Color"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This color will be used in your invoice headers and highlights
                  </p>
                </div>
              </div>

              {/* Preview Section */}
              <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium mb-3">Invoice Preview</h4>
                <div 
                  className="p-4 bg-white border rounded shadow-sm"
                  style={{ borderTopColor: brandColor, borderTopWidth: '4px' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    {profile?.logo_url && (
                      <img
                        src={profile.logo_url}
                        alt="Logo Preview"
                        className="h-12 object-contain"
                      />
                    )}
                    <div className="text-right">
                      <h3 className="text-xl font-bold" style={{ color: brandColor }}>INVOICE</h3>
                      <p className="text-sm text-muted-foreground">#2024-001</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    This is how your branding will appear on invoices
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade Prompt for Trial Users */}
        {plan === 'trial' && (
          <Card className="lg:col-span-2 border-2 border-dashed border-blue-200">
            <CardContent className="p-6 text-center">
              <Crown className="h-12 w-12 mx-auto text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unlock Custom Invoice Branding</h3>
              <p className="text-muted-foreground mb-4">
                Upgrade to Pro to add your company logo and brand colors to all invoices, making them look professional and branded.
              </p>
              <Button
                onClick={() => handleUpgrade('pro')}
                disabled={upgrading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                {upgrading ? 'Processing...' : 'Upgrade to Pro'}
              </Button>
            </CardContent>
          </Card>
        )}

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
                  {userSubscription?.subscription_status || "trial"}
                  {userSubscription?.subscription_cancel_at_period_end && " (Cancelling)"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Currency</Label>
                <p className="text-sm bg-muted p-2 rounded">
                  {CURRENCY_OPTIONS.find(opt => opt.value === currency)?.label || "USD"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};