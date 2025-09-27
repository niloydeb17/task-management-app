"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

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

interface TeamDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteTeam: (teamId: string) => Promise<void>;
  team: Team | null;
}

export function TeamDeleteModal({ isOpen, onClose, onDeleteTeam, team }: TeamDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!team) return;

    setIsDeleting(true);
    try {
      await onDeleteTeam(team.id);
      onClose();
    } catch (error) {
      console.error('Error deleting team:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <DialogTitle>Delete Team</DialogTitle>
              <DialogDescription className="mt-1">
                Are you sure you want to delete "{team?.name}"? This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Warning
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    This will permanently delete the team and all associated data including:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All tasks in this team</li>
                    <li>Team settings and configuration</li>
                    <li>Team history and activity</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="min-w-[100px]"
          >
            {isDeleting ? 'Deleting...' : 'Delete Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
