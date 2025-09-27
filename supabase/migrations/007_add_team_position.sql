-- Add position column to teams table for ordering
ALTER TABLE teams ADD COLUMN position INTEGER DEFAULT 0;

-- Create index for better performance when sorting by position
CREATE INDEX idx_teams_position ON teams(position);

-- Update existing teams to have proper position values
-- This will set position based on created_at order
WITH ranked_teams AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_position
  FROM teams
)
UPDATE teams 
SET position = ranked_teams.new_position
FROM ranked_teams 
WHERE teams.id = ranked_teams.id;
