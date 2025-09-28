"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Palette, Lock, Eye, ChevronDown } from 'lucide-react';

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
  { value: '📁', label: 'Folder' },
  { value: '👥', label: 'Team' },
  { value: '🎨', label: 'Design' },
  { value: '💻', label: 'Development' },
  { value: '📝', label: 'Content' },
  { value: '📈', label: 'Marketing' },
  { value: '🔧', label: 'Engineering' },
  { value: '💡', label: 'Ideas' },
  { value: '🚀', label: 'Projects' },
  { value: '🏢', label: 'Business' },
  { value: '🎯', label: 'Goals' },
  { value: '📊', label: 'Analytics' },
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
  const [selectedIcon, setSelectedIcon] = useState('📁');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

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
      setSelectedIcon('📁');
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
      setSelectedIcon('📁');
      setDescription('');
      setIsPrivate(false);
      onClose();
    }
  };

  const selectedTypeInfo = teamTypes.find(type => type.value === teamType);

  // Close icon picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false);
      }
    };

    if (showIconPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIconPicker]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-full mx-4 p-0 border-0 shadow-xl">
        <VisuallyHidden>
          <DialogTitle>Create a Space</DialogTitle>
        </VisuallyHidden>
        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Create a Space</h2>
            <p className="text-sm text-gray-600 leading-5">
              A Space represents teams, departments, or groups, each with its own Lists, workflows, and settings.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Icon & Name */}
            <div className="space-y-2">
              <label htmlFor="space-name" className="block text-sm font-medium text-gray-900">
                Icon & name
              </label>
              <div className="flex items-center gap-3">
                {/* Icon Selector */}
                <div className="relative" ref={iconPickerRef}>
                  <button
                    type="button"
                    className="w-10 h-10 bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center text-lg hover:bg-gray-200 transition-colors flex-shrink-0"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    disabled={isCreating}
                  >
                    {selectedIcon}
                  </button>
                  
                  {/* Icon Picker Dropdown */}
                  {showIconPicker && (
                    <div className="absolute top-12 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
                      <div className="grid grid-cols-4 gap-2">
                        {spaceIcons.map((icon) => (
                          <button
                            key={icon.value}
                            type="button"
                            onClick={() => {
                              setSelectedIcon(icon.value);
                              setShowIconPicker(false);
                            }}
                            className={`w-8 h-8 rounded-md flex items-center justify-center text-sm hover:bg-gray-100 transition-colors ${
                              selectedIcon === icon.value ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                            }`}
                            title={icon.label}
                          >
                            {icon.value}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Name Input */}
                <input
                  id="space-name"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Marketing, Engineering, HR"
                  required
                  disabled={isCreating}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="space-description" className="block text-sm font-medium text-gray-900">
                Description (optional)
              </label>
              <textarea
                id="space-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for your space..."
                disabled={isCreating}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Make Private Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900">Make Private</label>
                  <p className="text-xs text-gray-500 mt-0.5">Only you and invited members have access</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  disabled={isCreating}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isPrivate ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isPrivate ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>


            {/* Actions */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={!teamName.trim() || isCreating}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? 'Creating...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
