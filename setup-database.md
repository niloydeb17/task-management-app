# Database Setup Instructions

Follow these steps to set up your TaskFlow database in Supabase:

## 1. Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `bijjbjbsncbwajokvxck`

## 2. Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of each migration file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_sample_data.sql`
   - `supabase/migrations/003_rls_policies.sql`
3. Click **Run** for each migration

### Option B: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref bijjbjbsncbwajokvxck

# Run migrations
supabase db push
```

## 3. Verify Setup

After running the migrations, you should see these tables in your database:

- ✅ `teams` - Team information
- ✅ `users` - User accounts and profiles
- ✅ `tasks` - Task management
- ✅ `board_templates` - Team board configurations
- ✅ `team_streaks` - Gamification data
- ✅ `achievements` - Achievement definitions
- ✅ `user_achievements` - User achievement unlocks
- ✅ `team_achievements` - Team achievement unlocks

## 4. Test the Connection

1. Go to your application: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
2. You should see the Supabase connection test showing "✅ Connected"
3. If there are any errors, check the browser console for details

## 5. Sample Data

The migrations include sample data:

- **3 Teams**: Design Team, Content Team, Development Team
- **5 Users**: Sarah (Design Lead), Mike (Dev Lead), Lisa (Content Lead), John (Design Member), Emma (Dev Member)
- **6 Sample Tasks**: Various tasks across different teams and statuses
- **3 Team Streaks**: Current streak data for each team
- **5 Achievements**: Sample achievements for gamification

## 6. Next Steps

Once the database is set up:

1. **Test the application** - Navigate through the dashboard
2. **Set up authentication** - Configure Better Auth
3. **Add real-time features** - Enable Supabase subscriptions
4. **Customize teams** - Add your own teams and users

## Troubleshooting

### Common Issues:

1. **Permission Denied**: Make sure you're logged into the correct Supabase project
2. **Table Already Exists**: If you've run migrations before, you may need to drop tables first
3. **RLS Errors**: Check that Row Level Security policies are properly applied

### Reset Database (if needed):

```sql
-- WARNING: This will delete all data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-run the migrations.

## Support

If you encounter any issues:

1. Check the Supabase logs in the dashboard
2. Verify your environment variables are correct
3. Ensure your Supabase project is active and not paused
4. Check the browser console for client-side errors
