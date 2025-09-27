"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Calendar,
  User,
  GripVertical,
  MoreHorizontal,
  Share,
  Eye,
  Settings
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TaskCreationModal } from "@/components/TaskCreationModal";

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
  assignee?: {
    name: string;
    avatar?: string;
  };
}

interface Column {
  id: string;
  name: string;
  color: string;
}

export function TodoistKanban() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

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
            name: 'Design Sprint',
            board_template: {
              columns: [
                { id: 'pre-sprint', name: 'Pre-sprint prep', color: '#6B7280' },
                { id: 'day-by-day', name: 'Day-by-day prep', color: '#3B82F6' },
                { id: 'post-sprint', name: 'Post-sprint prep', color: '#10B981' }
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
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-14',
              title: 'Schedule User Testing',
              priority: 'medium' as const,
              column_id: 'post-sprint',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-15',
              title: 'Compile Results',
              priority: 'medium' as const,
              column_id: 'post-sprint',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
            },
            {
              id: 'task-16',
              title: 'Plan Next Steps',
              priority: 'medium' as const,
              column_id: 'post-sprint',
              tags: ['Sprint'],
              created_at: new Date().toISOString(),
              assignee: { name: 'Sam', avatar: '/placeholder-avatar.jpg' }
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
        team_id: "team-1", // TODO: Get from user context
        column_id: newTask.column_id || "pre-sprint",
        tags: newTask.tags || [],
        attachments: [],
        comments: [],
        handoff_history: [],
        due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
        completed_at: null
      };

      // Insert task into database
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return;
      }

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
      >
        <div className="p-6">
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {columns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                tasks={getTasksForColumn(column.id)}
                getPriorityColor={getPriorityColor}
                onAddTask={() => setIsTaskModalOpen(true)}
              />
            ))}
            
            {/* Add Section Button */}
            <div className="flex-shrink-0 w-80">
              <Button 
                variant="ghost" 
                className="w-full h-12 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
                onClick={() => setIsTaskModalOpen(true)}
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
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreate={handleTaskCreate}
      />
    </div>
  );
}

// Droppable Column Component
interface DroppableColumnProps {
  column: Column;
  tasks: Task[];
  getPriorityColor: (priority: Task['priority']) => string;
  onAddTask: () => void;
}

function DroppableColumn({ column, tasks, getPriorityColor, onAddTask }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
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
          onClick={onAddTask}
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
      {/* Task Content */}
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
