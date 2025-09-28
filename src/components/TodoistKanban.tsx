"use client";

import React, { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Calendar,
  User,
  MoreHorizontal,
  Share,
  Eye,
  Settings,
  LogOut
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/lib/auth-client";
import { useStreakTracking } from "@/hooks/useStreakTracking";
import { StreakCelebrationPopup } from "@/components/StreakCelebrationPopup";
import { supabase } from "@/lib/supabase";
import { TaskCreationModal } from "@/components/TaskCreationModal";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { SectionCreationModal } from "@/components/SectionCreationModal";
import { ColumnEditModal } from "@/components/ColumnEditModal";
import { HandoffService } from "@/lib/handoff";
import { HandoffForm } from "@/types";
import LoaderOne from "@/components/ui/loader-one";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  column_id: string;
  tags: string[];
  due_date?: string;
  created_at: string;
  progress?: string;
  team_id?: string;
  position?: number; // For ordering within columns
  assignee?: {
    name: string;
    avatar?: string;
  };
}

interface Column {
  id: string;
  name: string;
  color: string;
  position?: number;
}

interface TodoistKanbanProps {
  teamId?: string;
  showLoading?: boolean; // Add prop to control loading display
}

export function TodoistKanban({ teamId, showLoading = true }: TodoistKanbanProps) {
  const { user } = useAuth();
  const { streakData, showStreakPopup, closeStreakPopup, trackTaskCompletion } = useStreakTracking();
  
  // Helper function to ensure unique tasks by ID
  const ensureUniqueTasks = (tasks: Task[]): Task[] => {
    return tasks.filter((task, index, self) => 
      index === self.findIndex(t => t.id === task.id)
    );
  };
  
  // Debug user data
  console.log('TodoistKanban user data:', user);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isColumnEditModalOpen, setIsColumnEditModalOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<any>(null);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; type: string; color: string }>>([]);
  const [currentTeam, setCurrentTeam] = useState<{ id: string; name: string; type: string; color: string } | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    columnId: string;
    position: number;
    show: boolean;
  } | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Parallel database queries for better performance
        const [teamsResult, allTeamsResult] = await Promise.allSettled([
          // Get team data
          teamId 
            ? supabase.from('teams').select('id, name, board_template').eq('id', teamId)
            : supabase.from('teams').select('id, name, board_template').limit(1),
          
          // Fetch all teams for handoff functionality
          supabase.from('teams').select('id, name, type, color')
        ]);
        
        const teamsData = teamsResult.status === 'fulfilled' ? teamsResult.value.data : null;
        const teamError = teamsResult.status === 'fulfilled' ? teamsResult.value.error : teamsResult.reason;
        
        const allTeamsData = allTeamsResult.status === 'fulfilled' ? allTeamsResult.value.data : null;
        const allTeamsError = allTeamsResult.status === 'fulfilled' ? allTeamsResult.value.error : allTeamsResult.reason;
        
        console.log('Teams query result:', { teamsData, teamError, teamsLength: teamsData?.length });
        
        if (teamError) {
          console.error('Team error:', teamError);
          throw new Error(`Team error: ${teamError.message}`);
        }
        
        if (allTeamsError) {
          console.error('All teams error:', allTeamsError);
        } else {
          setTeams(allTeamsData || []);
        }
        
        let teamData;
        let columnsData;
        let tasksData = [];
        
        // Use dummy data for testing teams or when no teams found
        const isTestTeam = teamId && ['dummy-team-id', 'dummy-dev-team', 'dummy-content-team', 'dummy-marketing-team'].includes(teamId);
        
        if (!teamsData || teamsData.length === 0 || isTestTeam) {
          // Use dummy data when no teams found or for test teams
          console.log('Using dummy data for team:', teamId);
          
          // Set dummy teams data for handoff functionality
          setTeams([
            { id: 'dummy-team-id', name: 'Design Sprint', type: 'design', color: '#3B82F6' },
            { id: 'dummy-dev-team', name: 'Development Team', type: 'development', color: '#10B981' },
            { id: 'dummy-content-team', name: 'Content Team', type: 'content', color: '#F59E0B' },
            { id: 'dummy-marketing-team', name: 'Marketing Team', type: 'marketing', color: '#EF4444' }
          ]);
          
          // Dummy team data
          if (teamId === 'dummy-dev-team') {
            teamData = {
              id: 'dummy-dev-team',
              name: 'Development Team',
              type: 'development',
              color: '#10B981',
              board_template: {
                columns: [
                  { id: 'backlog', name: 'Backlog', color: '#6B7280', order: 0 },
                  { id: 'todo', name: 'To Do', color: '#3B82F6', order: 1 },
                  { id: 'in-progress', name: 'In Progress', color: '#F59E0B', order: 2 },
                  { id: 'review', name: 'Review', color: '#8B5CF6', order: 3 },
                  { id: 'done', name: 'Done', color: '#10B981', order: 4 }
                ]
              }
            };
          } else {
            teamData = {
              id: 'dummy-team-id',
              name: 'Design Sprint',
              type: 'design',
              color: '#3B82F6',
              board_template: {
                columns: [
                  { id: 'backlog', name: 'Backlog', color: '#6B7280', order: 0 },
                  { id: 'pre-sprint', name: 'Pre-sprint prep', color: '#6B7280', order: 1 },
                  { id: 'day-by-day', name: 'Day-by-day prep', color: '#3B82F6', order: 2 },
                  { id: 'post-sprint', name: 'Post-sprint prep', color: '#10B981', order: 3 }
                ]
              }
            };
          }
          
          // Dummy tasks data
          tasksData = [
            {
              id: 'task-1',
              title: 'Define Sprint Objectives',
              description: 'Clearly outline the goals and o...',
              priority: 'urgent' as const,
              column_id: 'pre-sprint',
              tags: ['Sprint'],
              due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
              progress: '0/1',
              team_id: 'dummy-team-id',
              position: 0,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-2',
              title: 'Assemble the Team',
              priority: 'high' as const,
              column_id: 'pre-sprint',
              tags: ['Sprint'],
              due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
              progress: '0/2',
              team_id: 'dummy-team-id',
              position: 1,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-3',
              title: 'Choose a Facilitator',
              description: 'Designate a facilitator respons...',
              priority: 'high' as const,
              column_id: 'pre-sprint',
              tags: ['Sprint'],
              due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
              team_id: 'dummy-team-id',
              position: 2,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-4',
              title: 'Select Dates and Duration',
              description: 'Determine the dates and duration for the sprint',
              priority: 'medium' as const,
              column_id: 'pre-sprint',
              tags: ['Sprint'],
              due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
              team_id: 'dummy-team-id',
              position: 3,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-5',
              title: 'Design System Complete',
              description: 'Finished creating the complete design system with components, colors, and typography guidelines. Ready for development team to implement.',
              priority: 'high' as const,
              column_id: 'post-sprint',
              tags: ['Design', 'Complete'],
              due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Past due date
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              team_id: 'dummy-team-id',
              position: 0,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-6',
              title: 'Secure Resources',
              description: 'Arrange necessary resources for the sprint',
              priority: 'medium' as const,
              column_id: 'pre-sprint',
              tags: ['Sprint'],
              due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
              team_id: 'dummy-team-id',
              position: 4,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-6',
              title: 'Pre-Sprint Research',
              description: 'Conduct any necessary resear...',
              priority: 'medium' as const,
              column_id: 'pre-sprint',
              tags: ['Sprint'],
              due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
              team_id: 'dummy-team-id',
              position: 5,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-7',
              title: 'Prep Materials',
              description: 'Prepare any pre-sprint materi...',
              priority: 'medium' as const,
              column_id: 'pre-sprint',
              tags: ['Sprint'],
              due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
              team_id: 'dummy-team-id',
              position: 6,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-8',
              title: 'Share Pre-Sprint Information',
              description: 'Distribute relevant information...',
              priority: 'low' as const,
              column_id: 'pre-sprint',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              team_id: 'dummy-team-id',
              position: 7,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-9',
              title: 'Day 1: Understand',
              priority: 'high' as const,
              column_id: 'day-by-day',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              progress: '0/2',
              team_id: 'dummy-team-id',
              position: 0,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-10',
              title: 'Day 2: Diverge (Generate Ideas)',
              priority: 'high' as const,
              column_id: 'day-by-day',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              progress: '0/3',
              team_id: 'dummy-team-id',
              position: 1,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-11',
              title: 'Day 3: Decide',
              priority: 'high' as const,
              column_id: 'day-by-day',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              progress: '0/2',
              team_id: 'dummy-team-id',
              position: 2,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-12',
              title: 'Day 4: Prototype',
              priority: 'high' as const,
              column_id: 'day-by-day',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              progress: '0/2',
              team_id: 'dummy-team-id',
              position: 3,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-13',
              title: 'Day 5: Test',
              priority: 'high' as const,
              column_id: 'day-by-day',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              progress: '0/2',
              team_id: 'dummy-team-id',
              position: 4,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-14',
              title: 'Schedule User Testing',
              priority: 'medium' as const,
              column_id: 'post-sprint',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              team_id: 'dummy-team-id',
              position: 0,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-15',
              title: 'Compile Results',
              priority: 'medium' as const,
              column_id: 'post-sprint',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              team_id: 'dummy-team-id',
              position: 1,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-16',
              title: 'Plan Next Steps',
              priority: 'medium' as const,
              column_id: 'post-sprint',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              team_id: 'dummy-team-id',
              position: 2,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            }
          ];
          
          // Add handed-off tasks for any team that's not the Design team
          console.log('Current teamId:', teamId);
          if (teamId !== 'dummy-team-id') {
            console.log('Loading team with handed-off tasks for teamId:', teamId);
            
            // Add the handed-off task to the backlog
            tasksData.push({
              id: 'handoff-task-1',
              title: 'Design System Complete',
              description: 'Finished creating the complete design system with components, colors, and typography guidelines. Ready for development team to implement.',
              priority: 'high' as const,
              column_id: 'backlog',
              tags: ['Design', 'Complete', 'Handoff'],
              due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              team_id: teamId,
              position: 0,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' },
              handoff_status: 'handed_off',
              source_team_id: 'dummy-team-id'
            });
            
            // Add some additional tasks for non-Design teams
            if (teamId === 'dummy-dev-team') {
              tasksData.push(
                {
                  id: 'dev-task-1',
                  title: 'Set up Development Environment',
                  description: 'Configure development tools and environment for the project',
                  priority: 'high' as const,
                  column_id: 'todo',
                  tags: ['Setup', 'Development'],
                  due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                  team_id: teamId,
                  position: 0,
                  assignee: { name: 'Alex', avatar: '/placeholder-avatar.jpg' }
                },
                {
                  id: 'dev-task-2',
                  title: 'Implement User Authentication',
                  description: 'Build user login and registration functionality',
                  priority: 'medium' as const,
                  column_id: 'in-progress',
                  tags: ['Backend', 'Auth'],
                  due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                  created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                  team_id: teamId,
                  position: 0,
                  assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
                }
              );
            }
          }
        } else {
          console.log('Using real team data from database for team:', teamId);
          teamData = teamsData[0];
          
          // Extract columns from board template
          const boardTemplate = teamData.board_template;
          if (!boardTemplate || !boardTemplate.columns) {
            throw new Error('No board template found');
          }
          
          // Get tasks from database with assignee information
          const { data: dbTasksData, error: tasksError } = await supabase
            .from('tasks')
            .select(`
              id, title, description, priority, column_id, tags, due_date, created_at, position, team_id, 
              handoff_status, source_team_id, handoff_notes, handoff_requirements, handoff_at, status,
              assignee_id,
              users:assignee_id (id, name, email, avatar)
            `)
            .eq('team_id', teamData.id)
            .order('position', { ascending: true });
          
          if (tasksError) {
            console.error('Tasks error:', tasksError);
            throw new Error(`Tasks error: ${tasksError.message}`);
          }
          
          console.log('=== TASKS LOADED FROM DATABASE ===');
          console.log('Real tasks loaded:', { 
            count: dbTasksData?.length, 
            sample: dbTasksData?.[0],
            teamId: teamData.id,
            statusInfo: dbTasksData?.map(task => ({ id: task.id, title: task.title, column_id: task.column_id, status: task.status }))
          });
          console.log('Tasks with assignee info:', dbTasksData?.map(task => ({ 
            id: task.id, 
            title: task.title, 
            assignee_id: task.assignee_id, 
            assignee_user: task.users 
          })));
          console.log('===================================');
          
          // Transform database tasks to match UI expectations
          tasksData = (dbTasksData || []).map((task: any) => ({
            ...task,
            progress: '0/1', // Default progress
            assignee: task.users ? {
              name: task.users.name,
              avatar: task.users.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.users.name)}&background=ff6b35&color=ffffff&size=128`
            } : null // Use actual assignee data or null if no assignee
          }));
          
          console.log('Fetched tasks from database:', tasksData);
        }
        
        // Set columns data
        columnsData = teamData.board_template.columns.map((col: any, index: number) => ({
          id: col.id,
          name: col.name,
          color: col.color,
          position: col.order || index
        }));
        
        // Set current team for handoff functionality
        setCurrentTeam({
          id: teamData.id,
          name: teamData.name,
          type: teamData.type || 'other',
          color: teamData.color || '#3B82F6'
        });
        
        console.log('Columns data:', columnsData);
        console.log('Tasks data:', tasksData);
        console.log('Number of tasks:', tasksData.length);
        
        setColumns(columnsData);
        
        // Ensure unique tasks by ID to prevent React key conflicts
        const uniqueTasks = ensureUniqueTasks(tasksData);
        console.log('📊 Tasks loaded:', {
          originalCount: tasksData.length,
          uniqueCount: uniqueTasks.length,
          duplicatesRemoved: tasksData.length - uniqueTasks.length,
          taskIds: uniqueTasks.map(t => t.id),
          columnDistribution: uniqueTasks.reduce((acc, task) => {
            acc[task.column_id] = (acc[task.column_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        });
        setTasks(uniqueTasks);
        
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Comprehensive real-time subscription for all Kanban operations
  useEffect(() => {
    if (!currentTeam?.id) return;

    // Track processed events to avoid duplicates
    const processedEvents = new Set<string>();
    
    const channel = supabase
      .channel(`kanban-realtime-${currentTeam.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `team_id=eq.${currentTeam.id}`
        },
        (payload) => {
          const eventKey = `${payload.eventType}-${payload.new?.id || payload.old?.id}`;
          
          // Skip if we've already processed this event
          if (processedEvents.has(eventKey)) {
            console.log('Skipping duplicate real-time event:', eventKey);
            return;
          }
          
          processedEvents.add(eventKey);
          
          // Clean up old events after 5 seconds
          setTimeout(() => {
            processedEvents.delete(eventKey);
          }, 5000);
          
          console.log('Real-time task update:', payload.eventType, payload);
          setLastUpdate(new Date());
          
          if (payload.eventType === 'INSERT') {
            // New task created - refresh the entire task list to get assignee data
            console.log('Real-time INSERT: Refreshing task list for:', payload.new.title);
            
            // Refresh tasks with assignee data
            const refreshTasks = async () => {
              try {
                const { data: tasksData, error } = await supabase
                  .from('tasks')
                  .select(`
                    id, title, description, priority, column_id, tags, due_date, created_at, position, team_id, 
                    handoff_status, source_team_id, handoff_notes, handoff_requirements, handoff_at, status,
                    assignee_id,
                    users:assignee_id (id, name, email, avatar)
                  `)
                  .eq('team_id', currentTeam.id)
                  .order('position', { ascending: true });

                if (error) {
                  console.error('Error refreshing tasks:', error);
                  return;
                }

                const transformedTasks = tasksData.map(task => ({
                  ...task,
                  progress: '0/1',
                  assignee: task.users ? {
                    name: task.users.name,
                    avatar: task.users.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.users.name)}&background=ff6b35&color=ffffff&size=128`
                  } : null
                }));

                console.log('✅ Real-time: Refreshed tasks with assignee data:', transformedTasks.length, 'tasks');
                setTasks(ensureUniqueTasks(transformedTasks));
              } catch (err) {
                console.error('Error refreshing tasks:', err);
              }
            };

            refreshTasks();
          } else if (payload.eventType === 'UPDATE') {
            // Task updated (moved, edited, etc.) - preserve assignee info
            const updatedTask = payload.new as Task;
            console.log('✅ Updating task via real-time:', updatedTask.title);
            setTasks(prev => {
              const updatedTasks = prev.map(task => {
                if (task.id === updatedTask.id) {
                  // Preserve the assignee information from the existing task
                  return { 
                    ...task, 
                    ...updatedTask, 
                    assignee: task.assignee // Keep the existing assignee info
                  };
                }
                return task;
              });
              
              // Ensure uniqueness after update
              return ensureUniqueTasks(updatedTasks);
            });
          } else if (payload.eventType === 'DELETE') {
            // Task deleted
            const deletedTask = payload.old as Task;
            console.log('✅ Deleting task via real-time:', deletedTask.title);
            setTasks(prev => prev.filter(task => task.id !== deletedTask.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${currentTeam.id}`
        },
        (payload) => {
          console.log('Real-time team update:', payload);
          setLastUpdate(new Date());
          
          // Team's board_template was updated (columns added/edited/deleted)
          if (payload.new && payload.new.board_template) {
            const boardTemplate = payload.new.board_template;
            const templateColumns = boardTemplate.columns || [];
            
            if (templateColumns.length > 0) {
              const sortedColumns = templateColumns.sort((a: any, b: any) => a.order - b.order);
              const columnsData = sortedColumns.map((col: any, index: number) => ({
                id: col.id,
                name: col.name,
                color: col.color,
                position: col.order || index
              }));
              console.log('✅ Updating columns via real-time:', columnsData.map(c => c.name));
              setColumns(columnsData);
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Real-time subscription status:', status);
        if (err) {
          console.error('Real-time subscription error:', err);
          setRealtimeStatus('disconnected');
        } else {
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected');
            console.log('✅ Real-time connected successfully!');
          } else if (status === 'CHANNEL_ERROR') {
            setRealtimeStatus('disconnected');
          } else if (status === 'TIMED_OUT') {
            setRealtimeStatus('disconnected');
          }
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [currentTeam?.id]);

  // Fallback polling mechanism for real-time updates
  useEffect(() => {
    if (!currentTeam?.id) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data: latestTasks, error } = await supabase
          .from('tasks')
          .select(`
            id, title, description, priority, column_id, tags, due_date, created_at, position, team_id, 
            handoff_status, source_team_id, handoff_notes, handoff_requirements, handoff_at, status,
            assignee_id,
            users:assignee_id (id, name, email, avatar)
          `)
          .eq('team_id', currentTeam.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Polling error:', {
            error,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            teamId: currentTeam.id,
            timestamp: new Date().toISOString()
          });
          // Don't return early, just log the error and continue
          return;
        }

        if (latestTasks) {
          setTasks(prev => {
            // Transform tasks to include assignee data
            const transformedTasks = latestTasks.map(task => ({
              ...task,
              progress: '0/1',
              assignee: task.users ? {
                name: task.users.name,
                avatar: task.users.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.users.name)}&background=ff6b35&color=ffffff&size=128`
              } : null
            }));

            // Check for any changes in task positions or columns
            const hasChanges = transformedTasks.some(newTask => {
              const oldTask = prev.find(old => old.id === newTask.id);
              if (!oldTask) return true; // New task
              
              return (
                oldTask.column_id !== newTask.column_id ||
                oldTask.position !== newTask.position ||
                oldTask.updated_at !== newTask.updated_at
              );
            });
            
            if (hasChanges) {
              console.log('Polling detected changes, updating tasks with assignee data');
              return ensureUniqueTasks(transformedTasks);
            }
            
            return prev;
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [currentTeam?.id]);

  const refreshColumns = async () => {
    if (!currentTeam?.id) return;
    
    try {
      const { data: teamData, error } = await supabase
        .from('teams')
        .select('board_template')
        .eq('id', currentTeam.id)
        .single();

      if (error) throw error;

      const boardTemplate = teamData.board_template || {};
      const templateColumns = boardTemplate.columns || [];
      
      if (templateColumns.length > 0) {
        const sortedColumns = templateColumns.sort((a: any, b: any) => a.order - b.order);
        const columnsData = sortedColumns.map((col: any, index: number) => ({
          id: col.id,
          name: col.name,
          color: col.color,
          position: col.order || index
        }));
        setColumns(columnsData);
      }
    } catch (error) {
      console.error('Error refreshing columns:', error);
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !active) {
      setDropIndicator(null);
      return;
    }
    
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) {
      setDropIndicator(null);
      return;
    }
    
    const overId = over.id as string;
    const overTask = tasks.find(t => t.id === overId);
    
    // If we're over a task in a different column, show indicator
    if (overTask && overTask.column_id !== activeTask.column_id) {
      const targetColumnTasks = tasks
        .filter(task => task.column_id === overTask.column_id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      const targetIndex = targetColumnTasks.findIndex(task => task.id === overTask.id);
      
      setDropIndicator({
        columnId: overTask.column_id,
        position: targetIndex,
        show: true
      });
    }
    // If we're over a column (not a specific task), show indicator at the end
    else if (columns.some(col => col.id === overId) && overId !== activeTask.column_id) {
      const targetColumnTasks = tasks
        .filter(task => task.column_id === overId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      setDropIndicator({
        columnId: overId,
        position: targetColumnTasks.length,
        show: true
      });
    }
    // If we're over a task in the same column, show indicator for reordering
    else if (overTask && overTask.column_id === activeTask.column_id) {
      const columnTasks = tasks
        .filter(task => task.column_id === activeTask.column_id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      const targetIndex = columnTasks.findIndex(task => task.id === overTask.id);
      
      setDropIndicator({
        columnId: activeTask.column_id,
        position: targetIndex,
        show: true
      });
    }
    else {
      setDropIndicator(null);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Drag end event:', { active: active.id, over: over?.id });
    
    // Clear drop indicator
    setDropIndicator(null);
    
    if (!over) {
      setActiveTask(null);
      return;
    }
    
    // Check if we're reordering columns
    const activeColumn = columns.find(c => c.id === active.id);
    if (activeColumn) {
      console.log('Reordering columns');
      const overColumn = columns.find(c => c.id === over.id);
      if (overColumn && activeColumn.id !== overColumn.id) {
        const activeIndex = columns.findIndex(c => c.id === activeColumn.id);
        const overIndex = columns.findIndex(c => c.id === overColumn.id);
        
        const newColumns = arrayMove(columns, activeIndex, overIndex);
        
        // Update positions
        const updatedColumns = newColumns.map((col, index) => ({
          ...col,
          position: index,
          order: index // Also update the order field for database consistency
        }));
        
        // Update local state immediately for responsive UI
        setColumns(updatedColumns);
        console.log('Columns reordered locally:', updatedColumns.map(c => c.name));
        
        // Update database if we have a real team (not dummy data)
        if (currentTeam?.id && !currentTeam.id.startsWith('dummy-')) {
          try {
            console.log('Saving column order to database...');
            
            // Get current team data
            const { data: team, error: teamError } = await supabase
              .from("teams")
              .select("board_template")
              .eq("id", currentTeam.id)
              .single();

            if (teamError) throw teamError;

            const currentTemplate = team.board_template || {};
            
            // Update the columns in the board template with new order
            const updatedTemplate = {
              ...currentTemplate,
              columns: updatedColumns.map(col => ({
                id: col.id,
                name: col.name,
                color: col.color,
                order: col.position,
                isHandoffColumn: col.isHandoffColumn || false,
                targetTeamId: col.targetTeamId
              }))
            };

            // Save to database
            const { error: updateError } = await supabase
              .from("teams")
              .update({ 
                board_template: updatedTemplate,
                updated_at: new Date().toISOString()
              })
              .eq("id", currentTeam.id);

            if (updateError) throw updateError;

            console.log('✅ Column order saved to database successfully!');
            console.log('🔄 Real-time update will sync across all connected clients');
            
          } catch (err) {
            console.error('❌ Failed to save column order to database:', err);
            
            // Revert local state on error
            setColumns(columns);
            console.log('🔄 Reverted column order due to database error');
            
            // Show user-friendly error message
            alert('Failed to save column order. Please try again.');
          }
        } else {
          console.log('💡 Column reordering completed (dummy data - no database update needed)');
        }
      }
      return;
    }
    
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) {
      setActiveTask(null);
      return;
    }
    
    const overId = over.id as string;
    
    // Check if this is dummy data (no database update needed)
    // Real tasks have UUIDs, dummy tasks have 'task-' prefix
    const isDummyData = activeTask.id.startsWith('task-');
    
    console.log('Task type check:', {
      taskId: activeTask.id,
      isDummyData,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeTask.id)
    });
    
    // Check if we're reordering within the same column
    // For within-column reordering, we need to check if over.id is a task ID
    const overTask = tasks.find(t => t.id === overId);
    
    console.log('Drag analysis:', {
      activeTask: activeTask.id,
      overId,
      overTask: overTask?.id,
      isDummyData,
      activeColumn: activeTask.column_id,
      overColumn: overTask?.column_id
    });
    
    if (overTask && overTask.column_id === activeTask.column_id) {
      // This is within-column reordering
      console.log('Reordering within column:', activeTask.column_id);
      
      // Get the tasks in the current column, sorted by position
      const columnTasks = tasks
        .filter(task => task.column_id === activeTask.column_id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      const activeIndex = columnTasks.findIndex(task => task.id === activeTask.id);
      const overIndex = columnTasks.findIndex(task => task.id === overTask.id);
      
      // If we're dropping on the same task, do nothing
      if (activeIndex === overIndex) {
        setActiveTask(null);
        return;
      }
      
      console.log(`Moving task from position ${activeIndex} to ${overIndex}`);
      
      // Use arrayMove for better reordering
      const newTasks = arrayMove(columnTasks, activeIndex, overIndex);
      
      // Update positions
      const updatedTasks = newTasks.map((task, index) => ({
        ...task,
        position: index
      }));
      
      if (isDummyData) {
        // For dummy data, just update local state
        console.log('Updating dummy data with new positions');
        setTasks(prev => prev.map(task => {
          const updatedTask = updatedTasks.find(ut => ut.id === task.id);
          return updatedTask || task;
        }));
        setActiveTask(null);
        console.log('✅ Task reordering completed successfully!');
        console.log('💡 Note: Changes are saved locally. Apply database migration for persistence.');
        return;
      }
      
      // Update database for real data
      try {
        const updates = updatedTasks.map(task => ({
          id: task.id,
          position: task.position
        }));
        
        console.log('Attempting to update task positions:', updates);
        
        // Update position in database
        for (const update of updates) {
          console.log(`Updating task ${update.id} to position ${update.position}`);
          
          const { error: positionError } = await supabase
            .from('tasks')
            .update({ 
              position: update.position,
              updated_at: new Date().toISOString()
            })
            .eq('id', update.id);
          
          if (positionError) {
            console.error(`Error updating task ${update.id} position:`, positionError);
            throw positionError;
          } else {
            console.log(`Successfully updated task ${update.id} with position ${update.position}`);
          }
        }
        
        // Update local state
        setTasks(prev => prev.map(task => {
          const updatedTask = updatedTasks.find(ut => ut.id === task.id);
          return updatedTask || task;
        }));
        
        console.log('✅ Task reordering completed successfully!');
        console.log('🔄 Real-time update will sync across all connected clients');
        
      } catch (err) {
        console.error('Failed to reorder tasks - Raw error:', err);
        console.error('Failed to reorder tasks - Stringified:', JSON.stringify(err, null, 2));
        console.error('Failed to reorder tasks - Error message:', err?.message || 'No message');
        console.error('Failed to reorder tasks - Error details:', err?.details || 'No details');
        console.error('Failed to reorder tasks - Error code:', err?.code || 'No code');
        console.error('Failed to reorder tasks - Updates being made:', updates);
        console.error('Failed to reorder tasks - Active task:', activeTask);
        
        // Revert local state on error
        setTasks(prev => prev.map(task => 
          task.id === activeTask.id 
            ? { ...task, position: activeTask.position }
            : task
        ));
      }
      
      setActiveTask(null);
      return;
    }
    
    // Handle moving between columns
    // First check if we're dropping on a column (not a specific task) but want to insert between tasks
    const overColumnId = overId;
    const isColumnDrop = columns.some(col => col.id === overColumnId);
    
    if (isColumnDrop && overColumnId !== activeTask.column_id) {
      console.log('Moving task to column (between tasks):', activeTask.column_id, '->', overColumnId);
      
      // Get tasks in the target column, sorted by position
      const targetColumnTasks = tasks
        .filter(task => task.column_id === overColumnId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Insert at the end of the target column
      const targetIndex = targetColumnTasks.length;
      
      console.log(`Inserting task at position ${targetIndex} in column ${overColumnId}`);
      
      // Create new task order for target column
      const newTargetTasks = [...targetColumnTasks];
      newTargetTasks.push({ ...activeTask, column_id: overColumnId, position: targetIndex });
      
      // Update positions for all tasks in target column
      const updatedTargetTasks = newTargetTasks.map((task, index) => ({
        ...task,
        position: index
      }));
      
      if (isDummyData) {
        // For dummy data, update local state
        setTasks(prev => prev.map(task => {
          const updatedTask = updatedTargetTasks.find(ut => ut.id === task.id);
          if (updatedTask) return updatedTask;
          
          // If this is the moved task, update its column and position
          if (task.id === activeTask.id) {
            return { ...task, column_id: overColumnId, position: targetIndex };
          }
          
          return task;
        }));
        setActiveTask(null);
        console.log('✅ Cross-column task move completed successfully!');
        return;
      }
      
      // Update database for real data
      try {
        // Find the target column details to update status
        const targetColumn = columns.find(col => col.id === overColumnId);
        const newStatus = targetColumn ? {
          id: targetColumn.id,
          name: targetColumn.name,
          color: targetColumn.color,
          order: targetColumn.position || 0,
          isCompleted: targetColumn.name.toLowerCase().includes('done') || targetColumn.name.toLowerCase().includes('complete')
        } : {
          id: overColumnId,
          name: overColumnId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          color: '#6B7280',
          order: 0,
          isCompleted: false
        };

        console.log('🔄 Updating task status:', {
          taskId: activeTask.id,
          taskTitle: activeTask.title,
          fromColumn: activeTask.column_id,
          toColumn: overColumnId,
          newStatus: newStatus,
          targetColumn: targetColumn
        });

        // Update the moved task's column, position, and status
        const { error: moveError } = await supabase
          .from('tasks')
          .update({ 
            column_id: overColumnId,
            position: targetIndex,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeTask.id);
        
        if (moveError) throw moveError;
        
        // Update positions of other tasks in target column
        for (const task of updatedTargetTasks) {
          if (task.id !== activeTask.id) {
            const { error: positionError } = await supabase
              .from('tasks')
              .update({ 
                position: task.position,
                updated_at: new Date().toISOString()
              })
              .eq('id', task.id);
            
            if (positionError) {
              console.warn(`Failed to update position for task ${task.id}:`, positionError);
            }
          }
        }
        
        // Update local state
        setTasks(prev => prev.map(task => {
          const updatedTask = updatedTargetTasks.find(ut => ut.id === task.id);
          if (updatedTask) return updatedTask;
          
          // If this is the moved task, update its column, position, and status
          if (task.id === activeTask.id) {
            return { 
              ...task, 
              column_id: overColumnId, 
              position: targetIndex,
              status: newStatus
            };
          }
          
          return task;
        }));
        
        console.log('✅ Cross-column task move completed successfully!');
        console.log(`📊 Task status updated: ${activeTask.title} → ${newStatus.name} (${newStatus.color})`);
        console.log('🔄 Real-time update will sync across all connected clients');
        
        // Track task completion for streak
        if (newStatus.isCompleted && user?.id === activeTask.assignee_id && trackTaskCompletion) {
          await trackTaskCompletion(activeTask.id, true);
        }
        
      } catch (err) {
        console.error('Failed to move task between columns:', err);
        // Revert local state on error
        setTasks(prev => prev.map(task => 
          task.id === activeTask.id 
            ? { ...task, column_id: activeTask.column_id }
            : task
        ));
      }
      
      setActiveTask(null);
      return;
    }
    
    // Check if we're dropping on a task in a different column
    if (overTask && overTask.column_id !== activeTask.column_id) {
      console.log('Moving task between columns:', activeTask.column_id, '->', overTask.column_id);
      
      // Get tasks in the target column, sorted by position
      const targetColumnTasks = tasks
        .filter(task => task.column_id === overTask.column_id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Find the position where we want to insert the task
      const targetIndex = targetColumnTasks.findIndex(task => task.id === overTask.id);
      
      console.log(`Inserting task at position ${targetIndex} in column ${overTask.column_id}`);
      
      // Create new task order for target column
      const newTargetTasks = [...targetColumnTasks];
      newTargetTasks.splice(targetIndex, 0, { ...activeTask, column_id: overTask.column_id });
      
      // Update positions for all tasks in target column
      const updatedTargetTasks = newTargetTasks.map((task, index) => ({
        ...task,
        position: index
      }));
      
      if (isDummyData) {
        // For dummy data, update local state
        setTasks(prev => prev.map(task => {
          const updatedTask = updatedTargetTasks.find(ut => ut.id === task.id);
          if (updatedTask) return updatedTask;
          
          // If this is the moved task, update its column and position
          if (task.id === activeTask.id) {
            return { ...task, column_id: overTask.column_id, position: targetIndex };
          }
          
          return task;
        }));
        setActiveTask(null);
        console.log('✅ Cross-column task move completed successfully!');
        console.log('💡 Note: Changes are saved locally. Apply database migration for persistence.');
        return;
      }
      
      // Update database for real data
      try {
        // Find the target column details to update status
        const targetColumn = columns.find(col => col.id === overTask.column_id);
        const newStatus = targetColumn ? {
          id: targetColumn.id,
          name: targetColumn.name,
          color: targetColumn.color,
          order: targetColumn.position || 0,
          isCompleted: targetColumn.name.toLowerCase().includes('done') || targetColumn.name.toLowerCase().includes('complete')
        } : {
          id: overTask.column_id,
          name: overTask.column_id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          color: '#6B7280',
          order: 0,
          isCompleted: false
        };

        console.log('🔄 Updating task status (cross-column):', {
          taskId: activeTask.id,
          taskTitle: activeTask.title,
          fromColumn: activeTask.column_id,
          toColumn: overTask.column_id,
          newStatus: newStatus,
          targetColumn: targetColumn
        });

        // Update the moved task's column, position, and status
        const { error: moveError } = await supabase
          .from('tasks')
          .update({ 
            column_id: overTask.column_id,
            position: targetIndex,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeTask.id);
        
        if (moveError) throw moveError;
        
        // Update positions of other tasks in target column
        for (const task of updatedTargetTasks) {
          if (task.id !== activeTask.id) {
            const { error: positionError } = await supabase
              .from('tasks')
              .update({ 
                position: task.position,
                updated_at: new Date().toISOString()
              })
              .eq('id', task.id);
            
            if (positionError) {
              console.warn(`Failed to update position for task ${task.id}:`, positionError);
            }
          }
        }
        
        // Update local state
        setTasks(prev => prev.map(task => {
          const updatedTask = updatedTargetTasks.find(ut => ut.id === task.id);
          if (updatedTask) return updatedTask;
          
          // If this is the moved task, update its column, position, and status
          if (task.id === activeTask.id) {
            return { 
              ...task, 
              column_id: overTask.column_id, 
              position: targetIndex,
              status: newStatus
            };
          }
          
          return task;
        }));
        
        console.log('✅ Cross-column task move completed successfully!');
        console.log(`📊 Task status updated: ${activeTask.title} → ${newStatus.name} (${newStatus.color})`);
        console.log('🔄 Real-time update will sync across all connected clients');
        
        // Track task completion for streak
        if (newStatus.isCompleted && user?.id === activeTask.assignee_id && trackTaskCompletion) {
          await trackTaskCompletion(activeTask.id, true);
        }
        
      } catch (err) {
        console.error('Failed to move task between columns:', err);
        // Revert local state on error
        setTasks(prev => prev.map(task => 
          task.id === activeTask.id 
            ? { ...task, column_id: activeTask.column_id }
            : task
        ));
      }
      
      setActiveTask(null);
      return;
    }
    
  };

  const getTasksForColumn = (columnId: string) => {
    const filteredTasks = tasks
      .filter(task => task.column_id === columnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    console.log(`Tasks for column ${columnId}:`, filteredTasks);
    return filteredTasks;
  };

  const handleOpenTaskModal = (columnId?: string) => {
    setSelectedColumnId(columnId || null);
    setIsTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    console.log('handleTaskClick called for task:', task.title);
    setSelectedTask(task);
    setIsTaskDetailModalOpen(true);
    console.log('Modal should be open now');
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log('Updating task:', { taskId, updates });
      console.log('All tasks in state:', tasks.map(t => ({ id: t.id, title: t.title })));
      
      // Check if this is dummy data (no database update needed)
      const isDummyData = taskId.startsWith('task-');
      
      if (isDummyData) {
        console.log('Updating dummy data task - skipping database update');
        // For dummy data, just update local state
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, ...updates }
            : task
        ));
        return;
      }
      
      // Check if taskId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(taskId)) {
        console.error('Invalid task ID format:', taskId);
        throw new Error(`Invalid task ID format: ${taskId}. Expected UUID format.`);
      }

      console.log('Updating real database task');
      
      // Find the current task to get team_id
      const currentTask = tasks.find(task => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found in local state:', { taskId, availableTasks: tasks.map(t => t.id) });
        throw new Error(`Task with id ${taskId} not found in local state`);
      }
      
      console.log('Found current task:', currentTask);
      
      // Prepare update data with required fields
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Ensure team_id is included if not in updates
      if (!updateData.team_id && currentTask.team_id) {
        updateData.team_id = currentTask.team_id;
      }
      
      // Fix timestamp fields - convert empty strings to null
      if (updateData.due_date === '') {
        updateData.due_date = null;
      }
      
      // Remove any other empty string values that should be null
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
          // Only set to null for fields that can be null in the database
          if (['due_date', 'description'].includes(key)) {
            updateData[key] = null;
          }
        }
      });
      
      console.log('Update data:', updateData);
      console.log('Supabase client:', supabase);
      
      // Test Supabase connection first
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('tasks')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        throw new Error(`Supabase connection failed: ${testError.message}`);
      }
      
      console.log('Supabase connection test passed');
      
      // First, check if the task exists in the database
      const { data: existingTask, error: fetchError } = await supabase
        .from('tasks')
        .select('id, team_id')
        .eq('id', taskId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching task from database:', fetchError);
        throw new Error(`Task ${taskId} not found in database: ${fetchError.message}`);
      }
      
      console.log('Task exists in database:', existingTask);
      
      // Update task in database for real data
      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select();
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        // Try different ways to log the error
        console.error('Supabase update error - Raw error:', error);
        console.error('Supabase update error - Stringified:', JSON.stringify(error, null, 2));
        console.error('Supabase update error - Error message:', error?.message || 'No message');
        console.error('Supabase update error - Error details:', error?.details || 'No details');
        console.error('Supabase update error - Error hint:', error?.hint || 'No hint');
        console.error('Supabase update error - Error code:', error?.code || 'No code');
        console.error('Supabase update error - Task ID:', taskId);
        console.error('Supabase update error - Update data:', updateData);
        
        // Also try to get error properties
        const errorProps = Object.getOwnPropertyNames(error);
        console.error('Supabase update error - Error properties:', errorProps);
        
        throw error;
      }
      
      console.log('✅ Task updated successfully in database');
      console.log('🔄 Real-time update will sync across all connected clients');
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, ...updates }
          : task
      ));
      
    } catch (err) {
      console.error('Failed to update task:', {
        error: err,
        taskId,
        updates,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : undefined
      });
    }
  };

  const handleHandoff = async (taskId: string, handoffData: HandoffForm) => {
    try {
      console.log('TodoistKanban - handleHandoff called with:', { taskId, handoffData });
      console.log('TodoistKanban - handoffData type:', typeof handoffData);
      console.log('TodoistKanban - handoffData keys:', Object.keys(handoffData || {}));
      
      if (!handoffData || !handoffData.toTeamId) {
        console.error('Invalid handoff data:', handoffData);
        return;
      }
      
      const result = await HandoffService.handoffTask(taskId, handoffData);
      
      if (result.success) {
        console.log('Task handed off successfully');
        
        // For dummy data, simulate the handoff by removing the task from current board
        const isDummyData = taskId.startsWith('task-');
        if (isDummyData) {
          console.log('Removing handed off task from current board');
          setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
          
          // Show success message
          const targetTeamName = teams.find(t => t.id === handoffData.toTeamId)?.name || 'target team';
          alert(`Task handed off to ${targetTeamName} successfully!`);
        } else {
          // For real data, remove the task from current view since it moved to another team
          const targetTeamName = teams.find(t => t.id === handoffData.toTeamId)?.name || 'target team';
          
          // Ask user if they want to navigate to the target team's board
          const shouldNavigate = confirm(`Task handed off to ${targetTeamName} successfully!\n\nWould you like to view the ${targetTeamName} board?\n\n(You can also go to /teams to see all teams)`);
          
          if (shouldNavigate) {
            // Navigate to the target team's board
            window.location.href = `/team/${handoffData.toTeamId}`;
          }
          
          // Remove the task from current view since it moved to another team
          setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        }
      } else {
        console.error('Handoff failed:', result.error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error handing off task:', error);
    }
  };

  const handleTaskCreate = async (newTask: any) => {
    try {
      // Use the teamId from props, or fall back to user's teamId, or current team
      const effectiveTeamId = teamId || user?.teamId || currentTeam?.id;
      
      if (!effectiveTeamId) {
        throw new Error('No team ID available for task creation');
      }
      
      console.log('Creating task with team_id:', effectiveTeamId);
      
      // Find the target column details to set proper status
      const targetColumn = columns.find(col => col.id === (newTask.column_id || "backlog"));
      const initialStatus = targetColumn ? {
        id: targetColumn.id,
        name: targetColumn.name,
        color: targetColumn.color,
        order: targetColumn.position || 0,
        isCompleted: targetColumn.name.toLowerCase().includes('done') || targetColumn.name.toLowerCase().includes('complete')
      } : {
        id: newTask.column_id || "backlog",
        name: newTask.status || "Backlog",
        color: "#6B7280",
        order: 0,
        isCompleted: false
      };

      // Prepare task data for database
      const taskData = {
        title: newTask.title,
        description: newTask.description || null,
        status: initialStatus,
        priority: newTask.priority || 'medium',
        assignee_id: newTask.assignee_id || null, // Use the assignee_id from the task creation modal
        team_id: effectiveTeamId, // Use the effective team ID
        column_id: newTask.column_id || "backlog",
        position: newTask.position || 0, // Try to include position field
        tags: newTask.tags || [],
        attachments: [],
        comments: [],
        handoff_history: [],
        handoff_status: 'none',
        source_team_id: null,
        handoff_notes: null,
        handoff_requirements: [],
        handoff_at: null,
        due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
        completed_at: null
      };

      // Debug logging
      console.log('=== TASK CREATION DEBUG ===');
      console.log('New task from modal:', newTask);
      console.log('Assignee ID from modal:', newTask.assignee_id);
      console.log('Assignee name from modal:', newTask.assignee);
      console.log('Task data being inserted:', taskData);
      console.log('===========================');

      // Insert task into database
      console.log('Inserting task data:', taskData);
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('=== DATABASE INSERT ERROR ===');
        console.error('Error creating task:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('Task data that failed:', taskData);
        console.error('================================');
        alert(`Failed to create task: ${error.message}`);
        return;
      }

      console.log('=== TASK CREATED SUCCESSFULLY ===');
      console.log('✅ Task created successfully:', data.title);
      console.log('Created task data:', data);
      console.log('Assignee ID in created task:', data.assignee_id);
      console.log('🔄 Real-time update will sync across all connected clients');
      console.log('=================================');

      // Add the created task to local state - check for duplicates
      setTasks(prev => {
        const taskExists = prev.some(task => task.id === data.id);
        if (taskExists) {
          console.log('Task already exists in local state, skipping add:', data.id);
          return prev;
        }
        return [data, ...prev];
      });
      
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4">
            <LoaderOne />
          </div>
          <p className="text-gray-600">Loading Kanban board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 mb-2">Error loading board</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">

      {/* Kanban Board */}
        <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: 'always',
          },
        }}
      >
        <div className="p-6">
          <div className="flex space-x-6 pb-4">
            <SortableContext 
              items={columns.map(col => col.id)}
              strategy={horizontalListSortingStrategy}
            >
              {columns
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .map((column) => (
                  <SortableColumn
                    key={column.id}
                    column={column}
                    tasks={getTasksForColumn(column.id)}
                    getPriorityColor={getPriorityColor}
                    onAddTask={handleOpenTaskModal}
                    onTaskClick={handleTaskClick}
                    dropIndicator={dropIndicator}
                    onEditColumn={(column) => {
                      setSelectedColumn(column);
                      setIsDeleteMode(false);
                      setIsColumnEditModalOpen(true);
                    }}
                    onDeleteColumn={(column) => {
                      setSelectedColumn(column);
                      setIsDeleteMode(true);
                      setIsColumnEditModalOpen(true);
                    }}
                  />
                ))}
            </SortableContext>
            
            {/* Add Section Button */}
            <div className="flex-shrink-0 w-72 min-w-72">
              <Button
                variant="ghost" 
                className="w-full h-12 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
                onClick={() => setIsSectionModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add section
              </Button>
              
            </div>
          </div>
        </div>
      </DndContext>
      
      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedColumnId(null);
        }}
        onTaskCreate={handleTaskCreate}
        columnId={selectedColumnId || undefined}
      />

      {/* Section Creation Modal */}
      <SectionCreationModal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        teamId={teamId || user?.teamId || currentTeam?.id || ''}
        onSectionCreated={refreshColumns}
      />

      {/* Column Edit Modal */}
      <ColumnEditModal
        isOpen={isColumnEditModalOpen}
        onClose={() => {
          setIsColumnEditModalOpen(false);
          setSelectedColumn(null);
          setIsDeleteMode(false);
        }}
        teamId={teamId || user?.teamId || currentTeam?.id || ''}
        column={selectedColumn}
        onColumnUpdated={refreshColumns}
        onColumnDeleted={refreshColumns}
        initialDeleteMode={isDeleteMode}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isTaskDetailModalOpen}
        onClose={() => {
          setIsTaskDetailModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onTaskUpdate={handleTaskUpdate}
        onHandoff={handleHandoff}
        teams={teams}
        currentTeam={currentTeam}
      />

      {/* Streak Celebration Popup */}
      <StreakCelebrationPopup
        isOpen={showStreakPopup}
        onClose={closeStreakPopup}
        currentStreak={streakData.currentStreak}
        completedTasks={streakData.completedTasksToday}
      />
    </div>
  );
}

// Sortable Column Component
interface SortableColumnProps {
  column: Column;
  tasks: Task[];
  getPriorityColor: (priority: Task['priority']) => string;
  onAddTask: (columnId: string) => void;
  onTaskClick: (task: Task) => void;
  dropIndicator?: {
    columnId: string;
    position: number;
    show: boolean;
  } | null;
  onEditColumn: (column: any) => void;
  onDeleteColumn: (column: any) => void;
}

function SortableColumn({ column, tasks, getPriorityColor, onAddTask, onTaskClick, dropIndicator, onEditColumn, onDeleteColumn }: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: column.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-72 min-w-72 transition-all duration-200 ease-out ${
        isDragging ? 'opacity-60 scale-105' : ''
      }`}
      {...attributes}
    >
      <DroppableColumn
        column={column}
        tasks={(() => {
          const columnTasks = tasks.filter(task => task.column_id === column.id);
          console.log(`🔍 Column ${column.id} (${column.name}):`, {
            totalTasks: tasks.length,
            columnTasks: columnTasks.length,
            taskIds: columnTasks.map(t => t.id),
            duplicateCheck: columnTasks.filter((task, index, self) => 
              index !== self.findIndex(t => t.id === task.id)
            ).length
          });
          return columnTasks;
        })()}
        getPriorityColor={getPriorityColor}
        onAddTask={onAddTask}
        onTaskClick={onTaskClick}
        dropIndicator={dropIndicator}
        dragListeners={listeners}
        onEditColumn={onEditColumn}
        onDeleteColumn={onDeleteColumn}
      />
    </div>
  );
}

// Droppable Column Component
interface DroppableColumnProps {
  column: Column;
  tasks: Task[];
  getPriorityColor: (priority: Task['priority']) => string;
  onAddTask: (columnId: string) => void;
  onTaskClick: (task: Task) => void;
  dropIndicator?: {
    columnId: string;
    position: number;
    show: boolean;
  } | null;
  dragListeners?: any;
  onEditColumn: (column: any) => void;
  onDeleteColumn: (column: any) => void;
}

function DroppableColumn({ column, tasks, getPriorityColor, onAddTask, onTaskClick, dropIndicator, dragListeners, onEditColumn, onDeleteColumn }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex-shrink-0 w-72 min-w-72 transition-all duration-200 ease-out">
      {/* Column Header */}
      <div 
        className={`flex items-center justify-between mb-4 ${isDropdownOpen ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
        {...(isDropdownOpen ? {} : dragListeners)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 text-gray-400">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="2" cy="2" r="1"/>
              <circle cx="6" cy="2" r="1"/>
              <circle cx="10" cy="2" r="1"/>
              <circle cx="2" cy="6" r="1"/>
              <circle cx="6" cy="6" r="1"/>
              <circle cx="10" cy="6" r="1"/>
              <circle cx="2" cy="10" r="1"/>
              <circle cx="6" cy="10" r="1"/>
              <circle cx="10" cy="10" r="1"/>
            </svg>
          </div>
          <h3 className="font-medium text-gray-700">{column.name}</h3>
          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
            {tasks.length}
          </Badge>
        </div>
        <div 
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <DropdownMenu onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEditColumn(column);
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Column
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteColumn(column);
                }}
                className="text-red-600 focus:text-red-600 hover:text-red-600"
              >
                <User className="w-4 h-4 mr-2" />
                Delete Column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Column Tasks */}
      <div 
        ref={setNodeRef}
        className={`drop-zone task-list space-y-2 min-h-[500px] p-2 rounded-lg ${
          isOver 
            ? 'drag-over bg-blue-50 border-2 border-blue-300 border-dashed' 
            : 'hover:bg-gray-50'
        }`}
      >
        {(() => {
          // Deduplicate tasks within this column
          const uniqueTasks = tasks.filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          );
          
          return (
            <SortableContext 
              items={uniqueTasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {uniqueTasks.map((task, index) => (
            <React.Fragment key={task.id}>
              {/* Show drop indicator before this task if it matches the drop position */}
              {dropIndicator?.show && 
               dropIndicator.columnId === column.id && 
               dropIndicator.position === index && (
                <div className="drop-indicator active" />
              )}
              <SortableTaskItem
                task={task}
                priorityColor={getPriorityColor(task.priority)}
                onTaskClick={onTaskClick}
              />
            </React.Fragment>
              ))}
              {/* Show drop indicator at the end if position is at the end */}
              {dropIndicator?.show && 
               dropIndicator.columnId === column.id && 
               dropIndicator.position === uniqueTasks.length && (
                <div className="drop-indicator active" />
              )}
            </SortableContext>
          );
        })()}

        {/* Add Task Button */}
        <Button 
          variant="ghost" 
          className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-8 text-sm"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add task
        </Button>
      </div>
    </div>
  );
}

// Sortable Task Item Component
interface SortableTaskItemProps {
  task: Task;
  priorityColor: string;
  onTaskClick: (task: Task) => void;
}

function SortableTaskItem({ task, priorityColor, onTaskClick }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 1000 : 'auto',
  };

  // Track mouse movement to distinguish between click and drag
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
    setIsMouseDown(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseDownPos && isMouseDown) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPos.x, 2) + Math.pow(e.clientY - mouseDownPos.y, 2)
      );
      if (distance > 3) { // 3px threshold for movement detection
        setHasMoved(true);
      }
    }
  };

  const handleMouseUp = () => {
    // If no movement was detected, treat as click
    if (!hasMoved && isMouseDown) {
      onTaskClick(task);
    }
    
    // Reset states
    setHasMoved(false);
    setMouseDownPos(null);
    setIsMouseDown(false);
  };

  const handleMouseLeave = () => {
    // Reset states when mouse leaves the card
    setHasMoved(false);
    setMouseDownPos(null);
    setIsMouseDown(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`drag-item task-item bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-all duration-200 ${
        isDragging 
          ? 'dragging opacity-60 shadow-2xl border-blue-300 bg-blue-50 scale-105 cursor-grabbing' 
          : isMouseDown && hasMoved
            ? 'cursor-grabbing'
            : 'hover:shadow-md hover:scale-[1.02] cursor-pointer'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...attributes}
      {...listeners}
    >
      {/* Task Content */}
      <div className="flex items-start space-x-3">
        {/* Checkbox */}
        <div 
          className="flex-shrink-0 mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`w-4 h-4 rounded-full border-2 ${
            task.priority === 'urgent' ? 'border-red-500' : 'border-gray-300'
          } hover:border-blue-500 cursor-pointer`}></div>
        </div>
        
        {/* Task Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium text-gray-900 leading-5">
              {task.title}
            </h4>
          </div>
          
          {task.description && (
            <p className="text-xs text-gray-600 mt-1 leading-4">
              {task.description}
            </p>
          )}
          
          {/* Task Meta */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              {/* Progress */}
              {task.progress && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <span>{task.progress}</span>
                </div>
              )}
          
              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(task.due_date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Tags */}
              {task.tags.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-blue-100 text-blue-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  {task.tags[0]}
                </Badge>
              )}
              
              {/* Assignee Avatar */}
              {task.assignee ? (
                <div 
                  className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={task.assignee.avatar} />
                    <AvatarFallback className="text-xs">
                      {task.assignee.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div 
                  className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                  title="No assignee"
                >
                  <User className="w-3 h-3 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

