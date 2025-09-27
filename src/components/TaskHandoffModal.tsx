'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, Users, FileText, CheckCircle } from 'lucide-react';
import { Team, Task, HandoffForm } from '@/types';

interface TaskHandoffModalProps {
  task: Task;
  teams: Team[];
  currentTeam: Team;
  onHandoff: (taskId: string, handoffData: HandoffForm) => Promise<void>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskHandoffModal({
  task,
  teams,
  currentTeam,
  onHandoff,
  isOpen,
  onOpenChange
}: TaskHandoffModalProps) {
  const [formData, setFormData] = useState<HandoffForm>({
    toTeamId: '',
    notes: '',
    requirements: [],
    files: [],
    handoffData: {}
  });
  const [newRequirement, setNewRequirement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTeams = teams.filter(team => team.id !== currentTeam.id);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        toTeamId: '',
        notes: '',
        requirements: [],
        files: [],
        handoffData: {}
      });
    }
  }, [isOpen]);
  
  console.log('TaskHandoffModal - teams:', teams);
  console.log('TaskHandoffModal - currentTeam:', currentTeam);
  console.log('TaskHandoffModal - availableTeams:', availableTeams);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data before submit:', formData);
    
    if (!formData.toTeamId) {
      console.error('No target team selected');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('TaskHandoffModal - calling onHandoff with:', { taskId: task.id, formData });
      await onHandoff(task.id, formData);
      onOpenChange(false);
      // Reset form
      setFormData({
        toTeamId: '',
        notes: '',
        requirements: [],
        files: [],
        handoffData: {}
      });
    } catch (error) {
      console.error('Handoff failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };

  const selectedTeam = teams.find(team => team.id === formData.toTeamId);

  // Don't render if we don't have teams data
  if (!teams || teams.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading Teams...</DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center">
            <p>Loading team data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Handoff Task to Another Team
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Task Details</h3>
            <div className="space-y-2">
              <p className="text-sm font-medium">{task.title}</p>
              <p className="text-xs text-gray-600">From: {currentTeam.name}</p>
              {task.description && (
                <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
              )}
            </div>
          </div>

          {/* Target Team Selection */}
          <div className="space-y-2">
            <Label htmlFor="team">Handoff to Team</Label>
            <Select
              value={formData.toTeamId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, toTeamId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target team" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: team.color }}
                      />
                      <span>{team.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {team.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Handoff Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Handoff Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add context, instructions, or important information for the receiving team..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label>Requirements & Specifications</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a requirement..."
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <Button type="button" onClick={addRequirement} size="sm">
                  Add
                </Button>
              </div>
              {formData.requirements.length > 0 && (
                <div className="space-y-1">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 bg-blue-50 p-2 rounded">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm flex-1">{req}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRequirement(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label htmlFor="files">Attach Files</Label>
            <Input
              id="files"
              type="file"
              multiple
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {formData.files.length > 0 && (
              <div className="space-y-1">
                {formData.files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                    <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {selectedTeam && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Handoff Preview
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">From:</span> {currentTeam.name}</p>
                <p><span className="font-medium">To:</span> {selectedTeam.name}</p>
                <p><span className="font-medium">Task:</span> {task.title}</p>
                {formData.notes && (
                  <p><span className="font-medium">Notes:</span> {formData.notes}</p>
                )}
                {formData.requirements.length > 0 && (
                  <p><span className="font-medium">Requirements:</span> {formData.requirements.length} items</p>
                )}
                {formData.files.length > 0 && (
                  <p><span className="font-medium">Files:</span> {formData.files.length} attachments</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log('Test button clicked - form data:', formData);
                console.log('Available teams:', availableTeams);
              }}
            >
              Debug
            </Button>
            <Button
              type="submit"
              disabled={!formData.toTeamId || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Handing off...' : 'Handoff Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
