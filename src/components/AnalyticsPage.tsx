import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Users, 
  BarChart3,
  Crown,
  Sparkles
} from 'lucide-react';
import { AnalyticsCharts } from './analytics/AnalyticsCharts';
import { UpgradePrompt } from './UpgradePrompt';
import { LoadingSpinner } from './ui/loading-spinner';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface AnalyticsData {
  totalRevenue: number;
  totalHours: number;
  averageProjectValue: number;
  topClient: { name: string; revenue: number } | null;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  topClientsByRevenue: Array<{ name: string; revenue: number }>;
  hoursByProject: Array<{ name: string; hours: number }>;
}

type DateRange = 'last30' | 'last90' | 'thisYear' | 'allTime';

const DATE_RANGE_OPTIONS = {
  last30: { label: 'Last 30 Days', days: 30 },
  last90: { label: 'Last 90 Days', days: 90 },
  thisYear: { label: 'This Year', days: null },
  allTime: { label: 'All Time', days: null }
};

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const [dateRange, setDateRange] = useState<DateRange>('last30');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Show upgrade prompt for non-pro users
  if (plan !== 'pro') {
    return (
      <UpgradePrompt 
        title="Unlock Your Business Insights"
        message="Upgrade to Pro to access the Analytics Dashboard with comprehensive business metrics, revenue tracking, and actionable insights to grow your freelance business."
        onUpgrade={() => window.open('https://razorpay.com/payment-link/plink_PLa9DGZKx7ufnB', '_blank')}
      />
    );
  }

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, dateRange]);

  const getDateRangeFilter = () => {
    const now = new Date();
    
    switch (dateRange) {
      case 'last30':
        return subDays(now, 30);
      case 'last90':
        return subDays(now, 90);
      case 'thisYear':
        return startOfYear(now);
      case 'allTime':
        return new Date('2020-01-01'); // Far enough back to capture all data
      default:
        return subDays(now, 30);
    }
  };

  const fetchAnalyticsData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const startDate = getDateRangeFilter();
      
      // Fetch time entries with related data and projects with clients
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select(`
          *,
          projects!inner(
            id,
            name, 
            hourly_rate,
            client_id,
            clients!inner(name)
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .not('end_time', 'is', null);

      if (timeError) throw timeError;

      // Fetch invoices for completed projects
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (invoicesError) throw invoicesError;

      // Process the data
      const processedData = processAnalyticsData(timeEntries || [], invoices || []);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (timeEntries: any[], invoices: any[]): AnalyticsData => {
    // Calculate total revenue from invoices
    const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);

    // Calculate total billable hours
    const totalHours = timeEntries.reduce((sum, entry) => {
      const duration = entry.duration_seconds || 0;
      return sum + (duration / 3600); // Convert seconds to hours
    }, 0);

    // Calculate average project value
    const uniqueProjects = [...new Set(timeEntries.map(entry => entry.project_id))];
    const averageProjectValue = uniqueProjects.length > 0 ? totalRevenue / uniqueProjects.length : 0;

    // Calculate revenue by client
    const clientRevenue = new Map<string, number>();
    timeEntries.forEach(entry => {
      if (entry.projects?.clients?.name && entry.projects?.hourly_rate && entry.duration_seconds) {
        const clientName = entry.projects.clients.name;
        const revenue = (entry.duration_seconds / 3600) * Number(entry.projects.hourly_rate);
        clientRevenue.set(clientName, (clientRevenue.get(clientName) || 0) + revenue);
      }
    });

    // Get top client
    const topClient = Array.from(clientRevenue.entries())
      .sort(([,a], [,b]) => b - a)[0];

    // Revenue by month (for chart)
    const monthlyRevenue = new Map<string, number>();
    timeEntries.forEach(entry => {
      if (entry.projects?.hourly_rate && entry.duration_seconds) {
        const month = format(new Date(entry.created_at), 'MMM yyyy');
        const revenue = (entry.duration_seconds / 3600) * Number(entry.projects.hourly_rate);
        monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + revenue);
      }
    });

    // Top 5 clients by revenue
    const topClientsByRevenue = Array.from(clientRevenue.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Hours by project
    const projectHours = new Map<string, number>();
    timeEntries.forEach(entry => {
      if (entry.projects?.name && entry.duration_seconds) {
        const projectName = entry.projects.name;
        const hours = entry.duration_seconds / 3600;
        projectHours.set(projectName, (projectHours.get(projectName) || 0) + hours);
      }
    });

    const hoursByProject = Array.from(projectHours.entries())
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    return {
      totalRevenue,
      totalHours,
      averageProjectValue,
      topClient: topClient ? { name: topClient[0], revenue: topClient[1] } : null,
      revenueByMonth: Array.from(monthlyRevenue.entries())
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),
      topClientsByRevenue,
      hoursByProject
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            Business Analytics
            <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full border border-emerald-500/20">
              <Crown className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">Pro Feature</span>
            </div>
          </h1>
          <p className="text-muted-foreground mt-1">
            Get actionable insights into your freelance business performance
          </p>
        </div>
        
        {/* Date Range Filter */}
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGE_OPTIONS).map(([key, option]) => (
              <SelectItem key={key} value={key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {analyticsData && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue */}
            <Card className="border-0 shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  ${analyticsData.totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {DATE_RANGE_OPTIONS[dateRange].label.toLowerCase()}
                </p>
              </CardContent>
            </Card>

            {/* Total Hours */}
            <Card className="border-0 shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">
                  {analyticsData.totalHours.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">
                  Time tracked
                </p>
              </CardContent>
            </Card>

            {/* Average Project Value */}
            <Card className="border-0 shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Project Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  ${analyticsData.averageProjectValue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per project
                </p>
              </CardContent>
            </Card>

            {/* Top Client */}
            <Card className="border-0 shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Client</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-purple-500 truncate">
                  {analyticsData.topClient?.name || 'No data'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.topClient ? `$${analyticsData.topClient.revenue.toFixed(2)} revenue` : 'Track time to see data'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <AnalyticsCharts data={analyticsData} />
        </>
      )}
    </div>
  );
};