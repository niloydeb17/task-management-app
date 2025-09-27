"use client";

import { useState } from "react";
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
  ArrowRight,
  Clock
} from "lucide-react";
import { Task, Column } from "@/types";

interface TeamBoardProps {
  teamId: string;
  teamName: string;
  columns: Column[];
  tasks: Task[];
  onTaskMove?: (taskId: string, newColumnId: string) => void;
  onTaskCreate?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function TeamBoard({ 
  teamId, 
  teamName, 
  columns, 
  tasks, 
  onTaskMove, 
  onTaskCreate 
}: TeamBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const getTasksForColumn = (columnId: string) => {
    return tasks.filter(task => task.columnId === columnId);
  };

  const isBacklogColumn = (column: Column) => {
    return column.id === 'backlog' || column.name.toLowerCase() === 'backlog';
  };

  const isHandoffTask = (task: Task) => {
    return task.handoffStatus === 'handed_off' || task.handoffStatus === 'accepted' || task.sourceTeamId;
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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedTask && onTaskMove) {
      onTaskMove(draggedTask, columnId);
    }
    setDraggedTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{teamName} Board</h2>
          <p className="text-gray-600">Manage your team's tasks and workflow</p>
        </div>
        <Button onClick={() => onTaskCreate?.({
          title: 'New Task',
          description: '',
          status: { id: '1', name: 'Backlog', color: '#6B7280', order: 0, isCompleted: false },
          priority: 'medium',
          teamId,
          columnId: columns[0]?.id || '',
          tags: [],
          attachments: [],
          comments: [],
          handoffHistory: []
        })}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksForColumn(column.id);
          const isBacklog = isBacklogColumn(column);
          
          return (
            <div key={column.id} className="space-y-4">
              {/* Column Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-semibold ${isBacklog ? 'text-blue-700' : 'text-gray-900'}`}>
                    {column.name}
                  </h3>
                  <Badge 
                    variant={isBacklog ? "default" : "secondary"}
                    className={isBacklog ? "bg-blue-100 text-blue-800" : ""}
                  >
                    {columnTasks.length}
                  </Badge>
                  {isBacklog && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Handoffs
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              {/* Column Tasks */}
              <div
                className={`space-y-3 min-h-[400px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                  isBacklog 
                    ? 'border-blue-200 hover:border-blue-300 bg-blue-50/30' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {columnTasks.map((task) => {
                  const isHandoff = isHandoffTask(task);
                  
                  return (
                    <Card
                      key={task.id}
                      className={`cursor-move hover:shadow-md transition-shadow ${
                        isHandoff ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium line-clamp-2">
                            {task.title}
                          </CardTitle>
                          <div className="flex flex-col items-end space-y-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(task.priority)}`}
                            >
                              <Flag className="w-3 h-3 mr-1" />
                              {task.priority}
                            </Badge>
                            {isHandoff && (
                              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                                <ArrowRight className="w-3 h-3 mr-1" />
                                Handoff
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isHandoff && task.sourceTeamId && (
                          <div className="flex items-center space-x-1 text-xs text-blue-600 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>From: {task.sourceTeamId}</span>
                          </div>
                        )}
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
                            {task.assigneeId && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>Assigned</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
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
                        {column.name === 'In Progress' && (
                          <div className="mt-2">
                            <Progress value={Math.random() * 100} className="h-2" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}

                {/* Empty State */}
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    <div className="text-center">
                      <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        isBacklog ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {isBacklog ? (
                          <ArrowRight className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </div>
                      <p className="text-sm">
                        {isBacklog ? 'No handoffs yet' : 'Drop tasks here'}
                      </p>
                      {isBacklog && (
                        <p className="text-xs text-gray-500 mt-1">
                          Tasks handed off from other teams will appear here
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
