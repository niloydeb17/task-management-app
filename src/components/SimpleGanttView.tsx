"use client";

import { useMemo } from "react";
import { Task } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TaskWithMonth extends Task {
  monthName: string;
}

interface SimpleGanttViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

export function SimpleGanttView({ tasks, onTaskClick, onAddTask }: SimpleGanttViewProps) {
  // Group tasks by month
  const tasksByMonth = useMemo(() => {
    const groups: { [key: string]: TaskWithMonth[] } = {};
    
    tasks.forEach((task) => {
      const date = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt || Date.now());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push({ ...task, monthName });
    });
    
    return groups;
  }, [tasks]);

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="h-full w-full p-6 bg-gray-50">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Timeline View</h2>
        <p className="text-gray-600">Track your tasks across time</p>
      </div>

      <div className="space-y-8">
        {Object.entries(tasksByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([monthKey, monthTasks]) => (
            <div key={monthKey} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {monthTasks[0]?.monthName || monthKey}
                </h3>
                <Badge variant="outline" className="text-sm">
                  {monthTasks.length} tasks
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4"
                    style={{ borderLeftColor: getPriorityColor(task.priority).includes('red') ? '#ef4444' : 
                                 getPriorityColor(task.priority).includes('yellow') ? '#f59e0b' : 
                                 getPriorityColor(task.priority).includes('green') ? '#10b981' : '#6b7280' }}
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {task.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority || 'Medium'}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                      </span>
                      {task.assigneeId && (
                        <span className="truncate max-w-20">
                          {task.assigneeId}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>

      {Object.keys(tasksByMonth).length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">Create your first task to see it in the timeline</p>
          <button
            onClick={onAddTask}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Task
          </button>
        </div>
      )}
    </div>
  );
}
