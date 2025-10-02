"use client";

import React, { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClerkAvatar } from "@/components/ClerkAvatar";
import { 
  Plus, 
  Calendar,
  User,
  MoreHorizontal,
  Share,
  Eye,
  Settings,
  LogOut,
  ArrowRight,
  Columns3,
  BarChart4,
  Table
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useStreakTracking } from "@/hooks/useStreakTracking";
import { StreakCelebrationPopup } from "@/components/StreakCelebrationPopup";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Trash2, Edit } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { TaskCreationModal } from "@/components/TaskCreationModal";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { SectionCreationModal } from "@/components/SectionCreationModal";
import { ColumnEditModal } from "@/components/ColumnEditModal";
import { CalendarView } from "@/components/CalendarView";
import { GanttView } from "@/components/GanttView";
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
  assignee_id?: string;
  assignee_avatar?: string;
  handoff_status?: string;
  source_team_id?: string;
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
  const { streakData, showStreakPopup, closeStreakPopup, trackTaskCompletion } = useStreakTracking();
  
  // Helper function to ensure unique tasks by ID
  const ensureUniqueTasks = (tasks: Task[]): Task[] => {
    return tasks.filter((task, index, self) => 
      index === self.findIndex(t => t.id === task.id)
    );
  };
  
  // Debug user data - removed as user is not available in this component
  
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
  const [isAssigneeSheetOpen, setIsAssigneeSheetOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; avatar?: string }>>([]);
  const [currentView, setCurrentView] = useState<'kanban' | 'calendar' | 'gantt' | 'table'>('kanban');
  const { user } = useUser();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [user]);

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
        let columnsData: any[] = [];
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
              team_id: teamId || 'default-team',
              position: 0,
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
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
          
          // Get tasks from database
          const { data: dbTasksData, error: tasksError } = await supabase
            .from('tasks')
            .select(`
              id, title, description, priority, column_id, tags, due_date, created_at, position, team_id, 
              handoff_status, source_team_id, handoff_notes, handoff_requirements, handoff_at, status,
              assignee, assignee_id, assignee_avatar
            `)
            .eq('team_id', teamData.id)
            .order('created_at', { ascending: false });
          
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
          console.log('Tasks loaded:', dbTasksData?.map(task => ({ 
            id: task.id, 
            title: task.title, 
            column_id: task.column_id,
            status: task.status
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
          type: (teamData as any).type || 'other',
          color: (teamData as any).color || '#3B82F6'
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
    
    console.log('🔌 Setting up real-time subscription for team:', currentTeam.id);
    
    const channel = supabase
      .channel(`kanban-realtime-${currentTeam.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          const oldId = (payload.old as any)?.id;
          const newId = (payload.new as any)?.id;
          const eventKey = `${payload.eventType}-${newId || oldId || 'unknown'}`;
          const newTeamId = (payload.new as any)?.team_id;
          const oldTeamId = (payload.old as any)?.team_id;
          const taskTeamId = newTeamId || oldTeamId;
          
          console.log('🔍 Real-time event received:', {
            eventType: payload.eventType,
            eventKey,
            isDuplicate: processedEvents.has(eventKey),
            taskId: newId || oldId,
            taskTitle: (payload.new as any)?.title || (payload.old as any)?.title,
            taskTeamId,
            currentTeamId: currentTeam.id,
            timestamp: new Date().toISOString(),
            payload: payload,
            hasNew: !!payload.new,
            hasOld: !!payload.old
          });
          
          // Filter by team ID
          if (taskTeamId !== currentTeam.id) {
            console.log('⏭️ Skipping event for different team:', { taskTeamId, currentTeamId: currentTeam.id });
            return;
          }
          
          // Skip if we've already processed this event
          if (processedEvents.has(eventKey)) {
            console.log('⏭️ Skipping duplicate real-time event:', eventKey);
            return;
          }
          
          processedEvents.add(eventKey);
          
          // Clean up old events after 5 seconds
          setTimeout(() => {
            processedEvents.delete(eventKey);
          }, 5000);
          
          console.log('Real-time task update:', {
            eventType: payload.eventType,
            taskId: newId || oldId,
            taskTitle: (payload.new as any)?.title || (payload.old as any)?.title,
            payload: payload,
            teamId: currentTeam.id
          });
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
                    assignee, assignee_id, assignee_avatar
                  `)
                  .eq('team_id', currentTeam.id)
                  .order('created_at', { ascending: false });

                if (error) {
                  console.error('Error refreshing tasks:', error);
                  return;
                }

                const transformedTasks = tasksData.map((task: any) => ({
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
            console.log('✅ Deleting task via real-time:', {
              deletedTask,
              taskId: deletedTask?.id,
              taskTitle: deletedTask?.title,
              payloadOld: payload.old,
              payloadNew: payload.new
            });
            setTasks(prev => {
              const filteredTasks = prev.filter(task => task.id !== deletedTask.id);
              console.log('Tasks after deletion:', {
                beforeCount: prev.length,
                afterCount: filteredTasks.length,
                deletedTaskId: deletedTask.id
              });
              return filteredTasks;
            });
            
            // Also trigger a local state update to ensure consistency
            setLastUpdate(new Date());
          }
        }
      )
      .on('broadcast', { event: 'test' }, (payload) => {
        console.log('🧪 Real-time test message received:', payload);
      })
      .on('broadcast', { event: 'task-deleted' }, (payload) => {
        console.log('🗑️ Real-time task deletion broadcast received:', payload);
        // Force refresh tasks when deletion is broadcast
        if (payload.payload && payload.payload.taskId) {
          setTasks(prev => {
            const filteredTasks = prev.filter(task => task.id !== payload.payload.taskId);
            console.log('Broadcast deletion applied:', {
              beforeCount: prev.length,
              afterCount: filteredTasks.length,
              deletedTaskId: payload.payload.taskId
            });
            return filteredTasks;
          });
        }
      })
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
              console.log('✅ Updating columns via real-time:', columnsData.map((c: any) => c.name));
              setColumns(columnsData);
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Real-time subscription status:', {
          status,
          teamId: currentTeam.id,
          channelName: `kanban-realtime-${currentTeam.id}`,
          error: err
        });
        if (err) {
          console.error('Real-time subscription error:', {
            error: err,
            errorMessage: err?.message,
            errorCode: (err as any)?.code,
            teamId: currentTeam.id
          });
          setRealtimeStatus('disconnected');
        } else {
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected');
            console.log('✅ Real-time connected successfully!', {
              teamId: currentTeam.id,
              channelName: `kanban-realtime-${currentTeam.id}`
            });
            
            // Test the subscription by sending a test message
            console.log('🧪 Testing real-time subscription...');
            channel.send({
              type: 'broadcast',
              event: 'test',
              payload: { 
                message: 'Real-time test from client', 
                timestamp: Date.now(),
                userId: user?.id || 'unknown',
                teamId: currentTeam.id
              }
            });
            
            // Set up periodic real-time health check
            const healthCheckInterval = setInterval(() => {
              console.log('🏥 Real-time health check:', {
                status: realtimeStatus,
                teamId: currentTeam.id,
                timestamp: new Date().toISOString()
              });
            }, 30000); // Every 30 seconds
            
            // Clean up interval on unmount
            return () => {
              clearInterval(healthCheckInterval);
            };
          } else if (status === 'CHANNEL_ERROR') {
            setRealtimeStatus('disconnected');
            console.log('❌ Real-time channel error');
          } else if (status === 'TIMED_OUT') {
            setRealtimeStatus('disconnected');
            console.log('⏰ Real-time timed out');
          } else {
            console.log('🔄 Real-time status:', status);
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
        console.log('🔄 Polling for tasks...', { 
          teamId: currentTeam.id,
          supabaseInitialized: !!supabase
        });
        
        if (!supabase) {
          console.error('❌ Supabase client not initialized');
          return;
        }
        
        const { data: latestTasks, error } = await supabase
          .from('tasks')
          .select(`
            id, title, description, priority, column_id, tags, due_date, created_at, position, team_id, 
            handoff_status, source_team_id, handoff_notes, handoff_requirements, handoff_at, status,
            assignee, assignee_id, assignee_avatar
          `)
          .eq('team_id', currentTeam.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Polling error:', {
            error: error || 'No error object',
            errorMessage: error?.message || 'No error message',
            errorCode: error?.code || 'No error code',
            errorDetails: error?.details || 'No error details',
            errorHints: error?.hint || 'No error hints',
            teamId: currentTeam.id,
            timestamp: new Date().toISOString(),
            supabaseInitialized: !!supabase
          });
          return;
        }

        if (!latestTasks) {
          console.warn('⚠️ Polling returned null data:', { teamId: currentTeam.id });
          return;
        }

        if (latestTasks) {
          setTasks(prev => {
            // Check for any changes in task positions or columns
            const hasChanges = latestTasks.some((newTask: any) => {
              const oldTask = prev.find(old => old.id === newTask.id);
              if (!oldTask) return true; // New task
              
              return (
                oldTask.column_id !== newTask.column_id ||
                oldTask.position !== newTask.position ||
                (oldTask.created_at !== newTask.created_at) // Use created_at as proxy for updates since updated_at might not be in the interface
              );
            });
            
            if (hasChanges) {
              console.log('Polling detected changes, updating tasks');
              return ensureUniqueTasks(latestTasks);
            }
            
            return prev;
          });
        }
      } catch (err) {
        console.error('❌ Polling catch error:', {
          error: err,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorStack: err instanceof Error ? err.stack : 'No stack trace',
          teamId: currentTeam.id,
          timestamp: new Date().toISOString(),
          errorType: typeof err,
          errorStringified: JSON.stringify(err, null, 2)
        });
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
                order: col.position
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
        console.error('Failed to reorder tasks - Error message:', (err as any)?.message || 'No message');
        console.error('Failed to reorder tasks - Error details:', (err as any)?.details || 'No details');
        console.error('Failed to reorder tasks - Error code:', (err as any)?.code || 'No code');
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
        if (newStatus.isCompleted && trackTaskCompletion) {
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
        if (newStatus.isCompleted && trackTaskCompletion) {
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
    let filteredTasks = tasks
      .filter(task => task.column_id === columnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    
    // Filter by selected assignee if one is selected
    if (selectedAssignee) {
      if (selectedAssignee === 'unassigned') {
        filteredTasks = filteredTasks.filter(task => !task.assignee_id);
      } else {
        filteredTasks = filteredTasks.filter(task => task.assignee_id === selectedAssignee);
      }
    }
    
    console.log(`Tasks for column ${columnId}:`, filteredTasks);
    return filteredTasks;
  };

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      // Fetch all users from database
      const { data: dbUsers, error } = await supabase
        .from('users')
        .select('id, name, email, avatar')
        .order('name');
      
      if (error) {
        console.error('Error fetching users from database:', error);
        // Fallback to current user only
        if (user) {
          const currentUser = [{
            id: user.id,
            name: user.fullName || user.firstName || 'User',
            email: user.primaryEmailAddress?.emailAddress || 'user@example.com',
            avatar: user.imageUrl || undefined
          }];
          setUsers(currentUser);
        } else {
          setUsers([]);
        }
        return;
      }
      
      // Remove duplicates based on email (in case there are old entries)
      const uniqueUsers = dbUsers?.reduce((acc: any[], current: any) => {
        const existingUser = acc.find(user => user.email === current.email);
        if (!existingUser) {
          acc.push(current);
        }
        return acc;
      }, []) || [];
      
      console.log('Fetched unique users from database:', uniqueUsers);
      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      // Fallback to current user only
      if (user) {
        const currentUser = [{
          id: user.id,
          name: user.fullName || user.firstName || 'User',
          email: user.primaryEmailAddress?.emailAddress || 'user@example.com',
          avatar: user.imageUrl || undefined
        }];
        setUsers(currentUser);
      } else {
        setUsers([]);
      }
    }
  };

  // Get unique assignees from all tasks
  const getUniqueAssignees = () => {
    const assignees = new Set<string>();
    const unassignedCount = tasks.filter(task => !task.assignee_id).length;
    
    tasks.forEach(task => {
      if (task.assignee_id) {
        assignees.add(task.assignee_id);
      }
    });
    
    return {
      assignees: Array.from(assignees),
      unassignedCount
    };
  };

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : userId; // Fallback to ID if user not found
  };

  // Get user avatar by ID
  const getUserAvatar = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.avatar : null;
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
      // Use the teamId from props, or fall back to current team
      const effectiveTeamId = teamId || currentTeam?.id;
      
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
        assignee: newTask.assignee || null,
        assignee_id: newTask.assignee_id || null,
        assignee_avatar: newTask.assignee_avatar || null,
        team_id: effectiveTeamId, // Use the effective team ID
        column_id: newTask.column_id || "backlog",
        position: newTask.position || 0, // Position for drag-and-drop ordering
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
      console.log('Assignee from modal:', newTask.assignee);
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
      console.log('Created task ID:', data.id);
      console.log('🔄 Real-time update will sync across all connected clients');
      console.log('=================================');

      // Show success toast notification
      toast.success("Task created", {
        description: `Your task "${data.title}" has been created.`,
        action: {
          label: "View",
          onClick: () => {
            // Scroll to the task or open task detail modal
            console.log('View task clicked:', data.id);
          }
        }
      });

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

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    console.log('handleDeleteTask called with:', { taskId, taskTitle });
    try {
      // Create a custom confirmation dialog
      const confirmed = await new Promise<boolean>((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center';
        overlay.style.zIndex = '99999';
        overlay.style.pointerEvents = 'auto';
        overlay.style.position = 'fixed';
        
        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'bg-white/95 backdrop-blur-md rounded-xl p-6 max-w-md mx-4 shadow-2xl border border-white/20 relative';
        modal.style.pointerEvents = 'auto';
        modal.style.position = 'relative';
        modal.style.zIndex = '100000';
        modal.innerHTML = `
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">Delete Task</h3>
          </div>
          <p class="text-gray-600 mb-6">Are you sure you want to delete "<strong>${taskTitle}</strong>"? This action cannot be undone.</p>
          <div class="flex justify-end space-x-3">
            <button id="cancel-btn" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer border border-gray-200 relative z-20" style="pointer-events: auto;">
              Cancel
            </button>
            <button id="delete-btn" class="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors cursor-pointer border border-red-600 relative z-20" style="pointer-events: auto;">
              Delete
            </button>
          </div>
        `;
        
        overlay.appendChild(modal);
        
        // Add a style to prevent interaction with elements behind
        const style = document.createElement('style');
        style.textContent = `
          .modal-overlay-${Date.now()} {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 99999 !important;
            pointer-events: auto !important;
          }
        `;
        overlay.className += ` modal-overlay-${Date.now()}`;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        
        // Add event listeners after a small delay to ensure DOM is ready
        setTimeout(() => {
          const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;
          const deleteBtn = modal.querySelector('#delete-btn') as HTMLButtonElement;
          
          console.log('Found buttons:', { cancelBtn, deleteBtn });
        
        const cleanup = () => {
            if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
            }
            // Remove the style element
            const styleElement = document.head.querySelector(`style`);
            if (styleElement && styleElement.textContent?.includes('modal-overlay')) {
              document.head.removeChild(styleElement);
            }
          };
          
          if (cancelBtn) {
            const handleCancelClick = (e: Event) => {
              console.log('Cancel button clicked');
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
          cleanup();
          resolve(false);
            };
            cancelBtn.addEventListener('click', handleCancelClick);
            cancelBtn.addEventListener('mousedown', handleCancelClick);
          }
          
          if (deleteBtn) {
            const handleDeleteClick = (e: Event) => {
              console.log('Delete button clicked');
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
          cleanup();
          resolve(true);
            };
            deleteBtn.addEventListener('click', handleDeleteClick);
            deleteBtn.addEventListener('mousedown', handleDeleteClick);
          }
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            cleanup();
            resolve(false);
          }
        });
          
          // Prevent clicks from going through the modal
          modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Close on escape key
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            cleanup();
            resolve(false);
            document.removeEventListener('keydown', handleEscape);
          }
        };
        document.addEventListener('keydown', handleEscape);
        }, 10);
      });
      
      if (!confirmed) {
        return;
      }

      // Perform the actual deletion
      await performTaskDeletion(taskId, taskTitle);
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error("Failed to delete task", {
        description: "An unexpected error occurred."
      });
    }
  };


  const performTaskDeletion = async (taskId: string, taskTitle: string) => {
    try {
      console.log('Deleting task:', taskId);

      // Delete task from database
      console.log('🗑️ Attempting to delete task from database:', { taskId, taskTitle });
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('❌ Error deleting task from database:', {
          error,
          errorMessage: error.message,
          errorCode: error.code,
          taskId
        });
        toast.error("Failed to delete task", {
          description: error.message
        });
        return;
      }

      console.log('✅ Task deleted from database successfully');
      
      // Send broadcast message to notify other users
      console.log('📡 Broadcasting task deletion to other users...');
      const channel = supabase.channel(`kanban-realtime-${currentTeam?.id}`);
      await channel.send({
        type: 'broadcast',
        event: 'task-deleted',
        payload: { 
          taskId, 
          taskTitle,
          deletedBy: user?.id || 'unknown',
          timestamp: Date.now()
        }
      });
      console.log('✅ Task deletion broadcast sent successfully');
      
      // Update local state immediately for better UX
      setTasks(prev => {
        const filteredTasks = prev.filter(task => task.id !== taskId);
        console.log('Local state updated after deletion:', {
          beforeCount: prev.length,
          afterCount: filteredTasks.length,
          deletedTaskId: taskId
        });
        return filteredTasks;
      });
      
      console.log('🔄 Local state updated, waiting for real-time confirmation...');

      // Fallback: If real-time doesn't work within 2 seconds, update state manually
      setTimeout(() => {
        console.log('⏰ Real-time fallback: Manually updating state after 2 seconds');
        setTasks(prev => {
          const filteredTasks = prev.filter(task => task.id !== taskId);
          console.log('Fallback state update:', {
            beforeCount: prev.length,
            afterCount: filteredTasks.length,
            deletedTaskId: taskId
          });
          return filteredTasks;
        });
      }, 2000);

      // Show success toast
      toast.success("Task deleted", {
        description: `"${taskTitle}" has been deleted.`
      });

      console.log('✅ Task deleted successfully:', taskTitle);
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error("Failed to delete task", {
        description: "An unexpected error occurred."
      });
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
    <div className="flex-1 bg-gray-50 flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* View Switcher */}
            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
              <Button
                variant={currentView === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 px-3 rounded-none border-0 ${currentView === 'kanban' ? 'bg-[#EEF6FF] text-gray-900 hover:bg-[#EEF6FF]' : ''}`}
                onClick={() => setCurrentView('kanban')}
              >
                <div className="flex items-center space-x-1">
                  <Columns3 className="w-3 h-3" />
                  <span className="text-xs">Kanban</span>
                </div>
              </Button>
              <Button
                variant={currentView === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 px-3 rounded-none border-0 ${currentView === 'calendar' ? 'bg-[#EEF6FF] text-gray-900 hover:bg-[#EEF6FF]' : ''}`}
                onClick={() => setCurrentView('calendar')}
              >
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">Calendar</span>
                </div>
              </Button>
              <Button
                variant={currentView === 'gantt' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 px-3 rounded-none border-0 ${currentView === 'gantt' ? 'bg-[#EEF6FF] text-gray-900 hover:bg-[#EEF6FF]' : ''}`}
                onClick={() => setCurrentView('gantt')}
              >
                <div className="flex items-center space-x-1">
                  <BarChart4 className="w-3 h-3" />
                  <span className="text-xs">Gantt</span>
                </div>
              </Button>
              <Button
                variant={currentView === 'table' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 px-3 rounded-none border-0 ${currentView === 'table' ? 'bg-[#EEF6FF] text-gray-900 hover:bg-[#EEF6FF]' : ''}`}
                onClick={() => setCurrentView('table')}
              >
                <div className="flex items-center space-x-1">
                  <Table className="w-3 h-3" />
                  <span className="text-xs">Table</span>
                </div>
              </Button>
            </div>

            {/* Sort */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-gray-600 border-gray-200"
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 3a1 1 0 000 2h11.586l-4.293 4.293a1 1 0 101.414 1.414L16.414 7H18a1 1 0 100-2H3zM3 11a1 1 0 100 2h11.586l-4.293 4.293a1 1 0 101.414 1.414L16.414 15H18a1 1 0 100-2H3z" />
                  </svg>
                </div>
                <span>Sort</span>
              </div>
            </Button>

            {/* Filter */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-gray-600 border-gray-200"
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Filter</span>
              </div>
            </Button>

            {/* Closed */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-gray-600 border-gray-200"
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Closed</span>
              </div>
            </Button>

            {/* Assignee */}
            <Sheet open={isAssigneeSheetOpen} onOpenChange={setIsAssigneeSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 px-3 border-gray-200 ${
                    selectedAssignee 
                      ? 'text-blue-600 border-blue-300 bg-blue-50' 
                      : 'text-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </div>
                    <span>Assignee</span>
                    {selectedAssignee && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader className="px-6">
                  <SheetTitle>Assignees</SheetTitle>
                </SheetHeader>
                <div className="mt-6 px-6">
                  {/* Search */}
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by user or team"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* People Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">People {getUniqueAssignees().assignees.length + (getUniqueAssignees().unassignedCount > 0 ? 1 : 0)}</h3>
                    <div className="space-y-2">
                      {/* Unassigned */}
                      {getUniqueAssignees().unassignedCount > 0 && (
                        <div 
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50 ${
                            selectedAssignee === 'unassigned' ? 'bg-blue-50 border border-blue-200' : ''
                          }`}
                          onClick={() => setSelectedAssignee(selectedAssignee === 'unassigned' ? null : 'unassigned')}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Unassigned</div>
                              <div className="text-xs text-gray-500">{getUniqueAssignees().unassignedCount}</div>
                            </div>
                          </div>
                          <div className={`w-4 h-4 border-2 rounded ${
                            selectedAssignee === 'unassigned' ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}>
                            {selectedAssignee === 'unassigned' && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Assigned Users */}
                      {getUniqueAssignees().assignees.map((assigneeId) => {
                        const assigneeTasks = tasks.filter(task => task.assignee_id === assigneeId);
                        const assigneeName = getUserName(assigneeId);
                        const assigneeAvatar = getUserAvatar(assigneeId);
                        const initials = assigneeName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
                        
                        return (
                          <div 
                            key={assigneeId}
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50 ${
                              selectedAssignee === assigneeId ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                            onClick={() => setSelectedAssignee(selectedAssignee === assigneeId ? null : assigneeId)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                                {assigneeAvatar ? (
                                  <img 
                                    src={assigneeAvatar} 
                                    alt={assigneeName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <span className="text-white text-sm font-medium" style={{ display: assigneeAvatar ? 'none' : 'flex' }}>
                                  {initials}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{assigneeName}</div>
                                <div className="text-xs text-gray-500">{assigneeTasks.length}</div>
                              </div>
                            </div>
                            <div className={`w-4 h-4 border-2 rounded ${
                              selectedAssignee === assigneeId ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                            }`}>
                              {selectedAssignee === assigneeId && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Teams Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Teams 0</h3>
                    <div className="text-sm text-gray-500">No teams available</div>
                  </div>

                  {/* Footer */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-600">Assigned comments</span>
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex items-center">
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* N Icon */}
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">N</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Button>

            {/* Customize */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-gray-600 border-gray-200"
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Customize</span>
              </div>
            </Button>

            {/* Add Task */}
            <Button
              size="sm"
              className="h-8 px-3 text-white hover:opacity-90"
              style={{ backgroundColor: '#990FFA' }}
              onClick={() => handleOpenTaskModal(undefined)}
            >
              <div className="flex items-center space-x-2">
                <span>Add Task</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Dynamic View Content */}
      <div className="flex-1 overflow-auto">
        {/* Kanban View */}
        {currentView === 'kanban' && (
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
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
                        onDeleteTask={handleDeleteTask}
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
        )}

        {/* Calendar View */}
        {currentView === 'calendar' && (
          <div className="h-full">
            <CalendarView 
              tasks={tasks as any}
              onTaskClick={handleTaskClick as any}
              onAddTask={handleOpenTaskModal}
            />
          </div>
        )}

        {/* Gantt View */}
        {currentView === 'gantt' && (
          <div className="h-full">
            <GanttView 
              tasks={tasks as any}
              onTaskClick={handleTaskClick as any}
              onAddTask={handleOpenTaskModal}
            />
          </div>
        )}

        {/* Table View */}
        {currentView === 'table' && (
          <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleTaskClick(task)}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500">{task.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {columns.find(col => col.id === task.column_id)?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.assignee ? (
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                                <User className="w-3 h-3 text-gray-600" />
                              </div>
                              {typeof task.assignee === 'object' ? task.assignee.name : task.assignee}
                            </div>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      
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
        teamId={teamId || currentTeam?.id || ''}
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
        teamId={teamId || currentTeam?.id || ''}
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
        onDelete={(taskId, taskTitle) => handleDeleteTask(taskId, taskTitle)}
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
  onDeleteTask: (taskId: string, taskTitle: string) => void;
  dropIndicator?: {
    columnId: string;
    position: number;
    show: boolean;
  } | null;
  onEditColumn: (column: any) => void;
  onDeleteColumn: (column: any) => void;
}

function SortableColumn({ column, tasks, getPriorityColor, onAddTask, onTaskClick, onDeleteTask, dropIndicator, onEditColumn, onDeleteColumn }: SortableColumnProps) {
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
        tasks=        {(() => {
          const columnTasks = tasks.filter(task => task.column_id === column.id);
          
          // Sort tasks to prioritize handed-off tasks at the top
          const sortedTasks = columnTasks.sort((a, b) => {
            const aIsHandover = a.handoff_status === 'handed_off' || a.handoff_status === 'accepted' || a.source_team_id;
            const bIsHandover = b.handoff_status === 'handed_off' || b.handoff_status === 'accepted' || b.source_team_id;
            
            // Handed-off tasks come first
            if (aIsHandover && !bIsHandover) return -1;
            if (!aIsHandover && bIsHandover) return 1;
            
            // Within each group, sort by creation date (newest first)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          
          console.log(`🔍 Column ${column.id} (${column.name}):`, {
            totalTasks: tasks.length,
            columnTasks: sortedTasks.length,
            taskIds: sortedTasks.map(t => t.id),
            handoverTasks: sortedTasks.filter(t => t.handoff_status === 'handed_off' || t.handoff_status === 'accepted' || t.source_team_id).length,
            duplicateCheck: sortedTasks.filter((task, index, self) => 
              index !== self.findIndex(t => t.id === task.id)
            ).length
          });
          return sortedTasks;
        })()}
        getPriorityColor={getPriorityColor}
        onAddTask={onAddTask}
        onTaskClick={onTaskClick}
        onDeleteTask={onDeleteTask}
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
  onDeleteTask: (taskId: string, taskTitle: string) => void;
  dropIndicator?: {
    columnId: string;
    position: number;
    show: boolean;
  } | null;
  dragListeners?: any;
  onEditColumn: (column: any) => void;
  onDeleteColumn: (column: any) => void;
}

function DroppableColumn({ column, tasks, getPriorityColor, onAddTask, onTaskClick, onDeleteTask, dropIndicator, dragListeners, onEditColumn, onDeleteColumn }: DroppableColumnProps) {
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
        <SortableContext 
          items={tasks.filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          ).map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          ).map((task, index) => (
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
                onDeleteTask={onDeleteTask}
              />
            </React.Fragment>
          ))}
          {/* Show drop indicator at the end if position is at the end */}
          {dropIndicator?.show && 
           dropIndicator.columnId === column.id && 
           dropIndicator.position === tasks.filter((task, index, self) => 
             index === self.findIndex(t => t.id === task.id)
           ).length && (
            <div className="drop-indicator active" />
          )}
        </SortableContext>

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
  onDeleteTask: (taskId: string, taskTitle: string) => void;
}

function SortableTaskItem({ task, priorityColor, onTaskClick, onDeleteTask }: SortableTaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);
  
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

  const handleMouseUp = (e: React.MouseEvent) => {
    // Check if the click was on the menu or menu trigger
    const target = e.target as HTMLElement;
    const isMenuClick = target.closest('[data-dropdown-menu]') || 
                       target.closest('[data-dropdown-trigger]') ||
                       target.closest('.dropdown-menu') ||
                       target.closest('[role="menuitem"]');
    
    // If no movement was detected and it's not a menu click, treat as task click
    if (!hasMoved && isMouseDown && !isMenuClick) {
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
      className={`drag-item task-item bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-all duration-200 relative ${
        isDragging 
          ? 'dragging opacity-60 shadow-2xl border-blue-300 bg-blue-50 scale-105 cursor-grabbing' 
          : isMouseDown && hasMoved
            ? 'cursor-grabbing'
            : 'hover:shadow-md hover:scale-[1.02] cursor-pointer'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          setHoverTimeout(null);
        }
        setIsHovered(true);
      }}
      onMouseLeave={(e) => {
        handleMouseLeave();
        // Only hide if we're not moving to the menu
        if (!e.relatedTarget || !(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) {
          const timeout = setTimeout(() => {
            if (!isMenuOpen) {
              setIsHovered(false);
            }
          }, 100);
          setHoverTimeout(timeout);
        }
      }}
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
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 min-w-0 flex-1">
                {(() => {
                  const hasHandover = task.handoff_status === 'handed_off' || task.handoff_status === 'accepted' || task.source_team_id;
                  const totalBadges = (hasHandover ? 1 : 0) + task.tags.length;
                  
                  // If we have handover badge, hide other badges and show total count
                  if (hasHandover) {
                    const hiddenBadges = task.tags.length;
                    return (
                      <>
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-orange-100 text-orange-700 border-orange-200 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Handover
                        </Badge>
                        {hiddenBadges > 0 && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-gray-100 text-gray-600 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            +{hiddenBadges}
                          </Badge>
                        )}
                      </>
                    );
                  }
                  
                  // If no handover badge, show tags normally
                  return (
                    <>
                      {task.tags.length > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-blue-100 text-blue-700 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {task.tags[0]}
                        </Badge>
                      )}
                      {task.tags.length > 1 && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-gray-100 text-gray-600 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          +{task.tags.length - 1}
                        </Badge>
                      )}
                    </>
                  );
                })()}
              </div>
              
              {/* Assignee Avatar - Always visible on the right */}
              <div className="flex-shrink-0 ml-2">
                {task.assignee || task.assignee_avatar ? (
                  <div 
                    className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ClerkAvatar
                      assigneeId={task.assignee_id}
                      assigneeName={typeof task.assignee === 'object' ? task.assignee?.name : task.assignee}
                      assigneeAvatar={task.assignee_avatar}
                      className="w-5 h-5"
                      size="sm"
                    />
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

      {/* Hover Menu */}
      {isHovered && (
        <div 
          className="absolute top-2 right-2 z-10"
          data-dropdown-menu
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            // Keep menu open when hovering over it
            if (!isMenuOpen) {
              setIsHovered(false);
            }
          }}
        >
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100"
                data-dropdown-trigger
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" data-dropdown-content>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement edit functionality
                  console.log('Edit task:', task.id);
                }}
                className="cursor-pointer"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(task.id, task.title);
                  setIsMenuOpen(false);
                }}
                className="cursor-pointer text-red-600 focus:text-red-600 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

