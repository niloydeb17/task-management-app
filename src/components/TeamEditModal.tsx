"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Team {
  id: string;
  name: string;
  type: 'design' | 'content' | 'development' | 'marketing' | 'other';
  color: string;
  board_template: {
    columns: Array<{
      id: string;
      name: string;
      color: string;
      order: number;
    }>;
  };
  created_at: string;
  updated_at: string;
}

interface TeamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateTeam: (teamId: string, teamData: {
    name: string;
    type: 'design' | 'content' | 'development' | 'marketing' | 'other';
    color?: string;
  }) => Promise<void>;
  team: Team | null;
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

export function TeamEditModal({ isOpen, onClose, onUpdateTeam, team }: TeamEditModalProps) {
  const [teamName, setTeamName] = useState('');
  const [teamType, setTeamType] = useState<'design' | 'content' | 'development' | 'marketing' | 'other'>('other');
  const [selectedColor, setSelectedColor] = useState('#6B7280');
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize form with team data
  useEffect(() => {
    if (team) {
      setTeamName(team.name);
      setTeamType(team.type);
      setSelectedColor(team.color);
    }
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim() || !team) return;

    setIsUpdating(true);
    try {
      await onUpdateTeam(team.id, {
        name: teamName.trim(),
        type: teamType,
        color: selectedColor
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating team:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  const selectedTypeInfo = teamTypes.find(type => type.value === teamType);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
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
              disabled={isUpdating}
            />
          </div>

          {/* Team Type */}
          <div className="space-y-2">
            <Label htmlFor="team-type">Team Type</Label>
            <Select value={teamType} onValueChange={(value: any) => setTeamType(value)} disabled={isUpdating}>
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
                  disabled={isUpdating}
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
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!teamName.trim() || isUpdating}
              className="min-w-[100px]"
            >
              {isUpdating ? 'Updating...' : 'Update Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
