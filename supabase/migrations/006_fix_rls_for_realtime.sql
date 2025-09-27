-- Fix RLS policies to enable real-time functionality
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view tasks from their team" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their team" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in their team" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their team" ON tasks;

DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;
DROP POLICY IF EXISTS "Team leads can update their team" ON teams;
DROP POLICY IF EXISTS "Admins can manage all teams" ON teams;

-- Create permissive policies for real-time functionality
CREATE POLICY "Allow all operations on tasks" ON tasks
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on teams" ON teams
    FOR ALL USING (true);

-- Enable real-time for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
