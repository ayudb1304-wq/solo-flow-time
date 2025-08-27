import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  revenueByMonth: Array<{ month: string; revenue: number }>;
  topClientsByRevenue: Array<{ name: string; revenue: number }>;
  hoursByProject: Array<{ name: string; hours: number }>;
}

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

export const AnalyticsCharts = ({ data }: AnalyticsChartsProps) => {
  // Revenue Over Time Chart
  const revenueChartData = {
    labels: data.revenueByMonth.map(item => item.month),
    datasets: [
      {
        label: 'Revenue ($)',
        data: data.revenueByMonth.map(item => item.revenue),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `Revenue: $${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
          callback: (value: any) => `$${value}`,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
        },
      },
    },
  };

  // Top Clients Chart
  const clientsChartData = {
    labels: data.topClientsByRevenue.map(item => item.name),
    datasets: [
      {
        label: 'Revenue ($)',
        data: data.topClientsByRevenue.map(item => item.revenue),
        backgroundColor: [
          'rgba(168, 85, 247, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(168, 85, 247, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const clientsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: (context: any) => `Revenue: $${context.parsed.x.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
          callback: (value: any) => `$${value}`,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
        },
      },
    },
  };

  // Hours by Project Doughnut Chart
  const hoursChartData = {
    labels: data.hoursByProject.map(item => item.name),
    datasets: [
      {
        data: data.hoursByProject.map(item => item.hours),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const hoursChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          color: 'rgba(156, 163, 175, 0.8)',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: (context: any) => `Hours: ${context.parsed.toFixed(1)}h`,
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Revenue Over Time */}
      <Card className="col-span-1 lg:col-span-2 xl:col-span-2 border-0 shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            Revenue Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {data.revenueByMonth.length > 0 ? (
              <Bar data={revenueChartData} options={revenueChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No revenue data available for the selected period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hours by Project */}
      <Card className="border-0 shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            Hours by Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {data.hoursByProject.length > 0 ? (
              <Doughnut data={hoursChartData} options={hoursChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Start tracking time to see project distribution
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Clients by Revenue */}
      <Card className="col-span-1 lg:col-span-2 xl:col-span-3 border-0 shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            Top 5 Clients by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {data.topClientsByRevenue.length > 0 ? (
              <Bar data={clientsChartData} options={clientsChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Complete projects and track time to see client revenue data
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};