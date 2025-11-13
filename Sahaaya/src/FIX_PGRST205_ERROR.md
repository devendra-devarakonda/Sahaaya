# Fix PGRST205 Error - Step-by-Step Guide

## 🚨 Error Description

**Error:** `PGRST205 — Could not find the table 'public.help_requests' in the schema cache`

**Cause:** The `help_requests` table doesn't exist in your Supabase database yet.

**Solution:** Run the SQL script to create the table with proper RLS policies.

---

## ✅ Solution (5 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your **Sahaaya** project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

### Step 2: Copy and Run the SQL Script

1. Open the file `/CREATE_HELP_REQUESTS_TABLE.sql` from this project
2. **Copy ALL the SQL code** (the entire file)
3. **Paste** it into the Supabase SQL Editor
4. Click **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)

**Expected Output:**
```
Success. No rows returned
```

### Step 3: Verify Table Creation

In the SQL Editor, run this verification query:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'help_requests'
) AS table_exists;
```

**Expected Result:** `table_exists: true`

### Step 4: Verify RLS Policies

Run this query:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'help_requests'
ORDER BY policyname;
```

**Expected Result:** You should see 5 policies:
- allow_browse_requests (SELECT)
- allow_my_requests (SELECT)
- Users can delete their own requests (DELETE)
- Users can insert their own help requests (INSERT)
- Users can update their own requests (UPDATE)

### Step 5: Enable Realtime (Important!)

1. In Supabase Dashboard, go to **Database** → **Replication** (left sidebar)
2. Find the `help_requests` table in the list
3. **Toggle the switch to ON** (it should turn green)
4. This enables real-time subscriptions

### Step 6: Test the Application

1. **Refresh your Sahaaya application** in the browser
2. **Log in** as an Individual user
3. Go to **"Request Help"** page
4. Fill out the form and **Submit**
5. Check **Dashboard → "My Requests"** - your request should appear
6. Go to **"Browse Requests"** - your own request should NOT appear here

### Step 7: Test with Two Users

