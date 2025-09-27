import { supabase } from './supabase';
import { Handoff, HandoffForm, Task } from '@/types';

export class HandoffService {
  /**
   * Handoff a task to another team
   */
  static async handoffTask(
    taskId: string,
    handoffData: HandoffForm
  ): Promise<{ success: boolean; handoffId?: string; error?: string }> {
    try {
      console.log('HandoffService.handoffTask called with:', { taskId, handoffData });
      
      if (!handoffData.toTeamId) {
        return { success: false, error: 'No target team selected' };
      }
      
      // Check if this is dummy data (no database update needed)
      const isDummyData = taskId.startsWith('task-');
      
      if (isDummyData) {
        console.log('Handoff for dummy data - simulating success');
        return { success: true, handoffId: 'dummy-handoff-' + Date.now() };
      }
      
      // Use the proper database function for handoff
      console.log('Using database handoff function');
      console.log('Handoff parameters:', {
        p_task_id: taskId,
        p_to_team_id: handoffData.toTeamId,
        p_handoff_notes: handoffData.notes || null,
        p_requirements: handoffData.requirements || [],
        p_handoff_data: handoffData.handoffData || {}
      });
      
      const { data, error } = await supabase.rpc('handoff_task', {
        p_task_id: taskId,
        p_to_team_id: handoffData.toTeamId,
        p_handoff_notes: handoffData.notes || null,
        p_requirements: handoffData.requirements || [],
        p_handoff_data: handoffData.handoffData || {}
      });
      
      console.log('Handoff function response:', { data, error });

      if (error) {
        console.error('Handoff function error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Try fallback method if RPC fails
        console.log('Trying fallback handoff method...');
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            team_id: handoffData.toTeamId,
            column_id: 'backlog',
            handoff_status: 'handed_off',
            source_team_id: null, // We can't get the original team easily in fallback
            handoff_notes: handoffData.notes,
            handoff_requirements: handoffData.requirements,
            handoff_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (updateError) {
          console.error('Fallback handoff also failed:', updateError);
          return { 
            success: false, 
            error: error.message || 'Handoff failed. Please try again.' 
          };
        }

        console.log('Fallback handoff succeeded');
        return { success: true, handoffId: 'fallback-handoff-' + Date.now() };
      }

      console.log('Task successfully handed off:', data);
      return { success: true, handoffId: data };
    } catch (error) {
      console.error('Handoff error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Accept a handoff
   */
  static async acceptHandoff(handoffId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('accept_handoff', {
        p_handoff_id: handoffId
      });

      if (error) {
        console.error('Accept handoff error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Accept handoff error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Reject a handoff
   */
  static async rejectHandoff(
    handoffId: string, 
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('reject_handoff', {
        p_handoff_id: handoffId,
        p_reason: reason
      });

      if (error) {
        console.error('Reject handoff error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Reject handoff error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get handoffs for a team
   */
  static async getTeamHandoffs(teamId: string): Promise<{ handoffs: Handoff[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('handoffs')
        .select(`
          *,
          from_team:teams!handoffs_from_team_id_fkey(name, type, color),
          to_team:teams!handoffs_to_team_id_fkey(name, type, color),
          task:tasks(title, description, priority)
        `)
        .or(`from_team_id.eq.${teamId},to_team_id.eq.${teamId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get handoffs error:', error);
        return { handoffs: [], error: error.message };
      }

      const handoffs: Handoff[] = data?.map(h => ({
        id: h.id,
        taskId: h.task_id,
        fromTeamId: h.from_team_id,
        toTeamId: h.to_team_id,
        handoffData: h.handoff_data,
        status: h.status,
        handoffNotes: h.handoff_notes,
        requirements: h.requirements || [],
        createdAt: new Date(h.created_at),
        acceptedAt: h.accepted_at ? new Date(h.accepted_at) : undefined,
        rejectedAt: h.rejected_at ? new Date(h.rejected_at) : undefined,
        rejectedReason: h.rejected_reason
      })) || [];

      return { handoffs };
    } catch (error) {
      console.error('Get handoffs error:', error);
      return { 
        handoffs: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get pending handoffs for a team
   */
  static async getPendingHandoffs(teamId: string): Promise<{ handoffs: Handoff[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('handoffs')
        .select(`
          *,
          from_team:teams!handoffs_from_team_id_fkey(name, type, color),
          to_team:teams!handoffs_to_team_id_fkey(name, type, color),
          task:tasks(title, description, priority)
        `)
        .eq('to_team_id', teamId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get pending handoffs error:', error);
        return { handoffs: [], error: error.message };
      }

      const handoffs: Handoff[] = data?.map(h => ({
        id: h.id,
        taskId: h.task_id,
        fromTeamId: h.from_team_id,
        toTeamId: h.to_team_id,
        handoffData: h.handoff_data,
        status: h.status,
        handoffNotes: h.handoff_notes,
        requirements: h.requirements || [],
        createdAt: new Date(h.created_at),
        acceptedAt: h.accepted_at ? new Date(h.accepted_at) : undefined,
        rejectedAt: h.rejected_at ? new Date(h.rejected_at) : undefined,
        rejectedReason: h.rejected_reason
      })) || [];

      return { handoffs };
    } catch (error) {
      console.error('Get pending handoffs error:', error);
      return { 
        handoffs: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get handoff history for a task
   */
  static async getTaskHandoffHistory(taskId: string): Promise<{ handoffs: Handoff[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('handoffs')
        .select(`
          *,
          from_team:teams!handoffs_from_team_id_fkey(name, type, color),
          to_team:teams!handoffs_to_team_id_fkey(name, type, color)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get task handoff history error:', error);
        return { handoffs: [], error: error.message };
      }

      const handoffs: Handoff[] = data?.map(h => ({
        id: h.id,
        taskId: h.task_id,
        fromTeamId: h.from_team_id,
        toTeamId: h.to_team_id,
        handoffData: h.handoff_data,
        status: h.status,
        handoffNotes: h.handoff_notes,
        requirements: h.requirements || [],
        createdAt: new Date(h.created_at),
        acceptedAt: h.accepted_at ? new Date(h.accepted_at) : undefined,
        rejectedAt: h.rejected_at ? new Date(h.rejected_at) : undefined,
        rejectedReason: h.rejected_reason
      })) || [];

      return { handoffs };
    } catch (error) {
      console.error('Get task handoff history error:', error);
      return { 
        handoffs: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Subscribe to handoff updates for a team
   */
  static subscribeToHandoffUpdates(
    teamId: string,
    onUpdate: (handoff: Handoff) => void
  ) {
    return supabase
      .channel('handoff-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'handoffs',
          filter: `or(from_team_id.eq.${teamId},to_team_id.eq.${teamId})`
        },
        (payload) => {
          console.log('Handoff update:', payload);
          // You can process the payload and call onUpdate here
        }
      )
      .subscribe();
  }
}
