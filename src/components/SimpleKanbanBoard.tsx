"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Flag,
  Calendar,
  User,
  MessageSquare,
  Paperclip,
  GripVertical,
  Settings
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  column_id: string;
  tags: string[];
  due_date?: string;
  created_at: string;
}

interface Column {
  id: string;
  name: string;
  color: string;
}

export function SimpleKanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get team data
        const { data: teamsData, error: teamError } = await supabase
          .from('teams')
          .select('id, name, board_template')
          .limit(1);
        
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
            name: 'Sample Team',
            board_template: {
              columns: [
                { id: 'todo', name: 'To Do', color: '#3B82F6' },
                { id: 'in_progress', name: 'In Progress', color: '#F59E0B' },
                { id: 'review', name: 'Review', color: '#8B5CF6' },
                { id: 'done', name: 'Done', color: '#10B981' }
              ]
            }
          };
          
          // Dummy tasks data
          tasksData = [
            {
              id: 'task-1',
              title: 'Design new landing page',
              description: 'Create a modern, responsive landing page design',
              priority: 'high' as const,
              column_id: 'todo',
              tags: ['UI/UX', 'Landing Page'],
              due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            },
            {
              id: 'task-2',
              title: 'Mobile app wireframes',
              description: 'Design wireframes for the mobile application',
              priority: 'medium' as const,
              column_id: 'in_progress',
              tags: ['Mobile', 'Wireframes'],
              due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            },
            {
              id: 'task-3',
              title: 'API documentation',
              description: 'Create comprehensive API documentation',
              priority: 'high' as const,
              column_id: 'review',
              tags: ['API', 'Documentation'],
              due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            },
            {
              id: 'task-4',
              title: 'User authentication system',
              description: 'Implement secure user authentication',
              priority: 'urgent' as const,
              column_id: 'done',
              tags: ['Auth', 'Security'],
              due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            },
            {
              id: 'task-5',
              title: 'Database optimization',
              description: 'Optimize database queries for better performance',
              priority: 'medium' as const,
              column_id: 'todo',
              tags: ['Database', 'Performance'],
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            }
          ];
        } else {
          teamData = teamsData[0];
          
          // Extract columns from board template
          const boardTemplate = teamData.board_template;
          if (!boardTemplate || !boardTemplate.columns) {
            throw new Error('No board template found');
          }
          
          // Get tasks from database
          const { data: dbTasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('id, title, description, priority, column_id, tags, due_date, created_at')
            .eq('team_id', teamData.id)
            .order('created_at', { ascending: false });
          
          if (tasksError) {
            console.error('Tasks error:', tasksError);
            throw new Error(`Tasks error: ${tasksError.message}`);
          }
          
          tasksData = dbTasksData || [];
        }
        
        // Set columns data
        columnsData = teamData.board_template.columns.map((col: any) => ({
          id: col.id,
          name: col.name,
          color: col.color
        }));
        
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
    // We don't need to do anything during drag over
    // The visual feedback is handled by the drag and drop library
    // We'll handle the actual move in handleDragEnd
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }
    
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) {
      setActiveTask(null);
      return;
    }
    
    const overColumnId = over.id as string;
    
    // Don't do anything if dropped in the same column
    if (activeTask.column_id === overColumnId) {
      setActiveTask(null);
      return;
    }
    
    // Check if this is dummy data (no database update needed)
    const isDummyData = activeTask.id.startsWith('task-');
    
    if (isDummyData) {
      // For dummy data, just update local state
      setTasks(prev => prev.map(task => 
        task.id === activeTask.id 
          ? { ...task, column_id: overColumnId }
          : task
      ));
      setActiveTask(null);
      return;
    }
    
    // Update task in database for real data
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          column_id: overColumnId,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeTask.id);
      
      if (error) throw error;
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === activeTask.id 
          ? { ...task, column_id: overColumnId }
          : task
      ));
      
    } catch (err) {
      console.error('Failed to update task:', err);
      // Revert local state on error
      setTasks(prev => prev.map(task => 
        task.id === activeTask.id 
          ? { ...task, column_id: activeTask.column_id }
          : task
      ));
    }
    
    setActiveTask(null);
  };

  const getTasksForColumn = (columnId: string) => {
    return tasks.filter(task => task.column_id === columnId);
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div className="space-y-6">

      {/* Kanban Board */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            tasks={getTasksForColumn(column.id)}
            getPriorityColor={getPriorityColor}
          />
        ))}
        </div>
      </DndContext>
    </div>
  );
}

// Droppable Column Component
interface DroppableColumnProps {
  column: Column;
  tasks: Task[];
  getPriorityColor: (priority: Task['priority']) => string;
}

function DroppableColumn({ column, tasks, getPriorityColor }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header - Todoist Style */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-700">{column.name}</h3>
          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
            {tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Settings className="w-3 h-3" />
        </Button>
      </div>

      {/* Column Tasks - Todoist Style */}
      <div 
        ref={setNodeRef}
        className={`space-y-2 min-h-[500px] p-2 rounded-lg transition-colors ${
          isOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : ''
        }`}
      >
        <SortableContext 
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              priorityColor={getPriorityColor(task.priority)}
            />
          ))}
        </SortableContext>

        {/* Add Task Button */}
        <Button 
          variant="ghost" 
          className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-8 text-sm"
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
}

function SortableTaskItem({ task, priorityColor }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      {/* Task Content - Todoist Style */}
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        <div 
          className="flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <div className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600">
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
        </div>
        
        {/* Checkbox */}
        <div 
          className="flex-shrink-0 mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 hover:border-blue-500 cursor-pointer"></div>
        </div>
        
        {/* Task Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium text-gray-900 leading-5">
              {task.title}
            </h4>
            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
              <div className="w-4 h-4 text-gray-400">
                <GripVertical className="w-4 h-4" />
              </div>
            </div>
          </div>
          
          {task.description && (
            <p className="text-xs text-gray-600 mt-1 leading-4">
              {task.description}
            </p>
          )}
          
          {/* Task Meta - Todoist Style */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              {/* Progress */}
              {task.priority === 'urgent' && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <span>0/1</span>
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
                <User className="w-3 h-3 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
