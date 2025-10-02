'use client';

import React from 'react';
import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  title?: string;
  onTaskClick?: (task: Task) => void;
  className?: string;
}

export function TaskList({ tasks, title, onTaskClick, className }: TaskListProps) {
  return (
    <div className={`task-list ${className || ''}`}>
      {title && <h3 className="task-list-title">{title}</h3>}
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className="task-item"
          onClick={() => onTaskClick?.(task)}
        >
          <h4>{task.title}</h4>
          {task.description && <p>{task.description}</p>}
          <span className={`priority ${task.priority}`}>{task.priority}</span>
          <span className={`status ${task.status.name}`}>{task.status.name}</span>
        </div>
      ))}
    </div>
  );
}
