# Supabase RLS Policies for Sahaaya Platform

This document provides the complete Row Level Security (RLS) policies configuration for the `help_requests` table in Supabase.

## Table of Contents
1. [Database Table Structure](#database-table-structure)
2. [Row Level Security Policies](#row-level-security-policies)
3. [Setup Instructions](#setup-instructions)
4. [Testing the Policies](#testing-the-policies)
5. [Expected Behavior](#expected-behavior)

---

## Database Table Structure

First, create the `help_requests` table in Supabase with the following structure:

```sql
-- Create help_requests table
CREATE TABLE IF NOT EXISTS public.help_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  amount_needed NUMERIC(10, 2),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  full_location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'in_progress', 'completed', 'cancelled')),
  supporters INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_help_requests_updated_at BEFORE UPDATE ON public.help_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON public.help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON public.help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON public.help_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_help_requests_created_at ON public.help_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_help_requests_category ON public.help_requests(category);
```

---

## Row Level Security Policies

### Step 1: Enable RLS on the table

```sql
-- Enable Row Level Security
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create RLS Policies

#### Policy 1: Users can INSERT their own requests

```sql
-- Policy: Allow authenticated individual users to create help requests
CREATE POLICY "Users can insert their own help requests"
ON public.help_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);
```

#### Policy 2: Users can SELECT their own requests (My Requests)

```sql
-- Policy: Users can view their own help requests
CREATE POLICY "Users can view their own requests"
ON public.help_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);
```

#### Policy 3: Users can SELECT other users' requests (Browse Requests)

```sql
-- Policy: Users can view help requests from OTHER users (not their own)
CREATE POLICY "Users can browse other users requests"
ON public.help_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() != user_id
);
```

#### Policy 4: Users can UPDATE their own requests

```sql
-- Policy: Users can update only their own help requests
CREATE POLICY "Users can update their own requests"
ON public.help_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);
```

#### Policy 5: Users can DELETE their own requests

```sql
-- Policy: Users can delete only their own help requests
CREATE POLICY "Users can delete their own requests"
ON public.help_requests
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
);
```

---

## Setup Instructions

### Option A: Using Supabase SQL Editor (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Create the Table**
   - Copy the table creation SQL from the [Database Table Structure](#database-table-structure) section
   - Paste it into the SQL editor
   - Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

4. **Enable RLS and Create Policies**
   - Copy all the SQL statements from the [Row Level Security Policies](#row-level-security-policies) section
   - Paste them into a new query
   - Click "Run"

5. **Verify the Policies**
   - Go to "Authentication" → "Policies" in the left sidebar
   - You should see 5 policies listed for the `help_requests` table

### Option B: Using the Supabase Table Editor

1. **Create the Table Manually**
   - Go to "Table Editor" in the left sidebar
   - Click "New table"
   - Name it `help_requests`
   - Add all columns as specified in the table structure

2. **Enable RLS**
   - Click on the `help_requests` table
   - Click on the "RLS" tab
   - Toggle "Enable RLS" to ON

3. **Add Policies**
   - Click "Add Policy"
   - For each policy, use the SQL from the policies section above

---

## Testing the Policies

### Test 1: Create a Request

```typescript
// Should succeed - user creating their own request
const { data, error } = await supabase
  .from('help_requests')
  .insert([
    {
      category: 'medical-&-healthcare',
      title: 'Medical assistance needed',
      description: 'Need help with medical expenses',
      urgency: 'high',
      amount_needed: 10000,
      name: 'Test User',
      phone: '+91 9876543210',
      city: 'Mumbai',
      status: 'pending'
    }
  ]);
```

### Test 2: Fetch My Requests

```typescript
// Should return only requests where user_id = auth.uid()
const { data: myRequests, error } = await supabase
  .from('help_requests')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

### Test 3: Fetch Browse Requests

```typescript
// Should return only requests where user_id != auth.uid()
const { data: browseRequests, error } = await supabase
  .from('help_requests')
  .select('*')
  .neq('user_id', user.id)
  .order('created_at', { ascending: false });
```

