"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TaskHandoffModal } from "./TaskHandoffModal";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X, 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal,
  Plus,
  Calendar,
  Flag,
  Tag,
  Clock,
  MapPin,
  Paperclip,
  MessageCircle,
  CheckCircle2,
  Home,
  RefreshCw,
  ArrowRight
} from "lucide-react";

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

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onHandoff?: (taskId: string, handoffData: any) => Promise<void>;
  teams?: Array<{ id: string; name: string; type: string; color: string }>;
  currentTeam?: { id: string; name: string; type: string; color: string };
}

export function TaskDetailModal({ isOpen, onClose, task, onTaskUpdate, onHandoff, teams, currentTeam }: TaskDetailModalProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [comment, setComment] = useState("");
  const [subTasks, setSubTasks] = useState<string[]>([]);
  const [newSubTask, setNewSubTask] = useState("");
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  
  // Handoff modal state
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);

  // Initialize edited task when modal opens
  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        tags: [...task.tags],
        due_date: task.due_date || null,
      });
      setIsCompleted(false);
      setHasChanges(false);
    }
  }, [task]);

  if (!task) return null;

  const getPriorityInfo = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return { label: 'P1', color: 'bg-red-100 text-red-800', icon: '🔴' };
      case 'high':
        return { label: 'P2', color: 'bg-orange-100 text-orange-800', icon: '🟠' };
      case 'medium':
        return { label: 'P3', color: 'bg-blue-100 text-blue-800', icon: '🔵' };
      case 'low':
        return { label: 'P4', color: 'bg-green-100 text-green-800', icon: '🟢' };
      default:
        return { label: 'P3', color: 'bg-gray-100 text-gray-800', icon: '⚪' };
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  const priorityInfo = getPriorityInfo(editedTask.priority || task.priority);

  const handleSave = () => {
    if (onTaskUpdate && hasChanges) {
      onTaskUpdate(task.id, editedTask);
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEditedTask({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      tags: [...task.tags],
      due_date: task.due_date || null,
    });
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleFieldChange = (field: keyof Task, value: any) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !editedTask.tags?.includes(tag)) {
      const newTags = [...(editedTask.tags || []), tag];
      handleFieldChange('tags', newTags);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    const newTags = editedTask.tags?.filter(tag => tag !== tagToRemove) || [];
    handleFieldChange('tags', newTags);
  };

  // Inline editing functions
  const startInlineEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const saveInlineEdit = () => {
    if (editingField && tempValue !== (editedTask[editingField as keyof Task] || task[editingField as keyof Task])) {
      // Handle empty due_date specially
      let valueToSave = tempValue;
      if (editingField === 'due_date' && tempValue === '') {
        valueToSave = null;
      }
      handleFieldChange(editingField as keyof Task, valueToSave);
    }
    setEditingField(null);
    setTempValue("");
  };

  const cancelInlineEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelInlineEdit();
    }
  };

  const handleCloseModal = () => {
    // Save any pending inline edits
    if (editingField) {
      saveInlineEdit();
    }
    
    // Save any changes before closing
    if (hasChanges && onTaskUpdate) {
      onTaskUpdate(task.id, editedTask);
    }
    
    // Reset all editing states
    setIsEditing(false);
    setHasChanges(false);
    setEditingField(null);
    setTempValue("");
    
    // Close the modal
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="!max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Task Details - {task.title}</DialogTitle>
        </VisuallyHidden>
        <div className="flex h-full">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Home className="w-4 h-4 text-green-600" />
                  <span># Home</span>
                </div>
                <span>/</span>
                <div className="flex items-center space-x-1">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <span>Routines</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                      className="h-8 px-3"
                    >
                      Edit
                    </Button>
                    {onHandoff && teams && currentTeam && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsHandoffModalOpen(true)}
                        className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Handoff
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCloseModal}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancel}
                      className="h-8 px-3"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleSave}
                      disabled={!hasChanges}
                      className="h-8 px-3"
                    >
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCloseModal}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Task Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl">
                {/* Task Title with Checkbox */}
                <div className="flex items-center space-x-4 mb-6">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={setIsCompleted}
                    className="h-6 w-6 border-2 border-blue-500 data-[state=checked]:bg-blue-500 flex-shrink-0"
                  />
                  {isEditing || editingField === 'title' ? (
                    <Input
                      value={editingField === 'title' ? tempValue : (editedTask.title || "")}
                      onChange={(e) => {
                        if (editingField === 'title') {
                          setTempValue(e.target.value);
                        } else {
                          handleFieldChange('title', e.target.value);
                        }
                      }}
                      onBlur={editingField === 'title' ? saveInlineEdit : undefined}
                      onKeyDown={editingField === 'title' ? handleInlineKeyDown : undefined}
                      className="text-2xl font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0 flex-1 leading-tight"
                      placeholder="Task title..."
                      autoFocus={editingField === 'title'}
                    />
                  ) : (
                    <h1 
                      className="text-2xl font-semibold text-gray-900 leading-tight cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors flex-1"
                      onClick={() => startInlineEdit('title', editedTask.title || task.title)}
                    >
                      {editedTask.title || task.title}
                    </h1>
                  )}
                </div>

                {/* Task Description */}
                <div className="mb-6">
                  {isEditing || editingField === 'description' ? (
                    <Textarea
                      value={editingField === 'description' ? tempValue : (editedTask.description || "")}
                      onChange={(e) => {
                        if (editingField === 'description') {
                          setTempValue(e.target.value);
                        } else {
                          handleFieldChange('description', e.target.value);
                        }
                      }}
                      onBlur={editingField === 'description' ? saveInlineEdit : undefined}
                      onKeyDown={editingField === 'description' ? handleInlineKeyDown : undefined}
                      placeholder="Add a description..."
                      className="min-h-[100px] resize-none text-base leading-relaxed border-none shadow-none p-0 focus-visible:ring-0"
                      autoFocus={editingField === 'description'}
                    />
                  ) : (
                    <div 
                      className="text-base text-gray-700 leading-relaxed cursor-pointer hover:bg-gray-50 px-2 py-2 rounded transition-colors min-h-[100px]"
                      onClick={() => startInlineEdit('description', editedTask.description || task.description || "")}
                    >
                      {editedTask.description || task.description || (
                        <div className="text-gray-500 italic">
                          <div className="mb-2">Movie: Harry Potter</div>
                          <div>Snacks: Popcorn, Soda, Tacos</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sub-tasks */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 cursor-pointer">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add sub-task</span>
                  </div>
                  {subTasks.map((subTask, index) => (
                    <div key={index} className="flex items-center space-x-2 mt-2">
                      <Checkbox className="h-4 w-4" />
                      <span className="text-sm text-gray-700">{subTask}</span>
                    </div>
                  ))}
                </div>

                {/* Comments Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={task.assignee?.avatar} />
                      <AvatarFallback className="text-xs bg-blue-500 text-white">
                        {task.assignee?.name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex items-center space-x-2">
                      <Input
                        placeholder="Comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Project */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Project</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Home className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600"># Home</span>
                  <span className="text-gray-400">/</span>
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Routines</span>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Due date</label>
                </div>
                {isEditing || editingField === 'due_date' ? (
                  <Input
                    type="datetime-local"
                    value={editingField === 'due_date' ? 
                      (tempValue ? new Date(tempValue).toISOString().slice(0, 16) : "") :
                      (editedTask.due_date ? new Date(editedTask.due_date).toISOString().slice(0, 16) : "")
                    }
                    onChange={(e) => {
                      if (editingField === 'due_date') {
                        setTempValue(e.target.value ? new Date(e.target.value).toISOString() : "");
                      } else {
                        handleFieldChange('due_date', e.target.value ? new Date(e.target.value).toISOString() : null);
                      }
                    }}
                    onBlur={editingField === 'due_date' ? saveInlineEdit : undefined}
                    onKeyDown={editingField === 'due_date' ? handleInlineKeyDown : undefined}
                    className="h-8 text-sm"
                    autoFocus={editingField === 'due_date'}
                  />
                ) : (
                  <div 
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                    onClick={() => startInlineEdit('due_date', editedTask.due_date || task.due_date || "")}
                  >
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {editedTask.due_date ? (
                        <>
                          {formatDueDate(editedTask.due_date)} {new Date(editedTask.due_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : task.due_date ? (
                        <>
                          {formatDueDate(task.due_date)} {new Date(task.due_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : (
                        "No due date"
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                </div>
                {isEditing ? (
                  <Select
                    value={editedTask.priority || task.priority}
                    onValueChange={(value) => handleFieldChange('priority', value)}
                  >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (P4)</SelectItem>
                      <SelectItem value="medium">Medium (P3)</SelectItem>
                      <SelectItem value="high">High (P2)</SelectItem>
                      <SelectItem value="urgent">Urgent (P1)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Flag className="w-4 h-4 text-blue-500" />
                    <Badge className={`text-xs ${priorityInfo.color}`}>
                      {priorityInfo.label}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Labels */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Labels</label>
                  {isEditing && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Plus className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Add a label..."
                      className="h-8"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = e.currentTarget.value.trim();
                          if (value) {
                            handleTagAdd(value);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-1">
                      {(editedTask.tags || []).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                          {tag}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => handleTagRemove(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {(editedTask.tags || task.tags).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Reminders */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Reminders</label>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>30 mins before</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>1 hour before</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Arriving: 1226 University Dr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Handoff Modal */}
        {onHandoff && teams && currentTeam && (
          <TaskHandoffModal
            task={{
              id: task.id,
              title: task.title,
              description: task.description,
              status: { id: task.column_id, name: 'Complete', color: '#10B981', order: 3, isCompleted: true },
              priority: task.priority,
              assigneeId: task.assignee?.name,
              teamId: currentTeam.id,
              columnId: task.column_id,
              tags: task.tags,
              attachments: [],
              comments: [],
              handoffHistory: [],
              handoffStatus: 'none',
              handoffRequirements: [],
              createdAt: new Date(task.created_at),
              updatedAt: new Date(task.created_at),
              dueDate: task.due_date ? new Date(task.due_date) : undefined
            }}
            teams={teams}
            currentTeam={currentTeam}
            onHandoff={onHandoff}
            isOpen={isHandoffModalOpen}
            onOpenChange={setIsHandoffModalOpen}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
