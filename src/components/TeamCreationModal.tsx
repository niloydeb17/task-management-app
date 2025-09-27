"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TeamCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (teamData: {
    name: string;
    type: 'design' | 'content' | 'development' | 'marketing' | 'other';
    color?: string;
  }) => Promise<void>;
}

const teamTypes = [
  { value: 'design', label: 'Design', color: '#8B5CF6', description: 'UI/UX, Graphics, Branding' },
  { value: 'content', label: 'Content', color: '#F59E0B', description: 'Writing, Marketing, Social' },
  { value: 'development', label: 'Development', color: '#3B82F6', description: 'Frontend, Backend, Mobile' },
  { value: 'marketing', label: 'Marketing', color: '#EF4444', description: 'Growth, Campaigns, Analytics' },
  { value: 'other', label: 'Other', color: '#6B7280', description: 'General purpose team' }
];

const predefinedColors = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#6B7280', // Gray
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

export function TeamCreationModal({ isOpen, onClose, onCreateTeam }: TeamCreationModalProps) {
  const [teamName, setTeamName] = useState('');
  const [teamType, setTeamType] = useState<'design' | 'content' | 'development' | 'marketing' | 'other'>('other');
  const [selectedColor, setSelectedColor] = useState('#6B7280');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateTeam({
        name: teamName.trim(),
        type: teamType,
        color: selectedColor
      });
      
      // Reset form
      setTeamName('');
      setTeamType('other');
      setSelectedColor('#6B7280');
      onClose();
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setTeamName('');
      setTeamType('other');
      setSelectedColor('#6B7280');
      onClose();
    }
  };

  const selectedTypeInfo = teamTypes.find(type => type.value === teamType);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              required
              disabled={isCreating}
            />
          </div>

          {/* Team Type */}
          <div className="space-y-2">
            <Label htmlFor="team-type">Team Type</Label>
            <Select value={teamType} onValueChange={(value: any) => setTeamType(value)} disabled={isCreating}>
              <SelectTrigger>
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent>
                {teamTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTypeInfo && (
              <p className="text-sm text-gray-500">{selectedTypeInfo.description}</p>
            )}
          </div>

          {/* Team Color */}
          <div className="space-y-3">
            <Label>Team Color</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  disabled={isCreating}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-gray-900 scale-110' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Selected:</span>
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ backgroundColor: selectedColor, color: 'white' }}
              >
                {selectedColor}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!teamName.trim() || isCreating}
              className="min-w-[100px]"
            >
              {isCreating ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
