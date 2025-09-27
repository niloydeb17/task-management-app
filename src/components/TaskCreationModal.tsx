"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Maximize2, 
  X, 
  Sparkles, 
  User, 
  Calendar, 
  Flag, 
  Tag, 
  MoreHorizontal,
  Eye,
  Bell,
  Plus,
  Rocket,
  ChevronDown
} from "lucide-react";

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreate: (task: any) => void;
}

export function TaskCreationModal({ isOpen, onClose, onTaskCreate }: TaskCreationModalProps) {
  const [taskName, setTaskName] = useState("");
  const [addDescription, setAddDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleCreateTask = () => {
    const newTask = {
      title: taskName,
      description: addDescription ? description : undefined,
      status,
      assignee,
      dueDate,
      priority: priority || 'medium',
      tags,
      column_id: "pre-sprint", // Default to first column
    };
    
    onTaskCreate(newTask);
    onClose();
    
    // Reset form
    setTaskName("");
    setAddDescription(false);
    setDescription("");
    setStatus("OPEN");
    setAssignee("");
    setDueDate("");
    setPriority("");
    setTags([]);
  };

  const priorityOptions = [
    { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  ];

  const statusOptions = [
    { value: "OPEN", label: "Open" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "REVIEW", label: "Review" },
    { value: "DONE", label: "Done" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-fit w-[98vw] sm:w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] max-h-[90vh] p-0 overflow-auto">
        <VisuallyHidden>
          <DialogTitle>Create New Task</DialogTitle>
        </VisuallyHidden>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-start justify-between mb-6 sm:mb-8">
            <Tabs defaultValue="task" className="w-full">
              <TabsList className="flex w-full bg-gray-100 p-1 rounded-lg space-x-1">
                <TabsTrigger 
                  value="task" 
                  className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                >
                  Task
                </TabsTrigger>
                <TabsTrigger 
                  value="doc" 
                  className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                >
                  Doc
                </TabsTrigger>
                <TabsTrigger 
                  value="reminder" 
                  className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                >
                  Reminder
                </TabsTrigger>
                <TabsTrigger 
                  value="chat" 
                  className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                >
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="whiteboard" 
                  className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                >
                  Whiteboard
                </TabsTrigger>
                <TabsTrigger 
                  value="dashboard" 
                  className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                >
                  Dashboard
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="task" className="mt-0">
                <div className="space-y-10">
                  {/* Task Name Input */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-gray-700">Task Name</label>
                      <Input
                        placeholder="Enter task name..."
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        className="text-lg h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="add-description"
                        checked={addDescription}
                        onCheckedChange={(checked) => setAddDescription(checked === true)}
                        className="border-gray-300"
                      />
                      <label htmlFor="add-description" className="text-sm text-gray-600 cursor-pointer">
                        Add description
                      </label>
                    </div>
                    
                    {addDescription && (
                      <div className="space-y-3">
                        <Input
                          placeholder="Add a description..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                        <div className="flex items-center space-x-2 text-sm text-purple-600">
                          <Sparkles className="w-4 h-4" />
                          <span>Write with AI</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-6">
                    <div className="flex items-center flex-wrap gap-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 hover:bg-gray-50 whitespace-nowrap text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                            {status}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <div className="space-y-1">
                            {statusOptions.map((option) => (
                              <Button
                                key={option.value}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start h-8"
                                onClick={() => setStatus(option.value)}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 hover:bg-gray-50 whitespace-nowrap text-sm">
                            <User className="w-4 h-4 mr-2" />
                            Assignee
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <div className="space-y-2">
                            <Input
                              placeholder="Search assignee..."
                              className="h-8"
                            />
                            <div className="space-y-1">
                              <Button variant="ghost" size="sm" className="w-full justify-start h-8">
                                <User className="w-4 h-4 mr-2" />
                                Sam
                              </Button>
                              <Button variant="ghost" size="sm" className="w-full justify-start h-8">
                                <User className="w-4 h-4 mr-2" />
                                Sarah
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 hover:bg-gray-50 whitespace-nowrap text-sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            Due date
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Select due date</div>
                            <Input
                              type="date"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="h-8"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 hover:bg-gray-50 whitespace-nowrap text-sm">
                            <Flag className="w-4 h-4 mr-2" />
                            Priority
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <div className="space-y-1">
                            {priorityOptions.map((option) => (
                              <Button
                                key={option.value}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start h-8"
                                onClick={() => setPriority(option.value)}
                              >
                                <div className={`w-2 h-2 rounded-full mr-2 ${option.color.split(' ')[0]}`} />
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 hover:bg-gray-50 whitespace-nowrap text-sm">
                            <Tag className="w-4 h-4 mr-2" />
                            Tags
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <div className="space-y-2">
                            <Input
                              placeholder="Add tags..."
                              className="h-8"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const value = e.currentTarget.value.trim();
                                  if (value && !tags.includes(value)) {
                                    setTags([...tags, value]);
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                            <div className="flex flex-wrap gap-1">
                              {tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                  <X 
                                    className="w-3 h-3 ml-1 cursor-pointer" 
                                    onClick={() => setTags(tags.filter((_, i) => i !== index))}
                                  />
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-50 flex-shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Custom Fields */}
                  <div className="space-y-6">
                    <div className="text-sm font-medium text-gray-700">Custom Fields</div>
                    <Button variant="outline" size="sm" className="h-9 border-gray-300 hover:bg-gray-50">
                      <Plus className="w-4 h-4 mr-2" />
                      Create new field
                    </Button>
                  </div>

                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-6 sm:pt-8 border-t border-gray-200 mt-6 sm:mt-8 gap-4">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Eye className="w-4 h-4" />
                <span>0</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Bell className="w-4 h-4" />
                <span>1</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Button variant="outline" onClick={onClose} className="h-9 px-4 flex-1 sm:flex-none text-sm">
                Cancel
              </Button>
              <Button onClick={handleCreateTask} className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-none text-sm">
                Create Task
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}