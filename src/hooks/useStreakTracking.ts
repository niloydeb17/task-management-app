"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface StreakData {
  currentStreak: number;
  completedTasksToday: number;
  lastActivityDate: string | null;
}

export const useStreakTracking = () => {
  const { user } = useAuth();
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

  // Load streak data from database
  const loadStreakData = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available for streak tracking');
      return;
    }

    console.log('Loading streak data for user:', user.id);

    try {
      // First, get the user's UUID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.id) // user.id is actually the email
        .single();

      if (userError || !userData) {
        console.log('User not found in database, skipping streak tracking');
        setStreakData({
          currentStreak: 0,
          completedTasksToday: 0,
          lastActivityDate: null
        });
        return;
      }

      const userUuid = userData.id;
      console.log('Found user UUID:', userUuid);

      // Get user's tasks that were completed today
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, completed_at, updated_at, status, assignee_id')
        .eq('assignee_id', userUuid);

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        console.error('User ID:', user.id);
        console.error('User object:', user);
        
        // If the error is due to no matching tasks, that's okay - just return 0
        if (tasksError.code === 'PGRST116' || tasksError.message?.includes('No rows found')) {
          console.log('No tasks found for user, setting completed tasks to 0');
          setStreakData({
            currentStreak: 0,
            completedTasksToday: 0,
            lastActivityDate: null
          });
          return;
        }
        return;
      }

      console.log('Fetched tasks:', allTasks?.length || 0);

      // Count completed tasks (tasks with completed_at set to today)
      const completedTasksToday = allTasks?.filter(task => {
        if (!task.completed_at) return false;
        const completedDate = task.completed_at.split('T')[0];
        return isToday(completedDate);
      }).length || 0;

      console.log('Completed tasks today:', completedTasksToday);

      // If no tasks found, set default values and return
      if (!allTasks || allTasks.length === 0) {
        console.log('No tasks found for user, setting default streak data');
        setStreakData({
          currentStreak: 0,
          completedTasksToday: 0,
          lastActivityDate: null
        });
        return;
      }

      // Get or create streak record
      const teamId = user.teamId || userUuid || 'default';
      console.log('Using team ID:', teamId);
      
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
  }, [user?.id]);

  // Track task completion
  const trackTaskCompletion = useCallback(async (taskId: string, isCompleted: boolean) => {
    if (!user?.id || !isCompleted) return;

    try {
      // First, get the user's UUID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.id) // user.id is actually the email
        .single();

      if (userError || !userData) {
        console.log('User not found in database, cannot track task completion');
        return;
      }

      const userUuid = userData.id;

      // Update task completion timestamp
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('assignee_id', userUuid);

      if (error) {
        console.error('Error updating task completion:', error);
        return;
      }

      // Reload streak data after a short delay to avoid circular dependency
      setTimeout(() => {
        if (user?.id) {
          loadStreakData();
        }
      }, 100);

    } catch (error) {
      console.error('Error tracking task completion:', error);
    }
  }, [user?.id, loadStreakData]);

  // Close streak popup
  const closeStreakPopup = useCallback(() => {
    setShowStreakPopup(false);
  }, []);

  // Load initial data
  useEffect(() => {
    // Only load streak data if user is available
    if (user?.id) {
      loadStreakData();
    }
  }, [loadStreakData, user?.id]);

  // Test function to manually trigger popup (for development)
  const testStreakPopup = useCallback(() => {
    setStreakData(prev => ({
      ...prev,
      currentStreak: 1,
      completedTasksToday: 2
    }));
    setShowStreakPopup(true);
  }, []);

  // Debug function to check database state
  const debugDatabaseState = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available');
      return;
    }

    try {
      // Check if user exists by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, team_id')
        .eq('email', user.id) // user.id is actually the email
        .single();

      console.log('User data:', userData);
      console.log('User error:', userError);

      if (userData) {
        // Check tasks for this user using UUID
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, assignee_id, completed_at')
          .eq('assignee_id', userData.id);

        console.log('Tasks data:', tasksData);
        console.log('Tasks error:', tasksError);
      }

      // Check all tasks (for debugging)
      const { data: allTasksData, error: allTasksError } = await supabase
        .from('tasks')
        .select('id, title, assignee_id, completed_at')
        .limit(5);

      console.log('All tasks sample:', allTasksData);
      console.log('All tasks error:', allTasksError);

    } catch (error) {
      console.error('Debug error:', error);
    }
  }, [user?.id]);

  return {
    streakData,
    showStreakPopup,
    closeStreakPopup,
    trackTaskCompletion,
    loadStreakData,
    testStreakPopup, // For testing
    debugDatabaseState // For debugging
  };
};
