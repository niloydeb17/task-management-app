"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface StreakData {
  currentStreak: number;
  completedTasksToday: number;
  lastActivityDate: string | null;
}

export const useStreakTracking = () => {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    completedTasksToday: 0,
    lastActivityDate: null
  });
  const [showStreakPopup, setShowStreakPopup] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Check if a date is today
  const isToday = (dateString: string) => {
    return dateString === getTodayString();
  };

  // Check if a date is yesterday
  const isYesterday = (dateString: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateString === yesterday.toISOString().split('T')[0];
  };

  // Load streak data from database (simplified without authentication)
  const loadStreakData = useCallback(async () => {
    try {
      // Get all tasks completed today
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, completed_at, updated_at, status')
        .not('completed_at', 'is', null);

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        setStreakData({
          currentStreak: 0,
          completedTasksToday: 0,
          lastActivityDate: null
        });
        return;
      }

      // Count completed tasks today
      const completedTasksToday = allTasks?.filter(task => {
        if (!task.completed_at) return false;
        const completedDate = task.completed_at.split('T')[0];
        return isToday(completedDate);
      }).length || 0;

      // Get or create default streak record
      const teamId = 'default-team';
      
      const { data: streakRecord, error: streakError } = await supabase
        .from('team_streaks')
        .select('*')
        .eq('team_id', teamId)
        .single();

      let currentStreak = 0;
      let lastActivityDate = null;

      if (streakError && streakError.code === 'PGRST116') {
        // No streak record exists, create one
        const { data: newStreak, error: createError } = await supabase
          .from('team_streaks')
          .insert({
            team_id: teamId,
            current_streak: completedTasksToday > 0 ? 1 : 0,
            longest_streak: completedTasksToday > 0 ? 1 : 0,
            last_activity_date: completedTasksToday > 0 ? getTodayString() : null,
            total_tasks_completed: completedTasksToday
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating streak record:', createError);
        } else {
          currentStreak = newStreak?.current_streak || 0;
          lastActivityDate = newStreak?.last_activity_date;
        }
      } else if (streakRecord) {
        currentStreak = streakRecord.current_streak || 0;
        lastActivityDate = streakRecord.last_activity_date;

        // Update streak if tasks were completed today
        if (completedTasksToday > 0) {
          const shouldIncrementStreak = !lastActivityDate || 
            isToday(lastActivityDate) || 
            isYesterday(lastActivityDate);

          const newStreak = shouldIncrementStreak ? 
            (isToday(lastActivityDate) ? currentStreak : currentStreak + 1) : 1;

          const { error: updateError } = await supabase
            .from('team_streaks')
            .update({
              current_streak: newStreak,
              longest_streak: Math.max(streakRecord.longest_streak || 0, newStreak),
              last_activity_date: getTodayString(),
              total_tasks_completed: (streakRecord.total_tasks_completed || 0) + completedTasksToday
            })
            .eq('id', streakRecord.id);

          if (updateError) {
            console.error('Error updating streak:', updateError);
          } else {
            currentStreak = newStreak;
            lastActivityDate = getTodayString();
          }
        }
      }

      setStreakData({
        currentStreak,
        completedTasksToday,
        lastActivityDate
      });

      // Show popup if user completed 2 or more tasks today and has a streak
      if (completedTasksToday >= 2 && currentStreak > 0) {
        setShowStreakPopup(true);
      }

    } catch (error) {
      console.error('Error in loadStreakData:', error);
      
      // Set default values on any error
      setStreakData({
        currentStreak: 0,
        completedTasksToday: 0,
        lastActivityDate: null
      });
    }
  }, []);

  // Track task completion (simplified without authentication)
  const trackTaskCompletion = useCallback(async (taskId: string, isCompleted: boolean) => {
    if (!isCompleted) return;

    try {
      console.log('🎯 Tracking task completion:', { taskId, isCompleted });
      
      // Check if supabase is available
      if (!supabase) {
        console.error('❌ Supabase client not available');
        return;
      }

      // Update task completion timestamp
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task completion:', {
          error,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          errorCode: error.code,
          taskId
        });
        return;
      }

      console.log('✅ Task completion tracked successfully:', { taskId });

      // Reload streak data after a short delay to avoid circular dependency
      setTimeout(() => {
        loadStreakData();
      }, 100);

    } catch (error) {
      console.error('Error tracking task completion:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        taskId
      });
    }
  }, [loadStreakData]);

  // Close streak popup
  const closeStreakPopup = useCallback(() => {
    setShowStreakPopup(false);
  }, []);

  // Load initial data
  useEffect(() => {
    loadStreakData();
  }, [loadStreakData]);

  // Test function to manually trigger popup (for development)
  const testStreakPopup = useCallback(() => {
    setStreakData(prev => ({
      ...prev,
      currentStreak: 1,
      completedTasksToday: 2
    }));
    setShowStreakPopup(true);
  }, []);

  // Debug function to check database state (simplified)
  const debugDatabaseState = useCallback(async () => {
    try {
      // Check all tasks (for debugging)
      const { data: allTasksData, error: allTasksError } = await supabase
        .from('tasks')
        .select('id, title, completed_at')
        .limit(5);

      console.log('All tasks sample:', allTasksData);
      console.log('All tasks error:', allTasksError);

      // Check streak data
      const { data: streakData, error: streakError } = await supabase
        .from('team_streaks')
        .select('*')
        .eq('team_id', 'default-team');

      console.log('Streak data:', streakData);
      console.log('Streak error:', streakError);

    } catch (error) {
      console.error('Debug error:', error);
    }
  }, []);

  return {
    streakData,
    showStreakPopup,
    closeStreakPopup,
    trackTaskCompletion,
    loadStreakData,
    testStreakPopup, // For testing
    debugDatabaseState // For debugging
  } as const;
};
