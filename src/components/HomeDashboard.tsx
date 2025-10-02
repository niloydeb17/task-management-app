"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Plus,
  ArrowRight,
  Star,
  Target,
  Zap
} from "lucide-react";
import Link from "next/link";

interface HomeDashboardProps {
  user?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddresses?: Array<{ emailAddress: string }>;
    name?: string | null;
  } | null;
}

export function HomeDashboard({ user }: HomeDashboardProps) {
  // Mock data - in a real app, this would come from your database
  const stats = {
    totalTasks: 24,
    completedToday: 8,
    inProgress: 12,
    overdue: 2,
    teamMembers: 6,
    weeklyGoal: 75,
    currentProgress: 60
  };

  const recentTasks = [
    { id: 1, title: "Design new landing page", team: "Design", status: "in-progress", priority: "high" },
    { id: 2, title: "Review marketing copy", team: "Content", status: "pending", priority: "medium" },
    { id: 3, title: "Setup analytics tracking", team: "Development", status: "completed", priority: "low" },
    { id: 4, title: "User research interviews", team: "Research", status: "in-progress", priority: "high" },
  ];

  const upcomingDeadlines = [
    { title: "Q1 Product Launch", date: "Mar 15, 2024", team: "All Teams", urgent: true },
    { title: "Design System Update", date: "Mar 20, 2024", team: "Design", urgent: false },
    { title: "Marketing Campaign", date: "Mar 25, 2024", team: "Content", urgent: false },
  ];

  const teamActivity = [
    { member: "Sarah Chen", action: "completed", task: "User flow diagrams", time: "2 hours ago" },
    { member: "Mike Johnson", action: "assigned", task: "API documentation", time: "3 hours ago" },
    { member: "Emma Davis", action: "updated", task: "Brand guidelines", time: "5 hours ago" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || user?.name || "User"}! 👋
          </h1>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your tasks today.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                +2 from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground">
                Great progress!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">
                Active tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Progress */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Progress
                </CardTitle>
                <CardDescription>
                  You&apos;re {stats.currentProgress}% towards your weekly goal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{stats.currentProgress}%</span>
                  </div>
                  <Progress value={stats.currentProgress} className="h-2" />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Goal: {stats.weeklyGoal} tasks</span>
                    <span>Completed: {Math.round((stats.weeklyGoal * stats.currentProgress) / 100)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/kanban">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </Link>
              <Link href="/teams">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Teams
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="w-full justify-start" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Your latest task updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {task.team}
                        </Badge>
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {task.status === 'in-progress' && <Clock className="h-4 w-4 text-blue-600" />}
                      {task.status === 'pending' && <AlertCircle className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/kanban">
                  <Button variant="outline" className="w-full">
                    View All Tasks
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Important dates to keep in mind</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{deadline.title}</p>
                      <p className="text-sm text-gray-600">{deadline.team}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{deadline.date}</p>
                      {deadline.urgent && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Activity
            </CardTitle>
            <CardDescription>Recent activity from your team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {activity.member.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.member}</span> {activity.action} <span className="font-medium">{activity.task}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
