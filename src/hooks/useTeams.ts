"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Team {
  id: string;
  name: string;
  type: 'design' | 'content' | 'development' | 'marketing' | 'other';
  color: string;
  position?: number; // Added position field
  description?: string;
  isPrivate?: boolean;
  icon?: string;
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

export interface CreateTeamData {
  name: string;
  type: 'design' | 'content' | 'development' | 'marketing' | 'other';
  color?: string;
  description?: string;
  isPrivate?: boolean;
  icon?: string;
}

const defaultBoardTemplate = {
  columns: [
    { id: 'backlog', name: 'Backlog', color: '#6B7280', order: 0 },
    { id: 'todo', name: 'To Do', color: '#3B82F6', order: 1 },
    { id: 'in_progress', name: 'In Progress', color: '#F59E0B', order: 2 },
    { id: 'handover', name: 'Handover', color: '#8B5CF6', order: 3 },
    { id: 'done', name: 'Done', color: '#10B981', order: 4 }
  ]
};

const teamTypeColors = {
  design: '#8B5CF6',
  content: '#F59E0B', 
  development: '#3B82F6',
  marketing: '#EF4444',
  other: '#6B7280'
};

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch teams from database
  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch with position first, fallback to created_at if position column doesn't exist
      let { data, error: fetchError } = await supabase
        .from('teams')
        .select('*')
        .order('position', { ascending: true });

      // If position column doesn't exist, fallback to created_at ordering
      if (fetchError && fetchError.message.includes('position')) {
        console.log('Position column not found, using created_at ordering');
        const fallbackResult = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false });
        
        data = fallbackResult.data;
        fetchError = fallbackResult.error;
      }

      if (fetchError) {
        console.error('Error fetching teams:', fetchError);
        throw new Error(`Failed to fetch teams: ${fetchError.message}`);
      }

      // Ensure unique teams by ID
      const uniqueTeams = (data || []).filter((team, index, self) => 
        index === self.findIndex(t => t.id === team.id)
      );
      setTeams(uniqueTeams);
    } catch (err) {
      console.error('Fetch teams error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Create a new team
  const createTeam = async (teamData: CreateTeamData): Promise<Team | null> => {
    try {
      setError(null);

      const newTeam = {
        name: teamData.name,
        type: teamData.type,
        color: teamData.color || teamTypeColors[teamData.type],
        description: teamData.description || '',
        isPrivate: teamData.isPrivate || false,
        icon: teamData.icon || 'Folder',
        board_template: defaultBoardTemplate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('teams')
        .insert([newTeam])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating team:', insertError);
        throw new Error(`Failed to create team: ${insertError.message}`);
      }

      // Add to local state - check for duplicates
      setTeams(prev => {
        const teamExists = prev.some(team => team.id === data.id);
        if (teamExists) {
          console.log('Team already exists in local state, skipping add:', data.id);
          return prev;
        }
        return [data, ...prev];
      });
      
      return data;
    } catch (err) {
      console.error('Create team error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  // Update a team
  const updateTeam = async (teamId: string, updates: Partial<CreateTeamData>): Promise<Team | null> => {
    try {
      setError(null);

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error: updateError } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', teamId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating team:', updateError);
        throw new Error(`Failed to update team: ${updateError.message}`);
      }

      // Update local state
      setTeams(prev => prev.map(team => team.id === teamId ? data : team));
      
      return data;
    } catch (err) {
      console.error('Update team error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  // Delete a team
  const deleteTeam = async (teamId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (deleteError) {
        console.error('Error deleting team:', deleteError);
        throw new Error(`Failed to delete team: ${deleteError.message}`);
      }

      // Remove from local state
      setTeams(prev => prev.filter(team => team.id !== teamId));
      
      return true;
    } catch (err) {
      console.error('Delete team error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  // Update team positions (for reordering)
  const updateTeamPositions = async (teamUpdates: Array<{ id: string; position: number }>): Promise<boolean> => {
    try {
      setError(null);

      // Update each team's position
      for (const update of teamUpdates) {
        const { error: updateError } = await supabase
          .from('teams')
          .update({ 
            position: update.position,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);

        if (updateError) {
          // If position column doesn't exist, just update the timestamp
          if (updateError.message.includes('position')) {
            console.log(`Position column not found, updating timestamp only for team ${update.id}`);
            
            const { error: timestampError } = await supabase
              .from('teams')
              .update({ 
                updated_at: new Date().toISOString()
              })
              .eq('id', update.id);
            
            if (timestampError) {
              console.error(`Error updating team ${update.id}:`, timestampError);
              throw new Error(`Failed to update team: ${timestampError.message}`);
            }
          } else {
            console.error(`Error updating team ${update.id} position:`, updateError);
            throw new Error(`Failed to update team position: ${updateError.message}`);
          }
        }
      }

      // Update local state
      setTeams(prev => prev.map(team => {
        const update = teamUpdates.find(u => u.id === team.id);
        return update ? { ...team, position: update.position } : team;
      }));

      return true;
    } catch (err) {
      console.error('Update team positions error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  // Load teams on mount and set up real-time subscriptions
  useEffect(() => {
    fetchTeams();

    // Set up real-time subscription for teams table
    const teamsSubscription = supabase
      .channel('teams-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'teams' 
        }, 
        (payload) => {
          console.log('🔄 Real-time teams update:', payload);
          
          if (payload.eventType === 'UPDATE') {
            // Handle team updates (including position changes)
            setTeams(prev => {
              const updatedTeams = prev.map(team => 
                team.id === payload.new.id ? { ...team, ...payload.new } : team
              );
              
              // Ensure uniqueness and sort by position
              const uniqueTeams = updatedTeams.filter((team, index, self) => 
                index === self.findIndex(t => t.id === team.id)
              );
              return uniqueTeams.sort((a, b) => (a.position || 0) - (b.position || 0));
            });
          } else if (payload.eventType === 'INSERT') {
            // Handle new team creation - check if team already exists
            setTeams(prev => {
              const newTeam = payload.new as Team;
              const teamExists = prev.some(team => team.id === newTeam.id);
              if (teamExists) {
                console.log('Team already exists, skipping insert:', newTeam.id);
                return prev;
              }
              
              const newTeams = [...prev, newTeam];
              return newTeams.sort((a, b) => (a.position || 0) - (b.position || 0));
            });
          } else if (payload.eventType === 'DELETE') {
            // Handle team deletion
            setTeams(prev => prev.filter(team => team.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      teamsSubscription.unsubscribe();
    };
  }, []);

  return {
    teams,
    loading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    updateTeamPositions,
    refetch: fetchTeams
  };
}
