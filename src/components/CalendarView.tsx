"use client";

import { useState, useMemo } from "react";
import { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

type ViewType = 'month' | 'week' | 'day';

export function CalendarView({ tasks, onTaskClick, onAddTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt || Date.now());
      return taskDate.toDateString() === date.toDateString();
    });
  };

  // Get tasks for a date range
  const getTasksForDateRange = (startDate: Date, endDate: Date) => {
    return tasks.filter(task => {
      const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt || Date.now());
      return taskDate >= startDate && taskDate <= endDate;
    });
  };

  // Month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div className="h-full">
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
          
          {/* Days */}
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();
            const dayTasks = getTasksForDate(day);
            
            return (
              <div
                key={index}
                className={`bg-white min-h-[120px] p-2 border-r border-b border-gray-200 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      className="text-xs p-1 rounded cursor-pointer hover:bg-gray-100 truncate"
                      style={{ 
                        backgroundColor: getPriorityColor(task.priority) + '20',
                        borderLeft: `3px solid ${getPriorityColor(task.priority)}`
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Week view
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    return (
      <div className="h-full">
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          {weekDays.map((day, index) => (
            <div key={index} className="bg-gray-50 p-3 text-center">
              <div className="text-sm font-medium text-gray-700">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-bold ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-900'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
          
          {/* Days */}
          {weekDays.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayTasks = getTasksForDate(day);
            
            return (
              <div
                key={index}
                className={`bg-white min-h-[400px] p-3 ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className="space-y-2">
                  {dayTasks.map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      className="p-2 rounded cursor-pointer hover:bg-gray-100"
                      style={{ 
                        backgroundColor: getPriorityColor(task.priority) + '20',
                        borderLeft: `3px solid ${getPriorityColor(task.priority)}`
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="text-sm font-medium truncate">{task.title}</div>
                      <div className="text-xs text-gray-500">{task.priority}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Day view
  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="h-full">
        <div className="grid grid-cols-25 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Time column */}
          <div className="bg-gray-50 p-2">
            <div className="text-sm font-medium text-gray-700">Time</div>
          </div>
          
          {/* Day column */}
          <div className="bg-gray-50 p-2">
            <div className="text-sm font-medium text-gray-700">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          {/* Hours */}
          {hours.map(hour => (
            <div key={hour} className="bg-white min-h-[60px] p-2 border-b border-gray-200">
              <div className="text-xs text-gray-500 mb-2">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div className="space-y-1">
                {dayTasks
                  .filter(task => {
                    const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt || Date.now());
                    return taskDate.getHours() === hour;
                  })
                  .map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      className="p-2 rounded cursor-pointer hover:bg-gray-100 text-xs"
                      style={{ 
                        backgroundColor: getPriorityColor(task.priority) + '20',
                        borderLeft: `3px solid ${getPriorityColor(task.priority)}`
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      {task.title}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
          </div>
          
          <h2 className="text-xl font-semibold">
            {viewType === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewType === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {viewType === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
            <Button
              variant={viewType === 'month' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3 rounded-none border-0"
              onClick={() => setViewType('month')}
            >
              Month
            </Button>
            <Button
              variant={viewType === 'week' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3 rounded-none border-0"
              onClick={() => setViewType('week')}
            >
              Week
            </Button>
            <Button
              variant={viewType === 'day' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3 rounded-none border-0"
              onClick={() => setViewType('day')}
            >
              Day
            </Button>
          </div>
          
        </div>
      </div>
      
      {/* Calendar Content */}
      <div className="flex-1 overflow-auto">
        {viewType === 'month' && renderMonthView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'day' && renderDayView()}
      </div>
    </div>
  );
}
