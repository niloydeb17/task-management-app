-- Insert default board templates for each team type
INSERT INTO board_templates (name, team_type, columns) VALUES
('Design Team Template', 'design', '[
    {"id": "backlog", "name": "Backlog", "order": 0, "color": "#6B7280", "isHandoffColumn": false},
    {"id": "todo", "name": "To Do", "order": 1, "color": "#3B82F6", "isHandoffColumn": false},
    {"id": "in_progress", "name": "In Progress", "order": 2, "color": "#F59E0B", "isHandoffColumn": false},
    {"id": "handover", "name": "Handover", "order": 3, "color": "#10B981", "isHandoffColumn": true, "targetTeamId": "content"},
    {"id": "done", "name": "Done", "order": 4, "color": "#6B7280", "isHandoffColumn": false}
]'),

('Content Team Template', 'content', '[
    {"id": "research", "name": "Research", "order": 0, "color": "#8B5CF6", "isHandoffColumn": false},
    {"id": "draft", "name": "Draft", "order": 1, "color": "#3B82F6", "isHandoffColumn": false},
    {"id": "review", "name": "Review", "order": 2, "color": "#F59E0B", "isHandoffColumn": false},
    {"id": "publish", "name": "Publish", "order": 3, "color": "#10B981", "isHandoffColumn": false},
    {"id": "archive", "name": "Archive", "order": 4, "color": "#6B7280", "isHandoffColumn": false}
]'),

('Development Team Template', 'development', '[
    {"id": "planning", "name": "Planning", "order": 0, "color": "#8B5CF6", "isHandoffColumn": false},
    {"id": "development", "name": "Development", "order": 1, "color": "#3B82F6", "isHandoffColumn": false},
    {"id": "testing", "name": "Testing", "order": 2, "color": "#F59E0B", "isHandoffColumn": false},
    {"id": "deploy", "name": "Deploy", "order": 3, "color": "#10B981", "isHandoffColumn": false},
    {"id": "monitor", "name": "Monitor", "order": 4, "color": "#6B7280", "isHandoffColumn": false}
]'),

('Marketing Team Template', 'marketing', '[
    {"id": "strategy", "name": "Strategy", "order": 0, "color": "#8B5CF6", "isHandoffColumn": false},
    {"id": "create", "name": "Create", "order": 1, "color": "#3B82F6", "isHandoffColumn": false},
    {"id": "review", "name": "Review", "order": 2, "color": "#F59E0B", "isHandoffColumn": false},
    {"id": "launch", "name": "Launch", "order": 3, "color": "#10B981", "isHandoffColumn": false},
    {"id": "analyze", "name": "Analyze", "order": 4, "color": "#6B7280", "isHandoffColumn": false}
]');

-- Insert sample teams
INSERT INTO teams (name, type, color, board_template) VALUES
('Design Team', 'design', '#3B82F6', '{"id": "design_template", "name": "Design Team Template", "columns": [
    {"id": "backlog", "name": "Backlog", "order": 0, "color": "#6B7280", "isHandoffColumn": false},
    {"id": "todo", "name": "To Do", "order": 1, "color": "#3B82F6", "isHandoffColumn": false},
    {"id": "in_progress", "name": "In Progress", "order": 2, "color": "#F59E0B", "isHandoffColumn": false},
    {"id": "handover", "name": "Handover", "order": 3, "color": "#10B981", "isHandoffColumn": true, "targetTeamId": "content"},
    {"id": "done", "name": "Done", "order": 4, "color": "#6B7280", "isHandoffColumn": false}
]}'),
('Content Team', 'content', '#10B981', '{"id": "content_template", "name": "Content Team Template", "columns": [
    {"id": "research", "name": "Research", "order": 0, "color": "#8B5CF6", "isHandoffColumn": false},
    {"id": "draft", "name": "Draft", "order": 1, "color": "#3B82F6", "isHandoffColumn": false},
    {"id": "review", "name": "Review", "order": 2, "color": "#F59E0B", "isHandoffColumn": false},
    {"id": "publish", "name": "Publish", "order": 3, "color": "#10B981", "isHandoffColumn": false},
    {"id": "archive", "name": "Archive", "order": 4, "color": "#6B7280", "isHandoffColumn": false}
]}'),
('Development Team', 'development', '#8B5CF6', '{"id": "dev_template", "name": "Development Team Template", "columns": [
    {"id": "planning", "name": "Planning", "order": 0, "color": "#8B5CF6", "isHandoffColumn": false},
    {"id": "development", "name": "Development", "order": 1, "color": "#3B82F6", "isHandoffColumn": false},
    {"id": "testing", "name": "Testing", "order": 2, "color": "#F59E0B", "isHandoffColumn": false},
    {"id": "deploy", "name": "Deploy", "order": 3, "color": "#10B981", "isHandoffColumn": false},
    {"id": "monitor", "name": "Monitor", "order": 4, "color": "#6B7280", "isHandoffColumn": false}
]}');

