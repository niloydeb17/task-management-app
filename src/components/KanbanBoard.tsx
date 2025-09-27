"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  User, 
  Flag,
  MessageSquare,
  Paperclip,
  GripVertical
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: {
    id: string;
    name: string;
    color: string;
    order: number;
    isCompleted: boolean;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id?: string;
  team_id: string;
  column_id: string;
  tags: string[];
  attachments: any[];
  comments: any[];
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface Column {
  id: string;
  name: string;
  order: number;
  color: string;
  isHandoffColumn: boolean;
  targetTeamId?: string;
}

interface KanbanBoardProps {
  teamId?: string;
}

export function KanbanBoard({ teamId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Fetch tasks and columns
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get team data and columns
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id, name, board_template')
          .limit(1)
          .single();
        
        if (teamError) {
          console.error('Team fetch error:', teamError);
          throw new Error(`Failed to fetch team: ${teamError.message}`);
        }
        
        if (!teamData) {
          throw new Error('No team data found');
        }
        
        const currentTeamId = teamId || teamData.id;
        const boardTemplate = teamData.board_template;
        
        if (!boardTemplate || !boardTemplate.columns) {
          throw new Error('No board template found for team');
        }
        
        const columnsData = boardTemplate.columns || [];
        console.log('Columns data:', columnsData);
        setColumns(columnsData);
        
        // Get tasks for this team
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('team_id', currentTeamId)
          .order('created_at', { ascending: false });
        
        if (tasksError) {
          console.error('Tasks fetch error:', tasksError);
          throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
        }
        
        console.log('Tasks data:', tasksData);
        setTasks(tasksData || []);
        
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;
    
    const overColumnId = over.id as string;
    
    // If dragging over a different column, update the task's column_id
    if (activeTask.column_id !== overColumnId) {
      setTasks(prev => prev.map(task => 
        task.id === activeTask.id 
          ? { ...task, column_id: overColumnId }
          : task
      ));
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }
    
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;
    
    const overColumnId = over.id as string;
    
    // Update task in database
    try {
      // Find the target column details to update status
      const targetColumn = columns.find(col => col.id === overColumnId);
      const newStatus = targetColumn ? {
        id: targetColumn.id,
        name: targetColumn.name,
        color: targetColumn.color,
        order: 0,
        isCompleted: targetColumn.name.toLowerCase().includes('done') || targetColumn.name.toLowerCase().includes('complete')
      } : {
        id: overColumnId,
        name: overColumnId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        color: '#6B7280',
        order: 0,
        isCompleted: false
      };

      const { error } = await supabase
        .from('tasks')
        .update({ 
          column_id: overColumnId,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeTask.id);
      
      if (error) throw error;
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === activeTask.id 
          ? { ...task, column_id: overColumnId, status: newStatus }
          : task
      ));
      
      console.log('✅ Task moved successfully!');
      console.log(`📊 Task status updated: ${activeTask.title} → ${newStatus.name} (${newStatus.color})`);
      
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

  // Get tasks for a specific column
  const getTasksForColumn = (columnId: string) => {
    return tasks.filter(task => task.column_id === columnId);
  };

  // Get priority color
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

  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow-600 text-2xl">📋</span>
          </div>
          <p className="text-gray-600 mb-2">No board template found</p>
          <p className="text-gray-500 text-sm">Please check your team configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kanban Board</h2>
          <p className="text-gray-600">Drag and drop tasks between columns</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Kanban Board */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {columns.map((column) => {
            const columnTasks = getTasksForColumn(column.id);
            
            return (
              <div key={column.id} className="space-y-4">
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: column.color }}
                    ></div>
                    <h3 className="font-semibold text-gray-900">{column.name}</h3>
                    <Badge variant="secondary">{columnTasks.length}</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                {/* Column Tasks */}
                <div className="space-y-3 min-h-[400px] p-2 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
                  <SortableContext 
                    items={columnTasks.map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnTasks.map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        priorityColor={getPriorityColor(task.priority)}
                      />
                    ))}
                  </SortableContext>

                  {/* Empty State */}
                  {columnTasks.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </div>
                        <p className="text-sm">Drop tasks here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DndContext>
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
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {task.title}
          </CardTitle>
          <div className="flex items-center space-x-1 ml-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${priorityColor}`}
            >
              <Flag className="w-3 h-3 mr-1" />
              {task.priority}
            </Badge>
            <div className="w-4 h-4 text-gray-400 cursor-grab">
              <GripVertical className="w-4 h-4" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
        
        {/* Task Meta */}
        <div className="space-y-2">
          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{task.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Task Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              {task.assignee_id && (
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>Assigned</span>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {task.comments.length > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{task.comments.length}</span>
                </div>
              )}
              {task.attachments.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Paperclip className="w-3 h-3" />
                  <span>{task.attachments.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar for In Progress Tasks */}
          {(task.status.name === 'In Progress' || task.status.name === 'in_progress') && (
            <div className="mt-2">
              <Progress value={Math.random() * 100} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
