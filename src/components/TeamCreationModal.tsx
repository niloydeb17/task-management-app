"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Users, Palette, Lock, Eye } from 'lucide-react';

interface TeamCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (teamData: {
    name: string;
    type: 'design' | 'content' | 'development' | 'marketing' | 'other';
    color?: string;
    description?: string;
    isPrivate?: boolean;
  }) => Promise<void>;
}

const teamTypes = [
  { value: 'design', label: 'Design', color: '#8B5CF6', description: 'UI/UX, Graphics, Branding', icon: '🎨' },
  { value: 'content', label: 'Content', color: '#F59E0B', description: 'Writing, Marketing, Social', icon: '📝' },
  { value: 'development', label: 'Development', color: '#3B82F6', description: 'Frontend, Backend, Mobile', icon: '💻' },
  { value: 'marketing', label: 'Marketing', color: '#EF4444', description: 'Growth, Campaigns, Analytics', icon: '📈' },
  { value: 'other', label: 'Other', color: '#6B7280', description: 'General purpose team', icon: '👥' }
];

const spaceIcons = [
  { value: '👥', label: 'Team' },
  { value: '🎨', label: 'Design' },
  { value: '💻', label: 'Development' },
  { value: '📝', label: 'Content' },
  { value: '📈', label: 'Marketing' },
  { value: '🔧', label: 'Engineering' },
  { value: '💡', label: 'Ideas' },
  { value: '🚀', label: 'Projects' },
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
  const [selectedIcon, setSelectedIcon] = useState('👥');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateTeam({
        name: teamName.trim(),
        type: teamType,
        color: selectedColor,
        description: description.trim(),
        isPrivate
      });
      
      // Reset form
      setTeamName('');
      setTeamType('other');
      setSelectedColor('#6B7280');
      setSelectedIcon('👥');
      setDescription('');
      setIsPrivate(false);
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
      setSelectedIcon('👥');
      setDescription('');
      setIsPrivate(false);
      onClose();
    }
  };

  const selectedTypeInfo = teamTypes.find(type => type.value === teamType);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Create a Space</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isCreating}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            A Space represents teams, departments, or groups, each with its own Lists, workflows, and settings.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Icon & Name */}
          <div className="space-y-3">
            <Label htmlFor="space-name" className="text-sm font-medium">Icon & name</Label>
            <div className="flex items-center space-x-3">
              {/* Icon Selector */}
              <div className="relative">
                <button
                  type="button"
                  className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-xl hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    // Simple icon picker - cycle through icons
                    const currentIndex = spaceIcons.findIndex(icon => icon.value === selectedIcon);
                    const nextIndex = (currentIndex + 1) % spaceIcons.length;
                    setSelectedIcon(spaceIcons[nextIndex].value);
                  }}
                  disabled={isCreating}
                >
                  {selectedIcon}
                </button>
              </div>
              
              {/* Name Input */}
              <Input
                id="space-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Marketing, Engineering, HR"
                required
                disabled={isCreating}
                className="flex-1"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="space-description" className="text-sm font-medium">Description (optional)</Label>
            <textarea
              id="space-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your space..."
              disabled={isCreating}
              className="w-full min-h-[80px] px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Make Private Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Make Private</Label>
                <p className="text-xs text-gray-500">Only you and invited members have access</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                disabled={isCreating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPrivate ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPrivate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Use Templates Link */}
          <div className="pt-2">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 underline"
              disabled={isCreating}
            >
              Use Templates
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={!teamName.trim() || isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isCreating ? 'Creating...' : 'Continue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
