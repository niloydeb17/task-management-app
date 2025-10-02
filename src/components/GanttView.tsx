"use client";

import { useState, useMemo } from "react";
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureRow,
  GanttToday,
  GanttMarker,
  GanttCreateMarkerTrigger,
  type GanttFeature,
  type GanttMarkerProps,
} from "@/components/ui/kibo-ui/gantt";
import { Task } from "@/types";

interface GanttViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
  range?: 'monthly' | 'quarterly' | 'daily';
  zoom?: number;
  onRangeChange?: (range: 'monthly' | 'quarterly' | 'daily') => void;
}

export function GanttView({ tasks, onTaskClick, onAddTask, range = 'monthly', zoom = 100, onRangeChange }: GanttViewProps) {
  const [markers, setMarkers] = useState<GanttMarkerProps[]>([]);

  // Convert tasks to Gantt features
  const features: GanttFeature[] = useMemo(() => {
    const convertedFeatures = tasks.map((task) => {
      // Use created_at as start date, due_date as end date, or default duration
      const startDate = task.createdAt ? new Date(task.createdAt) : new Date();
      let endDate;
      
      if (task.dueDate) {
        endDate = new Date(task.dueDate);
      } else {
        // Default duration based on priority
        const durationDays = task.priority === 'high' ? 1 : task.priority === 'medium' ? 3 : 7;
        endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }

      return {
        id: task.id,
        name: task.title,
        startAt: startDate,
        endAt: endDate,
        status: {
          id: task.priority || 'medium',
          name: task.priority || 'Medium',
          color: getPriorityColor(task.priority),
        },
        lane: task.columnId || 'default',
      };
    });
    
    return convertedFeatures;
  }, [tasks]);

  // Group features by lane (column)
  const groupedFeatures = useMemo(() => {
    const groups: { [key: string]: GanttFeature[] } = {};
    features.forEach((feature) => {
      const lane = feature.lane || 'default';
      if (!groups[lane]) {
        groups[lane] = [];
      }
      groups[lane].push(feature);
    });
    return groups;
  }, [features]);

  const handleFeatureMove = (id: string, startAt: Date, endAt: Date | null) => {
    // Handle feature movement - you can implement task updates here
  };

  const handleCreateMarker = (date: Date) => {
    const newMarker: GanttMarkerProps = {
      id: `marker-${Date.now()}`,
      date,
      label: 'Milestone',
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  const handleRemoveMarker = (id: string) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  };

  const handleAddItem = (date: Date) => {
    onAddTask();
  };

  return (
    <div className="h-full w-full bg-background">
      <style jsx>{`
        .gantt {
          --gantt-column-width: 40px;
          --gantt-row-height: 40px;
          --gantt-sidebar-width: 300px;
        }
        .gantt .gantt-feature-item {
          background: linear-gradient(90deg, var(--status-color) 0%, var(--status-color) 100%);
          border-radius: 4px;
          border: 1px solid rgba(0,0,0,0.1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .gantt .gantt-feature-item:hover {
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transform: translateY(-1px);
        }
      `}</style>
      <GanttProvider range={range} zoom={zoom} onAddItem={handleAddItem}>
        <GanttSidebar>
          {Object.entries(groupedFeatures).map(([lane, laneFeatures]) => (
            <GanttSidebarGroup key={lane} name={getLaneName(lane)}>
              {laneFeatures.map((feature) => (
                <GanttSidebarItem
                  key={feature.id}
                  feature={feature}
                  onSelectItem={(id) => {
                    const task = tasks.find(t => t.id === id);
                    if (task) onTaskClick(task);
                  }}
                />
              ))}
            </GanttSidebarGroup>
          ))}
        </GanttSidebar>

        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList>
            {Object.entries(groupedFeatures).map(([lane, laneFeatures]) => (
              <GanttFeatureListGroup key={lane}>
                <GanttFeatureRow
                  features={laneFeatures}
                  onMove={handleFeatureMove}
                >
                  {(feature) => (
                    <div className="flex items-center gap-2 w-full min-w-0">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: feature.status.color }}
                      />
                      <span className="text-xs font-medium truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap">{feature.name}</span>
                    </div>
                  )}
                </GanttFeatureRow>
              </GanttFeatureListGroup>
            ))}
          </GanttFeatureList>

          <GanttToday />
          
          {markers.map((marker) => (
            <GanttMarker
              key={marker.id}
              {...marker}
              onRemove={handleRemoveMarker}
            />
          ))}

          <GanttCreateMarkerTrigger onCreateMarker={handleCreateMarker} />
        </GanttTimeline>
      </GanttProvider>
    </div>
  );
}

function getPriorityColor(priority?: string): string {
  switch (priority?.toLowerCase()) {
    case 'high':
      return '#ef4444'; // red
    case 'medium':
      return '#f59e0b'; // amber
    case 'low':
      return '#10b981'; // emerald
    default:
      return '#6b7280'; // gray
  }
}

function getLaneName(lane: string): string {
  // Map column IDs to readable names
  const laneNames: { [key: string]: string } = {
    'default': 'All Tasks',
    'backlog': 'Backlog',
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'done': 'Done',
    'completed': 'Completed',
  };
  return laneNames[lane] || `Column ${lane}`;
}
