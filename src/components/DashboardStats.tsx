"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface DashboardStatsProps {
  teamId?: string;
}

interface TeamStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  currentStreak: number;
  totalCompleted: number;
  teamName: string;
}

export function DashboardStats({ teamId }: DashboardStatsProps) {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Get team data
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id, name')
          .limit(1)
          .single();
        
        if (teamError) throw teamError;
        
        const currentTeamId = teamId || teamData.id;
        
        // Get task counts
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, status, completed_at')
          .eq('team_id', currentTeamId);
        
        if (tasksError) throw tasksError;
        
        // Get team streak data
        const { data: streakData, error: streakError } = await supabase
          .from('team_streaks')
          .select('current_streak, total_tasks_completed')
          .eq('team_id', currentTeamId)
          .single();
        
        if (streakError) throw streakError;
        
        // Calculate stats
        const totalTasks = tasksData.length;
        const completedTasks = tasksData.filter(task => task.completed_at).length;
        const inProgressTasks = tasksData.filter(task => 
          task.status?.name === 'In Progress' || task.status?.name === 'in_progress'
        ).length;
        
        setStats({
          totalTasks,
          completedTasks,
          inProgressTasks,
          currentStreak: streakData?.current_streak || 0,
          totalCompleted: streakData?.total_tasks_completed || 0,
          teamName: teamData.name
        });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [teamId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error loading stats: {error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTasks}</div>
          <p className="text-xs text-muted-foreground">
            {stats.teamName} Team
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
          <p className="text-xs text-muted-foreground">
            {completionRate}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
          <p className="text-xs text-muted-foreground">
            Active tasks
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Streak</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.currentStreak} days</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalCompleted} total completed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
