"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Palette, Lock, Eye, ChevronDown, Search, Upload,
  Folder, FolderOpen, Briefcase, Building, Target, BarChart3,
  Lightbulb, Rocket, Wrench, Code, PenTool, FileText, TrendingUp,
  Heart, Star, Shield, Zap, Globe, Mail, Phone, Calendar, Clock,
  Settings, User, UserPlus, Users2, Crown, Award, Gift, Coffee,
  Home, Car, Plane, Train, Bike, Camera, Music, Video, Image,
  Book, BookOpen, File, FileCheck, Download, Share, Link,
  Plus, Minus, Check, X, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Edit, Trash, Copy, Save, Refresh, RotateCcw, Play, Pause,
  Volume2, VolumeX, Mic, MicOff, Bell, BellOff, Lock as LockIcon,
  Unlock, Eye as EyeIcon, EyeOff, Sun, Moon, Cloud, CloudRain
} from 'lucide-react';

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
  { value: 'Folder', label: 'Folder', icon: Folder },
  { value: 'FolderOpen', label: 'Folder Open', icon: FolderOpen },
  { value: 'Users', label: 'Team', icon: Users },
  { value: 'Users2', label: 'Team 2', icon: Users2 },
  { value: 'PenTool', label: 'Design', icon: PenTool },
  { value: 'Code', label: 'Development', icon: Code },
  { value: 'FileText', label: 'Content', icon: FileText },
  { value: 'TrendingUp', label: 'Marketing', icon: TrendingUp },
  { value: 'Wrench', label: 'Engineering', icon: Wrench },
  { value: 'Lightbulb', label: 'Ideas', icon: Lightbulb },
  { value: 'Rocket', label: 'Projects', icon: Rocket },
  { value: 'Building', label: 'Business', icon: Building },
  { value: 'Target', label: 'Goals', icon: Target },
  { value: 'BarChart3', label: 'Analytics', icon: BarChart3 },
  { value: 'Briefcase', label: 'Work', icon: Briefcase },
  { value: 'Heart', label: 'Heart', icon: Heart },
  { value: 'Star', label: 'Star', icon: Star },
  { value: 'Shield', label: 'Security', icon: Shield },
  { value: 'Zap', label: 'Energy', icon: Zap },
  { value: 'Globe', label: 'Global', icon: Globe },
  { value: 'Mail', label: 'Email', icon: Mail },
  { value: 'Phone', label: 'Phone', icon: Phone },
  { value: 'Calendar', label: 'Calendar', icon: Calendar },
  { value: 'Clock', label: 'Time', icon: Clock },
  { value: 'Settings', label: 'Settings', icon: Settings },
  { value: 'User', label: 'User', icon: User },
  { value: 'UserPlus', label: 'Add User', icon: UserPlus },
  { value: 'Crown', label: 'Premium', icon: Crown },
  { value: 'Award', label: 'Award', icon: Award },
  { value: 'Gift', label: 'Gift', icon: Gift },
  { value: 'Coffee', label: 'Coffee', icon: Coffee },
  { value: 'Home', label: 'Home', icon: Home },
  { value: 'Car', label: 'Transport', icon: Car },
  { value: 'Plane', label: 'Travel', icon: Plane },
  { value: 'Train', label: 'Train', icon: Train },
  { value: 'Bike', label: 'Bike', icon: Bike },
  { value: 'Camera', label: 'Camera', icon: Camera },
  { value: 'Music', label: 'Music', icon: Music },
  { value: 'Video', label: 'Video', icon: Video },
  { value: 'Image', label: 'Image', icon: Image },
  { value: 'Book', label: 'Book', icon: Book },
  { value: 'BookOpen', label: 'Book Open', icon: BookOpen },
  { value: 'File', label: 'File', icon: File },
  { value: 'FileCheck', label: 'File Check', icon: FileCheck },
  { value: 'Download', label: 'Download', icon: Download },
  { value: 'Share', label: 'Share', icon: Share },
  { value: 'Link', label: 'Link', icon: Link },
  { value: 'Plus', label: 'Add', icon: Plus },
  { value: 'Minus', label: 'Remove', icon: Minus },
  { value: 'Check', label: 'Check', icon: Check },
  { value: 'X', label: 'Close', icon: X },
  { value: 'ArrowRight', label: 'Right Arrow', icon: ArrowRight },
  { value: 'ArrowLeft', label: 'Left Arrow', icon: ArrowLeft },
  { value: 'ArrowUp', label: 'Up Arrow', icon: ArrowUp },
  { value: 'ArrowDown', label: 'Down Arrow', icon: ArrowDown },
  { value: 'Edit', label: 'Edit', icon: Edit },
  { value: 'Trash', label: 'Delete', icon: Trash },
  { value: 'Copy', label: 'Copy', icon: Copy },
  { value: 'Save', label: 'Save', icon: Save },
  { value: 'Refresh', label: 'Refresh', icon: Refresh },
  { value: 'RotateCcw', label: 'Undo', icon: RotateCcw },
  { value: 'Play', label: 'Play', icon: Play },
  { value: 'Pause', label: 'Pause', icon: Pause },
  { value: 'Volume2', label: 'Volume', icon: Volume2 },
  { value: 'VolumeX', label: 'Mute', icon: VolumeX },
  { value: 'Mic', label: 'Microphone', icon: Mic },
  { value: 'MicOff', label: 'Mic Off', icon: MicOff },
  { value: 'Bell', label: 'Notification', icon: Bell },
  { value: 'BellOff', label: 'No Notifications', icon: BellOff },
  { value: 'LockIcon', label: 'Lock', icon: LockIcon },
  { value: 'Unlock', label: 'Unlock', icon: Unlock },
  { value: 'EyeIcon', label: 'View', icon: EyeIcon },
  { value: 'EyeOff', label: 'Hide', icon: EyeOff },
  { value: 'Sun', label: 'Sun', icon: Sun },
  { value: 'Moon', label: 'Moon', icon: Moon },
  { value: 'Cloud', label: 'Cloud', icon: Cloud },
  { value: 'CloudRain', label: 'Rain', icon: CloudRain },
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
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearchTerm, setIconSearchTerm] = useState('');
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
      setSelectedIcon('Folder');
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
      setSelectedIcon('Folder');
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
                    className="w-10 h-10 bg-gray-900 border border-gray-300 rounded-md flex items-center justify-center text-white hover:bg-gray-800 transition-colors flex-shrink-0"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    disabled={isCreating}
                  >
                    {(() => {
                      const iconData = spaceIcons.find(icon => icon.value === selectedIcon);
                      const IconComponent = iconData?.icon || Folder;
                      return <IconComponent className="w-5 h-5" />;
                    })()}
                  </button>
                  
                  {/* Icon Picker Dropdown */}
                  {showIconPicker && (
                    <div className="absolute top-12 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px]">
                      {/* Search Bar */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search icons"
                            value={iconSearchTerm}
                            onChange={(e) => setIconSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          className="px-3 py-2 border border-blue-500 text-blue-500 rounded-md text-sm hover:bg-blue-50 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Icon Grid */}
                      <div className="grid grid-cols-8 gap-2 max-h-[200px] overflow-y-auto">
                        {spaceIcons
                          .filter(icon => 
                            icon.label.toLowerCase().includes(iconSearchTerm.toLowerCase())
                          )
                          .map((icon) => {
                            const IconComponent = icon.icon;
                            return (
                              <button
                                key={icon.value}
                                type="button"
                                onClick={() => {
                                  setSelectedIcon(icon.value);
                                  setShowIconPicker(false);
                                  setIconSearchTerm('');
                                }}
                                className={`w-8 h-8 rounded-md flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors ${
                                  selectedIcon === icon.value ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                                }`}
                                title={icon.label}
                              >
                                <IconComponent className="w-4 h-4" />
                              </button>
                            );
                          })}
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
