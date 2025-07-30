import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Clock, 
  Users, 
  Briefcase, 
  DollarSign, 
  Play, 
  Plus,
  Calendar,
  Timer,
  TrendingUp
} from "lucide-react";

const mockProjects = [
  {
    id: 1,
    name: "E-commerce Website Redesign",
    client: "TechCorp Inc.",
    status: "Active",
    tasksCompleted: 8,
    totalTasks: 12,
    hoursThisWeek: 18.5,
    lastActivity: "2 hours ago"
  },
  {
    id: 2,
    name: "Mobile App Development",
    client: "StartupXYZ",
    status: "Active", 
    tasksCompleted: 15,
    totalTasks: 25,
    hoursThisWeek: 32.0,
    lastActivity: "Yesterday"
  },
  {
    id: 3,
    name: "Brand Identity Package",
    client: "Local Restaurant",
    status: "Active",
    tasksCompleted: 5,
    totalTasks: 8,
    hoursThisWeek: 12.5,
    lastActivity: "3 days ago"
  }
];

const recentActivity = [
  { task: "Implemented user authentication", project: "E-commerce Website", duration: "2h 30m", time: "2 hours ago" },
  { task: "Created wireframes for checkout flow", project: "E-commerce Website", duration: "1h 45m", time: "5 hours ago" },
  { task: "Client feedback review", project: "Mobile App", duration: "0h 45m", time: "Yesterday" },
  { task: "Logo concept sketches", project: "Brand Identity", duration: "3h 15m", time: "2 days ago" }
];

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary-light to-primary-light/50 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold text-primary">63.0h</p>
                <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
              </div>
              <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary-light to-secondary-light/50 border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold text-secondary">3</p>
                <p className="text-xs text-muted-foreground mt-1">2 due this month</p>
              </div>
              <div className="h-12 w-12 bg-secondary rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent-light to-accent-light/50 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-3xl font-bold text-accent">12</p>
                <p className="text-xs text-muted-foreground mt-1">3 new this month</p>
              </div>
              <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted to-muted/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Invoices</p>
                <p className="text-3xl font-bold text-foreground">$4,250</p>
                <p className="text-xs text-muted-foreground mt-1">2 invoices unpaid</p>
              </div>
              <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Active Projects
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-lg border border-border bg-card hover:shadow-medium transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    <Badge variant="secondary" className="bg-status-active text-white">
                      {project.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Progress</p>
                      <p className="font-medium">{project.tasksCompleted}/{project.totalTasks} tasks</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">This Week</p>
                      <p className="font-medium">{project.hoursThisWeek}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Activity</p>
                      <p className="font-medium">{project.lastActivity}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="w-full bg-muted rounded-full h-2 mr-4">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(project.tasksCompleted / project.totalTasks) * 100}%` }}
                      />
                    </div>
                    <Button size="sm" variant="timer">
                      <Play className="h-3 w-3 mr-1" />
                      Track
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex flex-col space-y-2 pb-4 border-b border-border last:border-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.task}</p>
                      <p className="text-xs text-muted-foreground">{activity.project}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.duration}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Today's Hours</span>
                <span className="font-semibold">8.5h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tasks Completed</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Invoices Sent</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Revenue (Month)</span>
                <span className="font-semibold text-secondary">$8,750</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};