**Browser Window 1 (User A):**
1. Log in as User A
2. Create a help request
3. Verify it appears in Dashboard → My Requests
4. Go to Browse Requests - should see 0 (your own doesn't show)

**Browser Window 2 (User B):**
1. Log in as User B (different account)
2. Go to Browse Requests
3. **You should see User A's request!** ✅
4. Create your own request
5. Check Browse - should NOT see your own request

**Browser Window 1 (User A again):**
1. Refresh Browse Requests
2. **You should now see User B's request!** ✅

---

## 🎉 Success Criteria

After completing these steps:

✅ No PGRST205 error  
✅ Can create help requests  
✅ Requests appear in "My Requests" section  
✅ Own requests do NOT appear in "Browse Requests"  
✅ Other users' requests DO appear in "Browse Requests"  
✅ Real-time updates work (new requests appear instantly)  

---

## 🔍 Verification Checklist

Run these checks to ensure everything is working:

### Check 1: Table Exists
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'help_requests';
```
**Expected:** Returns `help_requests`

### Check 2: RLS Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'help_requests';
```
**Expected:** `rowsecurity: true`

### Check 3: Policies Count
```sql
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'help_requests';
```
**Expected:** `policy_count: 5`

### Check 4: Indexes Created
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'help_requests';
```
**Expected:** 5+ indexes including `idx_help_requests_user_id`

### Check 5: Test Insert (Browser Console)
```javascript
// Open browser console (F12) and run:
const { data, error } = await supabase
  .from('help_requests')
  .select('count');

console.log('Connection test:', error ? 'FAILED' : 'SUCCESS');
```

---

## 🐛 Troubleshooting

### Problem: SQL script fails with "already exists" error

**Solution:**
```sql
-- Drop and recreate (WARNING: Deletes all data!)
DROP TABLE IF EXISTS public.help_requests CASCADE;
-- Then run the full CREATE_HELP_REQUESTS_TABLE.sql script again
```

### Problem: "Permission denied for schema public"

**Solution:**
```sql
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
```

### Problem: Still getting PGRST205 after creating table

**Solution:**
1. Wait 10-30 seconds for schema cache to refresh
2. Refresh your application in browser
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. If still failing, check Supabase Dashboard → Logs

### Problem: RLS policies not working

**Solution:**
```sql
-- Check if RLS is enabled
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'help_requests';
```

### Problem: Cannot insert records

**Solution:**
1. Make sure you're logged in (check `auth.uid()`)
2. Verify user role is 'individual'
3. Check browser console for specific error
4. Test in SQL Editor:
```sql
-- This should work if logged in
INSERT INTO help_requests (
  user_id, title, description, urgency, name, phone, city, category
) VALUES (
  auth.uid(),
  'Test Request',
  'This is a test',
  'medium',
  'Test User',
  '+91 9999999999',
  'Mumbai',
  'medical-&-healthcare'
);
```

### Problem: Real-time not working

**Solution:**
1. Go to Database → Replication
2. Make sure `help_requests` is enabled
3. Check that subscription code is in useEffect
4. Verify cleanup function exists

---

## 📊 Database Schema Reference

After running the script, your table will have:

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, auto-generated |
| user_id | UUID | NOT NULL, FK to auth.users |
| category | TEXT | NOT NULL |
| title | TEXT | NOT NULL |
| description | TEXT | NOT NULL |
| urgency | TEXT | NOT NULL, CHECK constraint |
| amount_needed | NUMERIC(10,2) | Optional |
| name | TEXT | NOT NULL |
| phone | TEXT | NOT NULL |
| address | TEXT | Optional |
| city | TEXT | Optional |
| state | TEXT | Optional |
| pincode | TEXT | Optional |
| full_location | TEXT | Optional |
| latitude | DOUBLE PRECISION | Optional |
| longitude | DOUBLE PRECISION | Optional |
| status | TEXT | DEFAULT 'pending', CHECK constraint |
| supporters | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMP WITH TZ | NOT NULL, auto |
| updated_at | TIMESTAMP WITH TZ | NOT NULL, auto |

---

## 🔒 RLS Policies Summary

After running the script, these policies will be active:

### Policy 1: INSERT
**Name:** "Users can insert their own help requests"  
**Rule:** `WITH CHECK (auth.uid() = user_id)`  
**Effect:** Users can only create requests with their own user_id

### Policy 2: SELECT (Own)
**Name:** "allow_my_requests"  
**Rule:** `USING (auth.uid() = user_id)`  
**Effect:** Users can view only their own requests (My Requests)

### Policy 3: SELECT (Others)
**Name:** "allow_browse_requests"  
**Rule:** `USING (auth.uid() != user_id)`  
**Effect:** Users can view all OTHER users' requests (Browse Requests)

### Policy 4: UPDATE
**Name:** "Users can update their own requests"  
**Rule:** `USING (auth.uid() = user_id)`  
**Effect:** Users can only update their own requests

### Policy 5: DELETE
**Name:** "Users can delete their own requests"  
**Rule:** `USING (auth.uid() = user_id)`  
**Effect:** Users can only delete their own requests

---

## 🎯 Quick Test Script

Run this in your browser console after creating the table:

```javascript
// Test 1: Create a request
const createTest = async () => {
  const { data, error } = await supabase
    .from('help_requests')
    .insert([{
      category: 'medical-&-healthcare',
      title: 'Test Request',
      description: 'Testing the system',
      urgency: 'medium',
      amount_needed: 5000,
      name: 'Test User',
      phone: '+91 9876543210',
      city: 'Mumbai'
    }])
    .select();
  
  console.log('Create test:', error ? '❌ FAILED' : '✅ SUCCESS');
  console.log('Data:', data);
  return data?.[0];
};

// Test 2: Get my requests
const getMyRequestsTest = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('help_requests')
    .select('*')
    .eq('user_id', user.id);
  
  console.log('My requests test:', error ? '❌ FAILED' : '✅ SUCCESS');
  console.log('My requests count:', data?.length);
};

// Test 3: Get browse requests
const getBrowseRequestsTest = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('help_requests')
    .select('*')
    .neq('user_id', user.id);
  
  console.log('Browse requests test:', error ? '❌ FAILED' : '✅ SUCCESS');
  console.log('Browse requests count:', data?.length);
};

// Run all tests
const runAllTests = async () => {
  console.log('🧪 Starting tests...\n');
  await createTest();
  await getMyRequestsTest();
  await getBrowseRequestsTest();
  console.log('\n✅ All tests complete!');
};

// Execute
runAllTests();
```

---

## 📞 Need More Help?

If you still have issues after following this guide:

1. **Check Supabase Logs**
   - Dashboard → Logs → Postgres Logs
   - Look for error messages

2. **Verify Authentication**
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Logged in as:', user?.email);
   console.log('User ID:', user?.id);
   console.log('Role:', user?.user_metadata?.role);
   ```

3. **Test Table Access Directly**
   - Go to Table Editor in Supabase
   - Try to view the `help_requests` table
   - Check if you can see the columns

4. **Review Complete Documentation**
   - `/SUPABASE_RLS_POLICIES.md` - Full policy details
   - `/BROWSE_REQUESTS_SETUP.md` - Complete setup guide
   - `/QUICK_REFERENCE_BACKEND.md` - Quick commands

---

## ✨ Summary

**What This Script Does:**
1. ✅ Creates `help_requests` table with all required columns
2. ✅ Adds automatic timestamp triggers
3. ✅ Creates performance indexes
4. ✅ Enables Row Level Security
5. ✅ Creates 5 RLS policies for data protection
6. ✅ Grants proper permissions to authenticated users

**After Running:**
- ✅ PGRST205 error will disappear
- ✅ You can create help requests
- ✅ My Requests will show only your requests
- ✅ Browse Requests will show only others' requests
- ✅ Real-time updates will work

---

**Last Updated:** November 2024  
**Version:** 1.0
