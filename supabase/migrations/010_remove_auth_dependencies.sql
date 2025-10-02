-- Remove authentication dependencies and simplify schema
-- This migration removes auth-related tables and policies

-- Drop authentication-related functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_team();
DROP FUNCTION IF EXISTS public.is_team_admin();
DROP FUNCTION IF EXISTS public.is_authenticated();
DROP FUNCTION IF EXISTS public.get_user_role();

-- Drop authentication-related triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Team members can view each other" ON public.users;
DROP POLICY IF EXISTS "Users can view own teams" ON public.teams;
DROP POLICY IF EXISTS "Team admins can update teams" ON public.teams;
DROP POLICY IF EXISTS "Team admins can insert teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view team tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert team tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update team tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete team tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view team streaks" ON public.team_streaks;
DROP POLICY IF EXISTS "Team admins can update streaks" ON public.team_streaks;
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can view team achievements" ON public.team_achievements;
DROP POLICY IF EXISTS "Team admins can insert team achievements" ON public.team_achievements;
DROP POLICY IF EXISTS "Anyone can view board templates" ON public.board_templates;

-- Disable RLS on all tables (since we're removing auth)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_templates DISABLE ROW LEVEL SECURITY;

-- Remove foreign key constraints that reference auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;

-- Update the users table to not reference auth.users
-- We'll keep the users table but make it independent
ALTER TABLE public.users DROP COLUMN IF EXISTS id;
ALTER TABLE public.users ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Update tasks table to handle missing assignee_id gracefully
ALTER TABLE public.tasks ALTER COLUMN assignee_id DROP NOT NULL;

-- Update user_achievements table to handle missing user_id gracefully  
ALTER TABLE public.user_achievements ALTER COLUMN user_id DROP NOT NULL;

-- Grant public access to all tables (no authentication required)
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.teams TO anon, authenticated;
GRANT ALL ON public.tasks TO anon, authenticated;
GRANT ALL ON public.board_templates TO anon, authenticated;
GRANT ALL ON public.team_streaks TO anon, authenticated;
GRANT ALL ON public.achievements TO anon, authenticated;
GRANT ALL ON public.user_achievements TO anon, authenticated;
GRANT ALL ON public.team_achievements TO anon, authenticated;

-- Create a simple function to generate a default user
CREATE OR REPLACE FUNCTION public.create_default_user()
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    INSERT INTO public.users (email, name, role)
    VALUES ('user@example.com', 'Default User', 'member')
    RETURNING id INTO user_id;
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;
