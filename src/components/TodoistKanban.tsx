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
  Settings
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TaskCreationModal } from "@/components/TaskCreationModal";
import { TaskDetailModal } from "@/components/TaskDetailModal";

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
}

export function TodoistKanban({ teamId }: TodoistKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    columnId: string;
    position: number;
    show: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get team data
        let teamsQuery = supabase
          .from('teams')
          .select('id, name, board_template');
        
        if (teamId) {
          teamsQuery = teamsQuery.eq('id', teamId);
        } else {
          teamsQuery = teamsQuery.limit(1);
        }
        
        const { data: teamsData, error: teamError } = await teamsQuery;
        
        console.log('Teams query result:', { teamsData, teamError, teamsLength: teamsData?.length });
        
        if (teamError) {
          console.error('Team error:', teamError);
          throw new Error(`Team error: ${teamError.message}`);
        }
        
        let teamData;
        let columnsData;
        let tasksData = [];
        
        if (!teamsData || teamsData.length === 0) {
          // Use dummy data when no teams found
          console.log('No teams found, using dummy data');
          
          // Dummy team data
          teamData = {
            id: 'dummy-team-id',
            name: 'Design Sprint',
            board_template: {
              columns: [
                { id: 'pre-sprint', name: 'Pre-sprint prep', color: '#6B7280', order: 0 },
                { id: 'day-by-day', name: 'Day-by-day prep', color: '#3B82F6', order: 1 },
                { id: 'post-sprint', name: 'Post-sprint prep', color: '#10B981', order: 2 }
              ]
            }
          };
          
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
              description: 'Determine the dates and dura...',
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
              title: 'Secure Resources',
              description: 'Arrange necessary resources ...',
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
        } else {
          console.log('Using real team data from database');
          teamData = teamsData[0];
          
          // Extract columns from board template
          const boardTemplate = teamData.board_template;
          if (!boardTemplate || !boardTemplate.columns) {
            throw new Error('No board template found');
          }
          
          // Get tasks from database
          const { data: dbTasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('id, title, description, priority, column_id, tags, due_date, created_at, position, team_id')
            .eq('team_id', teamData.id)
            .order('position', { ascending: true });
          
          if (tasksError) {
            console.error('Tasks error:', tasksError);
            throw new Error(`Tasks error: ${tasksError.message}`);
          }
          
          console.log('Real tasks loaded:', { 
            count: dbTasksData?.length, 
            sample: dbTasksData?.[0],
            teamId: teamData.id 
          });
          
          // Transform database tasks to match UI expectations
          tasksData = (dbTasksData || []).map((task: any) => ({
            ...task,
            progress: '0/1', // Default progress
            assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' } // Default assignee
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
        
        console.log('Columns data:', columnsData);
        console.log('Tasks data:', tasksData);
        
        setColumns(columnsData);
        setTasks(tasksData);
        
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          position: index
        }));
        
        setColumns(updatedColumns);
        console.log('Columns reordered:', updatedColumns.map(c => c.name));
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
        
        // Try to update position in database, fallback to timestamp only if column doesn't exist
        for (const update of updates) {
          console.log(`Updating task ${update.id} to position ${update.position}`);
          
          // First try to update with position
          const { error: positionError } = await supabase
            .from('tasks')
            .update({ 
              position: update.position,
              updated_at: new Date().toISOString()
            })
            .eq('id', update.id);
          
          if (positionError) {
            // If position column doesn't exist, just update timestamp
            if (positionError.message.includes('position') || positionError.message.includes('column')) {
              console.log(`Position column not found, updating timestamp only for task ${update.id}`);
              
              const { error: timestampError } = await supabase
                .from('tasks')
                .update({ 
                  updated_at: new Date().toISOString()
                })
                .eq('id', update.id);
              
              if (timestampError) {
                console.error(`Error updating task ${update.id}:`, timestampError);
                throw timestampError;
              }
            } else {
              console.error(`Error updating task ${update.id}:`, positionError);
              throw positionError;
            }
          } else {
            console.log(`Successfully updated task ${update.id} with position ${update.position}`);
          }
        }
        
        // Update local state
        setTasks(prev => prev.map(task => {
          const updatedTask = updatedTasks.find(ut => ut.id === task.id);
          return updatedTask || task;
        }));
        
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
        // Update the moved task's column and position
        const { error: moveError } = await supabase
          .from('tasks')
          .update({ 
            column_id: overColumnId,
            position: targetIndex,
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
          
          // If this is the moved task, update its column and position
          if (task.id === activeTask.id) {
            return { ...task, column_id: overColumnId, position: targetIndex };
          }
          
          return task;
        }));
        
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
        // Update the moved task's column and position
        const { error: moveError } = await supabase
          .from('tasks')
          .update({ 
            column_id: overTask.column_id,
            position: targetIndex,
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
          
          // If this is the moved task, update its column and position
          if (task.id === activeTask.id) {
            return { ...task, column_id: overTask.column_id, position: targetIndex };
          }
          
          return task;
        }));
        
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
      
      console.log('Task updated successfully in database');
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

  const handleTaskCreate = async (newTask: any) => {
    try {
      // Prepare task data for database
      const taskData = {
        title: newTask.title,
        description: newTask.description || null,
        status: {
          id: "1",
          name: newTask.status || "Backlog",
          color: "#6B7280",
          order: 0,
          isCompleted: false
        },
        priority: newTask.priority || 'medium',
        assignee_id: null, // TODO: Handle assignee mapping
        team_id: "56871b37-7999-44d7-b1f2-38e1acca86ad", // Design Team ID
        column_id: newTask.column_id || "backlog",
        position: newTask.position || 0, // Try to include position field
        tags: newTask.tags || [],
        attachments: [],
        comments: [],
        handoff_history: [],
        due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
        completed_at: null
      };

      // Insert task into database
      console.log('Inserting task data:', taskData);
      
      // First try with position field
      let { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      // If position column doesn't exist, try without it
      if (error && (error.message.includes('position') || error.message.includes('column'))) {
        console.log('Position column not found, creating task without position field');
        
        const taskDataWithoutPosition = { ...taskData };
        delete taskDataWithoutPosition.position;
        
        const result = await supabase
          .from('tasks')
          .insert([taskDataWithoutPosition])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error creating task:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Failed to create task: ${error.message}`);
        return;
      }

      console.log('Task created successfully:', data);

      // Add the created task to local state
      setTasks(prev => [data, ...prev]);
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">SLMobbin /</div>
            <h1 className="text-2xl font-semibold text-gray-900">Design Sprint</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Share className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

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
                  />
                ))}
            </SortableContext>
            
            {/* Add Section Button */}
            <div className="flex-shrink-0 w-72 min-w-72">
              <Button 
                variant="ghost" 
                className="w-full h-12 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
                onClick={() => handleOpenTaskModal()}
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

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isTaskDetailModalOpen}
        onClose={() => {
          setIsTaskDetailModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onTaskUpdate={handleTaskUpdate}
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
}

function SortableColumn({ column, tasks, getPriorityColor, onAddTask, onTaskClick, dropIndicator }: SortableColumnProps) {
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
        tasks={tasks}
        getPriorityColor={getPriorityColor}
        onAddTask={onAddTask}
        onTaskClick={onTaskClick}
        dropIndicator={dropIndicator}
        dragListeners={listeners}
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
}

function DroppableColumn({ column, tasks, getPriorityColor, onAddTask, onTaskClick, dropIndicator, dragListeners }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-shrink-0 w-72 min-w-72 transition-all duration-200 ease-out">
      {/* Column Header */}
      <div 
        className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing"
        {...dragListeners}
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
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <MoreHorizontal className="w-3 h-3" />
        </Button>
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
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task, index) => (
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
           dropIndicator.position === tasks.length && (
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
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('Mouse down on task:', task.title);
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
    
    // Clear any existing timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }
    
    // Set a timeout to detect if this is a click (not a drag)
    const timeout = setTimeout(() => {
      console.log('Click timeout triggered, hasMoved:', hasMoved);
      if (!hasMoved) {
        console.log('Opening modal for task:', task.title);
        onTaskClick(task);
      }
    }, 150); // 150ms delay
    
    setClickTimeout(timeout);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseDownPos) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPos.x, 2) + Math.pow(e.clientY - mouseDownPos.y, 2)
      );
      if (distance > 5) { // 5px threshold for movement detection
        console.log('Mouse moved, distance:', distance);
        setHasMoved(true);
        // Clear the click timeout when movement is detected
        if (clickTimeout) {
          clearTimeout(clickTimeout);
          setClickTimeout(null);
        }
      }
    }
  };

  const handleDragStart = () => {
    console.log('Drag started for task:', task.title);
    setHasMoved(true);
    // Clear the click timeout when drag starts
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
  };

  const handleDragEnd = () => {
    console.log('Drag ended for task:', task.title);
    // Reset states
    setHasMoved(false);
    setMouseDownPos(null);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`drag-item task-item bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging 
          ? 'dragging opacity-60 shadow-2xl border-blue-300 bg-blue-50 scale-105' 
          : 'hover:shadow-md hover:scale-[1.02]'
      }`}
      {...attributes}
      {...listeners}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
              <div 
                className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="w-5 h-5">
                  <AvatarImage src={task.assignee?.avatar} />
                  <AvatarFallback className="text-xs">
                    {task.assignee?.name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

