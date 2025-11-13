# 🚀 Communities Module - Quick Setup Guide

## ⚠️ Fix for "creator_id does not exist" Error

The updated SQL file now includes proper ordering and error handling.

---

## 📋 Setup Steps

### Step 1: Run the SQL Script

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the **ENTIRE contents** of `CREATE_COMMUNITIES_TABLES.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Step 2: Verify Setup

After running the script, you should see:

```
✅ COMMUNITIES MODULE SETUP COMPLETE!

Tables Created:
- communities (with creator_id, name, description, etc.)
- community_members (with user_id, community_id, role)
```

The script will also show verification queries at the bottom showing:
- Tables created
- Columns in each table
- RLS policies active
- Triggers created
- Indexes created

### Step 3: Test in Your App

1. **Log in** to your Sahaaya app
2. Navigate to **Communities** page
3. Click **Create Community**
4. Fill in the form:
   - Name: "Test Community"
   - Description: "This is a test community for testing purposes"
   - Category: Select any (e.g., "Medical")
   - Location: "Your City"
   - Accept guidelines ✓
5. Click **Create Community**
6. ✅ You should see success message and the community should appear

---

## 🔍 What Changed in the Updated SQL

### Fixed Issues:

1. **Proper Ordering**: Tables created before triggers
2. **Drop Existing Objects**: Safely removes old objects if re-running
3. **Error Handling**: Handles cases where objects already exist
4. **Foreign Key Explicit**: Uses `CONSTRAINT` for clarity
5. **Better Comments**: Documentation for each step
6. **Verification Queries**: Auto-run queries to verify setup
7. **Realtime Error Handling**: Won't fail if publication exists

### Key Improvements:

```sql
-- Old (problematic):
creator_id uuid REFERENCES auth.users(id)

-- New (explicit and clear):
creator_id uuid NOT NULL,
CONSTRAINT fk_creator FOREIGN KEY (creator_id) 
  REFERENCES auth.users(id) ON DELETE CASCADE
```

---

## 🐛 Troubleshooting

### Error: "relation auth.users does not exist"

**Solution:** Your Supabase project is set up correctly, but you need to be logged in. The `auth.users` table is created by Supabase Auth automatically.

### Error: "duplicate key value violates unique constraint"

**Solution:** You're trying to create the same community twice or join twice. This is prevented by the `unique_community_member` constraint.

### Error: "permission denied for table communities"

**Solution:** RLS is blocking you. Make sure you're authenticated when creating communities. Check your auth token is valid.

### Communities not showing in app

**Checklist:**
- [ ] Is user logged in? Check `await supabase.auth.getUser()`
- [ ] Did SQL script run successfully?
- [ ] Are there any console errors in browser?
- [ ] Check Supabase logs in Dashboard > Database > Logs

### Real-time updates not working

**Solution:**
1. Go to Supabase Dashboard > Database > Replication
2. Make sure `communities` and `community_members` tables have replication enabled
3. Click the toggle to enable if needed

---

## 🧪 Manual Testing

### Test 1: Create Community
```sql
-- Run in SQL Editor to verify table works
INSERT INTO communities (name, description, category, location, creator_id)
VALUES (
  'Test Community',
  'This is a test community created via SQL',
  'medical',
  'Test City',
  (SELECT id FROM auth.users LIMIT 1)
);

-- Check if it was created
SELECT * FROM communities;
```

### Test 2: Check Member Count
```sql
-- Should show member count as 1 (creator auto-added)
SELECT c.name, c.members_count, COUNT(cm.id) as actual_members
FROM communities c
LEFT JOIN community_members cm ON c.id = cm.community_id
GROUP BY c.id, c.name, c.members_count;
```

### Test 3: Check RLS Policies
```sql
-- View all RLS policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
ORDER BY tablename, policyname;
```

---

## 📊 Database Schema Reference

### communities table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Community name |
| description | text | Community description |
| category | text | medical, education, financial, food, shelter, emergency, other |
| location | text | Location string (optional) |
| creator_id | uuid | User who created (references auth.users) |
| is_verified | boolean | Verified status (default: false) |
| members_count | integer | Auto-updated member count (default: 1) |
| trust_rating | numeric | Trust score 0-5 (default: 0) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### community_members table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| community_id | uuid | References communities(id) |
| user_id | uuid | References auth.users(id) |
| role | text | 'admin' or 'member' |
| joined_at | timestamp | Join timestamp |

**Unique Constraint:** (community_id, user_id) - Prevents duplicate joins

---

## ✅ Expected Behavior

### When User Creates Community:
1. ✅ Community inserted into `communities` table
2. ✅ Creator auto-added to `community_members` as 'admin'
3. ✅ `members_count` is 1
4. ✅ Success toast appears in app
5. ✅ Community appears in "My Communities" tab
6. ✅ Other users see it in "Explore Communities" tab

### When User Joins Community:
1. ✅ Row inserted into `community_members`
2. ✅ `members_count` auto-increments
3. ✅ Community moves to "My Communities" tab
4. ✅ Success toast appears
5. ✅ Real-time update for all users viewing that community

### When User Leaves Community:
1. ✅ Row deleted from `community_members`
2. ✅ `members_count` auto-decrements
3. ✅ Community moves to "Explore Communities" tab
4. ✅ Success toast appears
5. ✅ Real-time update for all users

---

## 🎯 Success Indicators

After setup, you should be able to:

- [x] Run SQL script without errors
- [x] See verification queries results
- [x] Create a community from the app
- [x] See the community in "My Communities"
- [x] See member count as 1
- [x] Other users see it in "Explore Communities"
- [x] Join/leave communities successfully
- [x] See real-time updates when communities are created

---

## 📞 Support

If you still get errors:

1. **Check Supabase logs**: Dashboard > Database > Logs
2. **Check browser console**: F12 > Console tab
3. **Verify authentication**: Make sure user is logged in
4. **Check RLS**: Make sure policies are enabled
5. **Re-run SQL script**: Safe to run multiple times

---

## 🎉 Next Steps

Once setup is complete:

1. ✅ Create your first community
2. ✅ Invite team members to test join/leave
3. ✅ Test real-time updates
4. ✅ Explore filtering and search
5. ✅ View community details page
6. ✅ Check member list updates

**Everything should work seamlessly!** 🚀
