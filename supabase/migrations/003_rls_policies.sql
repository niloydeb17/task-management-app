-- Enable Row Level Security on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_templates ENABLE ROW LEVEL SECURITY;

-- Teams policies - Allow all operations for now to enable real-time
-- TODO: Implement proper authentication-based RLS later
CREATE POLICY "Allow all operations on teams" ON teams
    FOR ALL USING (true);

-- Users policies
CREATE POLICY "Users can view team members" ON users
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Team leads can manage team members" ON users
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM users 
            WHERE id = auth.uid() AND role = 'lead'
        )
    );

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Tasks policies - Allow all operations for now to enable real-time
-- TODO: Implement proper authentication-based RLS later
CREATE POLICY "Allow all operations on tasks" ON tasks
    FOR ALL USING (true);

-- Team streaks policies
CREATE POLICY "Users can view team streaks" ON team_streaks
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can update team streaks" ON team_streaks
    FOR UPDATE USING (true);

-- Achievements policies
CREATE POLICY "Everyone can view achievements" ON achievements
    FOR SELECT USING (true);

CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view team achievements" ON team_achievements
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM users WHERE id = auth.uid()
        )
    );

-- Board templates policies
CREATE POLICY "Everyone can view board templates" ON board_templates
    FOR SELECT USING (true);

-- Create a function to handle task handoffs
CREATE OR REPLACE FUNCTION create_task_handoff(
    task_id UUID,
    from_team_id UUID,
    to_team_id UUID,
    handoff_notes TEXT DEFAULT '',
    handoff_requirements TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    handoff_id UUID;
    handoff_data JSONB;
BEGIN
    -- Create handoff data
    handoff_data := jsonb_build_object(
        'notes', handoff_notes,
        'requirements', handoff_requirements,
        'files', '[]'::jsonb,
        'specifications', '{}'::jsonb
    );
    
    -- Generate handoff ID
    handoff_id := uuid_generate_v4();
    
    -- Add handoff to task history
    UPDATE tasks 
    SET 
        handoff_history = handoff_history || jsonb_build_object(
            'id', handoff_id,
            'fromTeamId', from_team_id,
            'toTeamId', to_team_id,
            'taskId', task_id,
            'handoffData', handoff_data,
            'status', 'pending',
            'createdAt', NOW()
        ),
        updated_at = NOW()
    WHERE id = task_id;
    
    RETURN handoff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update team streaks
CREATE OR REPLACE FUNCTION update_team_streak(team_id_param UUID)
RETURNS VOID AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    last_activity_date DATE;
    current_streak INTEGER;
    longest_streak INTEGER;
BEGIN
    -- Get current streak data
    SELECT last_activity_date, current_streak, longest_streak
    INTO last_activity_date, current_streak, longest_streak
    FROM team_streaks
    WHERE team_id = team_id_param;
    
    -- If no streak record exists, create one
    IF NOT FOUND THEN
        INSERT INTO team_streaks (team_id, current_streak, longest_streak, last_activity_date)
        VALUES (team_id_param, 1, 1, current_date);
        RETURN;
    END IF;
    
    -- Check if activity was yesterday (continuing streak) or today (same day)
    IF last_activity_date = current_date THEN
        -- Same day, no change needed
        RETURN;
    ELSIF last_activity_date = current_date - INTERVAL '1 day' THEN
        -- Continuing streak
        current_streak := current_streak + 1;
    ELSE
        -- Streak broken, reset to 1
        current_streak := 1;
    END IF;
    
    -- Update longest streak if current is higher
    IF current_streak > longest_streak THEN
        longest_streak := current_streak;
    END IF;
    
    -- Update the streak record
    UPDATE team_streaks
    SET 
        current_streak = current_streak,
        longest_streak = longest_streak,
        last_activity_date = current_date,
        updated_at = NOW()
    WHERE team_id = team_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update team streaks when tasks are completed
CREATE OR REPLACE FUNCTION trigger_update_team_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update streak if task was just completed
    IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
        PERFORM update_team_streak(NEW.team_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_streak_trigger
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_team_streak();