-- Insert sample users
INSERT INTO users (email, name, team_id, role) VALUES
('sarah@taskflow.com', 'Sarah Johnson', (SELECT id FROM teams WHERE name = 'Design Team'), 'lead'),
('mike@taskflow.com', 'Mike Chen', (SELECT id FROM teams WHERE name = 'Development Team'), 'lead'),
('lisa@taskflow.com', 'Lisa Rodriguez', (SELECT id FROM teams WHERE name = 'Content Team'), 'lead'),
('john@taskflow.com', 'John Smith', (SELECT id FROM teams WHERE name = 'Design Team'), 'member'),
('emma@taskflow.com', 'Emma Wilson', (SELECT id FROM teams WHERE name = 'Development Team'), 'member');

-- Insert sample tasks
INSERT INTO tasks (title, description, priority, team_id, column_id, tags, due_date) VALUES
('Design new landing page', 'Create a modern, responsive landing page design for the new product launch', 'high', (SELECT id FROM teams WHERE name = 'Design Team'), 'todo', ARRAY['UI/UX', 'Landing Page'], NOW() + INTERVAL '3 days'),
('Mobile app wireframes', 'Design wireframes for the mobile application user interface', 'medium', (SELECT id FROM teams WHERE name = 'Design Team'), 'in_progress', ARRAY['Mobile', 'Wireframes'], NOW() + INTERVAL '5 days'),
('Website mockups', 'Create high-fidelity mockups for the website redesign', 'high', (SELECT id FROM teams WHERE name = 'Design Team'), 'handover', ARRAY['Mockups', 'Website'], NOW() + INTERVAL '2 days'),
('Blog post about new features', 'Write a comprehensive blog post about the latest product features', 'medium', (SELECT id FROM teams WHERE name = 'Content Team'), 'draft', ARRAY['Blog', 'Features'], NOW() + INTERVAL '4 days'),
('API documentation', 'Create comprehensive API documentation for developers', 'high', (SELECT id FROM teams WHERE name = 'Development Team'), 'development', ARRAY['API', 'Documentation'], NOW() + INTERVAL '6 days'),
('User authentication system', 'Implement secure user authentication and authorization', 'urgent', (SELECT id FROM teams WHERE name = 'Development Team'), 'planning', ARRAY['Auth', 'Security'], NOW() + INTERVAL '1 day');

-- Insert team streaks
INSERT INTO team_streaks (team_id, current_streak, longest_streak, total_tasks_completed) VALUES
((SELECT id FROM teams WHERE name = 'Design Team'), 7, 15, 24),
((SELECT id FROM teams WHERE name = 'Content Team'), 3, 12, 18),
((SELECT id FROM teams WHERE name = 'Development Team'), 5, 20, 31);

-- Insert sample achievements
INSERT INTO achievements (name, description, icon, type, criteria) VALUES
('First Week', 'Complete tasks for 7 consecutive days', '🔥', 'team', '{"type": "streak", "value": 7, "timeframe": "daily"}'),
('Task Master', 'Complete 50 tasks as a team', '🎯', 'team', '{"type": "tasks_completed", "value": 50, "timeframe": "all_time"}'),
('Handoff Hero', 'Successfully hand off 10 tasks to other teams', '🤝', 'team', '{"type": "handoffs", "value": 10, "timeframe": "all_time"}'),
('Speed Demon', 'Complete 5 tasks in a single day', '⚡', 'individual', '{"type": "tasks_completed", "value": 5, "timeframe": "daily"}'),
('Consistency King', 'Complete tasks for 30 consecutive days', '👑', 'individual', '{"type": "streak", "value": 30, "timeframe": "daily"}');
