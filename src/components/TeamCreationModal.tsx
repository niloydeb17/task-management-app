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
  Users, Search, Upload, Folder, Briefcase, Building, Target, 
  BarChart3, Lightbulb, Rocket, Wrench, Code, FileText, 
  TrendingUp, Heart, Star, Shield, Zap, Globe, Mail, Phone, 
  Calendar, Clock, Settings, User, Crown, Award, 
  Gift, Coffee, Home, Car, Plane, Camera, Music, Video, 
  Book, File, Download, Share, Link, Plus, Minus, Check, 
  X, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Edit, Trash, 
  Copy, Save, RefreshCw, RotateCcw, Play, Pause, Volume2, 
  VolumeX, Mic, Bell, Lock, Unlock, Eye, EyeOff, Sun, 
  Moon, Cloud, CloudRain
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
    icon?: string;
  }) => Promise<void>;
}

const teamTypes = [
  { value: 'design', label: 'Design', color: '#8B5CF6', description: 'UI/UX, Graphics, Branding', icon: '🎨' },
  { value: 'content', label: 'Content', color: '#F59E0B', description: 'Writing, Marketing, Social', icon: '📝' },
  { value: 'development', label: 'Development', color: '#3B82F6', description: 'Frontend, Backend, Mobile', icon: '💻' },
  { value: 'marketing', label: 'Marketing', color: '#EF4444', description: 'Growth, Campaigns, Analytics', icon: '📈' },
  { value: 'other', label: 'Other', color: '#6B7280', description: 'General purpose team', icon: '👥' }
];

// Simple icon mapping with safe fallbacks
const iconMap: Record<string, any> = {
  'Folder': Folder,
  'Users': Users,
  'Code': Code,
  'FileText': FileText,
  'TrendingUp': TrendingUp,
  'Wrench': Wrench,
  'Lightbulb': Lightbulb,
  'Rocket': Rocket,
  'Building': Building,
  'Target': Target,
  'BarChart3': BarChart3,
  'Briefcase': Briefcase,
  'Heart': Heart,
  'Star': Star,
  'Shield': Shield,
  'Zap': Zap,
  'Globe': Globe,
  'Mail': Mail,
  'Phone': Phone,
  'Calendar': Calendar,
  'Clock': Clock,
  'Settings': Settings,
  'User': User,
  'Crown': Crown,
  'Award': Award,
  'Gift': Gift,
  'Coffee': Coffee,
  'Home': Home,
  'Car': Car,
  'Plane': Plane,
  'Camera': Camera,
  'Music': Music,
  'Video': Video,
  'Book': Book,
  'File': File,
  'Download': Download,
  'Share': Share,
  'Link': Link,
  'Plus': Plus,
  'Minus': Minus,
  'Check': Check,
  'X': X,
  'ArrowRight': ArrowRight,
  'ArrowLeft': ArrowLeft,
  'ArrowUp': ArrowUp,
  'ArrowDown': ArrowDown,
  'Edit': Edit,
  'Trash': Trash,
  'Copy': Copy,
  'Save': Save,
  'Refresh': RefreshCw,
  'RotateCcw': RotateCcw,
  'Play': Play,
  'Pause': Pause,
  'Volume2': Volume2,
  'VolumeX': VolumeX,
  'Mic': Mic,
  'Bell': Bell,
  'Lock': Lock,
  'Unlock': Unlock,
  'Eye': Eye,
  'EyeOff': EyeOff,
  'Sun': Sun,
  'Moon': Moon,
  'Cloud': Cloud,
  'CloudRain': CloudRain,
};

const spaceIcons = [
  { value: 'Folder', label: 'Folder' },
  { value: 'Users', label: 'Team' },
  { value: 'Code', label: 'Development' },
  { value: 'FileText', label: 'Content' },
  { value: 'TrendingUp', label: 'Marketing' },
  { value: 'Wrench', label: 'Engineering' },
  { value: 'Lightbulb', label: 'Ideas' },
  { value: 'Rocket', label: 'Projects' },
  { value: 'Building', label: 'Business' },
  { value: 'Target', label: 'Goals' },
  { value: 'BarChart3', label: 'Analytics' },
  { value: 'Briefcase', label: 'Work' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Star', label: 'Star' },
  { value: 'Shield', label: 'Security' },
  { value: 'Zap', label: 'Energy' },
  { value: 'Globe', label: 'Global' },
  { value: 'Mail', label: 'Email' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Calendar', label: 'Calendar' },
  { value: 'Clock', label: 'Time' },
  { value: 'Settings', label: 'Settings' },
  { value: 'User', label: 'User' },
  { value: 'Crown', label: 'Premium' },
  { value: 'Award', label: 'Award' },
  { value: 'Gift', label: 'Gift' },
  { value: 'Coffee', label: 'Coffee' },
  { value: 'Home', label: 'Home' },
  { value: 'Car', label: 'Transport' },
  { value: 'Plane', label: 'Travel' },
  { value: 'Camera', label: 'Camera' },
  { value: 'Music', label: 'Music' },
  { value: 'Video', label: 'Video' },
  { value: 'Book', label: 'Book' },
  { value: 'File', label: 'File' },
  { value: 'Download', label: 'Download' },
  { value: 'Share', label: 'Share' },
  { value: 'Link', label: 'Link' },
  { value: 'Plus', label: 'Add' },
  { value: 'Minus', label: 'Remove' },
  { value: 'Check', label: 'Check' },
  { value: 'X', label: 'Close' },
  { value: 'ArrowRight', label: 'Right Arrow' },
  { value: 'ArrowLeft', label: 'Left Arrow' },
  { value: 'ArrowUp', label: 'Up Arrow' },
  { value: 'ArrowDown', label: 'Down Arrow' },
  { value: 'Edit', label: 'Edit' },
  { value: 'Trash', label: 'Delete' },
  { value: 'Copy', label: 'Copy' },
  { value: 'Save', label: 'Save' },
  { value: 'RefreshCw', label: 'Refresh' },
  { value: 'RotateCcw', label: 'Undo' },
  { value: 'Play', label: 'Play' },
  { value: 'Pause', label: 'Pause' },
  { value: 'Volume2', label: 'Volume' },
  { value: 'VolumeX', label: 'Mute' },
  { value: 'Mic', label: 'Microphone' },
  { value: 'Bell', label: 'Notification' },
  { value: 'Lock', label: 'Lock' },
  { value: 'Unlock', label: 'Unlock' },
  { value: 'Eye', label: 'View' },
  { value: 'EyeOff', label: 'Hide' },
  { value: 'Sun', label: 'Sun' },
  { value: 'Moon', label: 'Moon' },
  { value: 'Cloud', label: 'Cloud' },
  { value: 'CloudRain', label: 'Rain' },
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
        isPrivate,
        icon: selectedIcon
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
                      const IconComponent = iconMap[selectedIcon] || Folder;
                      return <IconComponent className="w-5 h-5" />;
                    })()}
                  </button>
                  
                  {/* Simple Icon Picker */}
                  {showIconPicker && (
                    <div className="absolute top-12 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
                      {/* Search Input */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search icons..."
                          value={iconSearchTerm}
                          onChange={(e) => setIconSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Icon Grid */}
                      <div className="grid grid-cols-8 gap-2 max-h-[200px] overflow-y-auto">
                        {spaceIcons
                          .filter(icon => 
                            icon.label.toLowerCase().includes(iconSearchTerm.toLowerCase())
                          )
                          .map((icon) => {
                            const IconComponent = iconMap[icon.value] || Folder;
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