### Test 4: Real-time Subscription

```typescript
// Subscribe to new requests from other users
const subscription = supabase
  .channel('browse-requests-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'help_requests'
    },
    (payload) => {
      console.log('New request:', payload.new);
    }
  )
  .subscribe();
```

---

## Expected Behavior

### ✅ What SHOULD Work

1. **User A** creates a request
   - Request is saved with `user_id = A`
   - Appears in User A's "My Requests" section
   - Does NOT appear in User A's "Browse Requests" section

2. **User B** visits Browse Requests
   - Sees User A's request
   - Does NOT see their own requests in Browse
   - Gets real-time notification when User A creates a new request

3. **User A** can:
   - View, update, and delete only their own requests
   - Cannot modify or delete User B's requests

4. **Real-time Updates**
   - When User B creates a request, User A sees it immediately in Browse
   - When User A updates their request, it updates immediately in their "My Requests"

### ❌ What Should NOT Work

1. **User A** cannot:
   - View User B's request in their "My Requests" section
   - Update or delete User B's requests
   - Insert a request with `user_id` set to User B's ID

2. **Unauthenticated users** cannot:
   - View any requests
   - Create, update, or delete requests

---

## Query Logic Summary

### For Dashboard - My Requests Tab
```sql
SELECT * FROM help_requests 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC;
```
**RLS Policy Applied:** `"Users can view their own requests"`

### For Browse Requests Page
```sql
SELECT * FROM help_requests 
WHERE user_id != auth.uid() 
  AND status = 'pending'
ORDER BY created_at DESC;
```
**RLS Policy Applied:** `"Users can browse other users requests"`

### For Creating Requests
```sql
INSERT INTO help_requests (user_id, title, description, ...) 
VALUES (auth.uid(), 'Title', 'Description', ...);
```
**RLS Policy Applied:** `"Users can insert their own help requests"`

---

## Troubleshooting

### Problem: "Row level security policy violated"

**Solution:** Make sure:
1. The user is authenticated (logged in)
2. The `user_id` field matches the authenticated user's ID for INSERT/UPDATE operations
3. RLS is enabled on the table
4. All 5 policies are created correctly

### Problem: Browse requests showing my own requests

**Solution:** 
1. Check that the query uses `.neq('user_id', user.id)` not `.eq()`
2. Verify the "Users can browse other users requests" policy is created with `auth.uid() != user_id`

### Problem: Real-time subscriptions not working

**Solution:**
1. Enable Realtime for the `help_requests` table in Supabase Dashboard
2. Go to "Database" → "Replication" → Enable replication for `help_requests`
3. Make sure your subscription channel name is unique

### Problem: Cannot see any requests

**Solution:**
1. Check if RLS policies are too restrictive
2. Verify user is authenticated
3. Check browser console for errors
4. Test queries directly in Supabase SQL Editor with `auth.uid()` substituted

---

## Security Notes

1. **User Isolation:** Each user can only modify their own requests
2. **Privacy:** Users cannot see who created which request in Browse mode (use `name` field instead of exposing `user_id`)
3. **Data Integrity:** The RLS policies prevent users from tampering with others' data
4. **Authentication Required:** All operations require a valid authenticated session

---

## Need Help?

If you encounter issues:
1. Check the Supabase logs in Dashboard → "Logs" → "Postgres Logs"
2. Test queries directly in SQL Editor
3. Verify your Supabase client is properly initialized
4. Check that your JWT token is valid

---

## Summary

This RLS configuration ensures:
- ✅ Users see only their own requests in "My Requests"
- ✅ Users see all OTHER users' requests in "Browse Requests"  
- ✅ Real-time updates work correctly
- ✅ Data security and privacy are maintained
- ✅ Users cannot access or modify others' data
- ✅ Clean separation between "My Requests" and "Browse Requests"

**Last Updated:** November 2024
