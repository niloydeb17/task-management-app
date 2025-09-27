-- Migration: Add handoff system support
-- This migration adds support for cross-team task handoffs

-- Add handoff status to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS handoff_status VARCHAR(20) DEFAULT 'none' 
  CHECK (handoff_status IN ('none', 'pending_handoff', 'handed_off', 'accepted', 'rejected'));

-- Add source team tracking for handed off tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add handoff notes and requirements
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS handoff_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS handoff_requirements TEXT[] DEFAULT '{}';

-- Add handoff timestamp
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS handoff_at TIMESTAMP WITH TIME ZONE;

-- Create handoffs table for detailed handoff tracking
CREATE TABLE IF NOT EXISTS handoffs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    from_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    to_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    handoff_data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    handoff_notes TEXT,
    requirements TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_reason TEXT
);

-- Create indexes for handoff queries
CREATE INDEX IF NOT EXISTS idx_handoffs_task_id ON handoffs(task_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_from_team_id ON handoffs(from_team_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_to_team_id ON handoffs(to_team_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_status ON handoffs(status);
CREATE INDEX IF NOT EXISTS idx_tasks_handoff_status ON tasks(handoff_status);
CREATE INDEX IF NOT EXISTS idx_tasks_source_team_id ON tasks(source_team_id);

-- Update board templates to include backlog column
UPDATE board_templates 
SET columns = jsonb_set(
    columns, 
    '{0}', 
    '{"id": "backlog", "name": "Backlog", "order": 0, "color": "#6B7280", "isHandoffColumn": true, "isCompleted": false}'::jsonb
)
WHERE team_type IN ('design', 'content', 'development', 'marketing', 'other');

-- Add backlog column to existing teams' board templates
UPDATE teams 
SET board_template = jsonb_set(
    board_template,
    '{columns}',
    (
        SELECT jsonb_agg(
            CASE 
                WHEN col->>'id' = 'backlog' THEN col
                ELSE jsonb_set(col, '{order}', to_jsonb((col->>'order')::int + 1))
            END
            ORDER BY (col->>'order')::int
        )
        FROM jsonb_array_elements(board_template->'columns') AS col
    )
)
WHERE NOT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(board_template->'columns') AS col 
    WHERE col->>'id' = 'backlog'
);

-- Insert backlog column at the beginning if it doesn't exist
UPDATE teams 
SET board_template = jsonb_set(
    board_template,
    '{columns}',
    (
        '{"id": "backlog", "name": "Backlog", "order": 0, "color": "#6B7280", "isHandoffColumn": true, "isCompleted": false}'::jsonb
        || jsonb_agg(
            jsonb_set(col, '{order}', to_jsonb((col->>'order')::int + 1))
            ORDER BY (col->>'order')::int
        )
    )
)
WHERE NOT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(board_template->'columns') AS col 
    WHERE col->>'id' = 'backlog'
);

-- Create function to handle task handoff
CREATE OR REPLACE FUNCTION handoff_task(
    p_task_id UUID,
    p_to_team_id UUID,
    p_handoff_notes TEXT DEFAULT NULL,
    p_requirements TEXT[] DEFAULT '{}',
    p_handoff_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_handoff_id UUID;
    v_from_team_id UUID;
    v_current_team_id UUID;
BEGIN
    -- Get current team and validate task exists
    SELECT team_id INTO v_current_team_id
    FROM tasks 
    WHERE id = p_task_id;
    
    IF v_current_team_id IS NULL THEN
        RAISE EXCEPTION 'Task not found';
    END IF;
    
    -- Get source team (original team if this is a re-handoff)
    SELECT COALESCE(source_team_id, team_id) INTO v_from_team_id
    FROM tasks 
    WHERE id = p_task_id;
    
    -- Create handoff record
    INSERT INTO handoffs (
        task_id,
        from_team_id,
        to_team_id,
        handoff_data,
        handoff_notes,
        requirements
    ) VALUES (
        p_task_id,
        v_from_team_id,
        p_to_team_id,
        p_handoff_data,
        p_handoff_notes,
        p_requirements
    ) RETURNING id INTO v_handoff_id;
    
    -- Update task
    UPDATE tasks 
    SET 
        team_id = p_to_team_id,
        column_id = 'backlog',
        handoff_status = 'handed_off',
        source_team_id = v_from_team_id,
        handoff_notes = p_handoff_notes,
        handoff_requirements = p_requirements,
        handoff_at = NOW(),
        updated_at = NOW()
    WHERE id = p_task_id;
    
    -- Add to handoff history
    UPDATE tasks 
    SET handoff_history = handoff_history || jsonb_build_object(
        'id', v_handoff_id,
        'fromTeamId', v_from_team_id,
        'toTeamId', p_to_team_id,
        'handoffData', p_handoff_data,
        'status', 'pending',
        'createdAt', NOW()
    )
    WHERE id = p_task_id;
    
    RETURN v_handoff_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to accept handoff
CREATE OR REPLACE FUNCTION accept_handoff(p_handoff_id UUID) RETURNS BOOLEAN AS $$
DECLARE
    v_task_id UUID;
    v_to_team_id UUID;
BEGIN
    -- Get handoff details
    SELECT task_id, to_team_id INTO v_task_id, v_to_team_id
    FROM handoffs 
    WHERE id = p_handoff_id AND status = 'pending';
    
    IF v_task_id IS NULL THEN
        RAISE EXCEPTION 'Handoff not found or already processed';
    END IF;
    
    -- Update handoff status
    UPDATE handoffs 
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = p_handoff_id;
    
    -- Update task status
    UPDATE tasks 
    SET 
        handoff_status = 'accepted',
        updated_at = NOW()
    WHERE id = v_task_id;
    
    -- Update handoff history
    UPDATE tasks 
    SET handoff_history = jsonb_set(
        handoff_history,
        '{0,status}',
        '"accepted"'
    )
    WHERE id = v_task_id 
    AND handoff_history->0->>'id' = p_handoff_id::text;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to reject handoff
CREATE OR REPLACE FUNCTION reject_handoff(
    p_handoff_id UUID, 
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_task_id UUID;
    v_from_team_id UUID;
BEGIN
    -- Get handoff details
    SELECT h.task_id, h.from_team_id INTO v_task_id, v_from_team_id
    FROM handoffs h
    WHERE h.id = p_handoff_id AND h.status = 'pending';
    
    IF v_task_id IS NULL THEN
        RAISE EXCEPTION 'Handoff not found or already processed';
    END IF;
    
    -- Update handoff status
    UPDATE handoffs 
    SET 
        status = 'rejected', 
        rejected_at = NOW(),
        rejected_reason = p_reason
    WHERE id = p_handoff_id;
    
    -- Move task back to source team
    UPDATE tasks 
    SET 
        team_id = v_from_team_id,
        column_id = 'complete', -- Move back to complete column
        handoff_status = 'rejected',
        updated_at = NOW()
    WHERE id = v_task_id;
    
    -- Update handoff history
    UPDATE tasks 
    SET handoff_history = jsonb_set(
        handoff_history,
        '{0,status}',
        '"rejected"'
    )
    WHERE id = v_task_id 
    AND handoff_history->0->>'id' = p_handoff_id::text;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
