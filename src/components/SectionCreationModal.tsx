"use client";

import React, { useState } from "react";
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

interface SectionCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSectionCreated: () => void;
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

export function SectionCreationModal({
  isOpen,
  onClose,
  teamId,
  onSectionCreated,
}: SectionCreationModalProps) {
  const [sectionName, setSectionName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6B7280");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim()) return;

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

      // Generate new section ID
      const sectionId = sectionName.toLowerCase().replace(/\s+/g, "_");
      
      // Check if section already exists
      if (currentColumns.some((col: any) => col.id === sectionId)) {
        alert("A section with this name already exists!");
        setIsLoading(false);
        return;
      }

      // Create new section
      const newSection = {
        id: sectionId,
        name: sectionName.trim(),
        order: currentColumns.length,
        color: selectedColor,
        isHandoffColumn: false,
      };

      // Update team's board template
      const updatedColumns = [...currentColumns, newSection];
      const updatedTemplate = {
        ...currentTemplate,
        columns: updatedColumns,
      };

      const { error: updateError } = await supabase
        .from("teams")
        .update({ board_template: updatedTemplate })
        .eq("id", teamId);

      if (updateError) throw updateError;

      console.log("✅ Section created successfully:", newSection.name);
      console.log("🔄 Real-time update will sync across all connected clients");

      // Reset form and close modal
      setSectionName("");
      setSelectedColor("#6B7280");
      onSectionCreated();
      onClose();
    } catch (error) {
      console.error("Error creating section:", error);
      alert("Failed to create section. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSectionName("");
      setSelectedColor("#6B7280");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
          <DialogDescription>
            Create a new status column for your team's workflow.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="section-name">Section Name</Label>
              <Input
                id="section-name"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !sectionName.trim()}>
              {isLoading ? "Creating..." : "Create Section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
