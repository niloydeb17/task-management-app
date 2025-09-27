-- Add position column to tasks table for ordering within columns
ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0;

-- Create index for better performance when sorting by position within columns
CREATE INDEX idx_tasks_column_position ON tasks(column_id, position);

-- Update existing tasks to have proper position values
-- This will set position based on created_at order within each column
WITH ranked_tasks AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY column_id ORDER BY created_at) - 1 as new_position
  FROM tasks
)
UPDATE tasks 
SET position = ranked_tasks.new_position
FROM ranked_tasks 
WHERE tasks.id = ranked_tasks.id;
