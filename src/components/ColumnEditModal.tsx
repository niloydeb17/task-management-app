"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

interface ColumnEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  column: {
    id: string;
    name: string;
    color: string;
    position: number;
  } | null;
  onColumnUpdated: () => void;
  onColumnDeleted: () => void;
  initialDeleteMode?: boolean;
}

const COLORS = [
  { name: "Gray", value: "#6B7280" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
];

export function ColumnEditModal({
  isOpen,
  onClose,
  teamId,
  column,
  onColumnUpdated,
  onColumnDeleted,
  initialDeleteMode = false,
}: ColumnEditModalProps) {
  const [columnName, setColumnName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6B7280");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (column) {
      setColumnName(column.name);
      setSelectedColor(column.color);
    }
    if (initialDeleteMode) {
      setShowDeleteConfirm(true);
    } else {
      setShowDeleteConfirm(false);
    }
  }, [column, initialDeleteMode]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!columnName.trim() || !column) return;

    setIsLoading(true);
    try {
      // Get current team data
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("board_template")
        .eq("id", teamId)
        .single();

      if (teamError) throw teamError;

      const currentTemplate = team.board_template || {};
      const currentColumns = currentTemplate.columns || [];

      // Generate new column ID if name changed
      const newColumnId = columnName.toLowerCase().replace(/\s+/g, "_");
      
      // Check if new name conflicts with existing columns (excluding current column)
      if (newColumnId !== column.id && currentColumns.some((col: any) => col.id === newColumnId)) {
        alert("A column with this name already exists!");
        setIsLoading(false);
        return;
      }

      // Update the column
      const updatedColumns = currentColumns.map((col: any) => 
        col.id === column.id 
          ? {
              ...col,
              id: newColumnId,
              name: columnName.trim(),
              color: selectedColor,
            }
          : col
      );

      const updatedTemplate = {
        ...currentTemplate,
        columns: updatedColumns,
      };

      const { error: updateError } = await supabase
        .from("teams")
        .update({ board_template: updatedTemplate })
        .eq("id", teamId);

      if (updateError) throw updateError;

      // Update tasks that reference this column
      if (newColumnId !== column.id) {
        const { error: tasksError } = await supabase
          .from("tasks")
          .update({ column_id: newColumnId })
          .eq("column_id", column.id)
          .eq("team_id", teamId);

        if (tasksError) {
          console.warn("Error updating task column references:", tasksError);
        }
      }

      console.log("✅ Column updated successfully:", columnName);
      console.log("🔄 Real-time update will sync across all connected clients");
      onColumnUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating column:", error);
      alert("Failed to update column. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!column) return;

    setIsLoading(true);
    try {
      // Get current team data
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("board_template")
        .eq("id", teamId)
        .single();

      if (teamError) throw teamError;

      const currentTemplate = team.board_template || {};
      const currentColumns = currentTemplate.columns || [];

      // Remove the column
      const updatedColumns = currentColumns.filter((col: any) => col.id !== column.id);

      const updatedTemplate = {
        ...currentTemplate,
        columns: updatedColumns,
      };

      const { error: updateError } = await supabase
        .from("teams")
        .update({ board_template: updatedTemplate })
        .eq("id", teamId);

      if (updateError) throw updateError;

      // Delete all tasks in this column
      const { error: tasksError } = await supabase
        .from("tasks")
        .delete()
        .eq("column_id", column.id)
        .eq("team_id", teamId);

      if (tasksError) {
        console.warn("Error deleting tasks in column:", tasksError);
      }

      console.log("✅ Column deleted successfully:", column.name);
      console.log("🔄 Real-time update will sync across all connected clients");
      onColumnDeleted();
      onClose();
    } catch (error) {
      console.error("Error deleting column:", error);
      alert("Failed to delete column. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setColumnName("");
      setSelectedColor("#6B7280");
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  if (!column) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Column</DialogTitle>
          <DialogDescription>
            Update the column name and color, or delete the column entirely.
          </DialogDescription>
        </DialogHeader>
        
        {!showDeleteConfirm ? (
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="column-name">Column Name</Label>
                <Input
                  id="column-name"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  placeholder="e.g., Review, Testing, Staging"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        selectedColor === color.value
                          ? "border-gray-900 scale-110"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color.value)}
                      disabled={isLoading}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                Delete Column
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !columnName.trim()}>
                  {isLoading ? "Updating..." : "Update Column"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Delete Column
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete &quot;{column.name}&quot;? This will also delete all tasks in this column. This action cannot be undone.
              </p>
            </div>
            <DialogFooter className="flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete Column"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
