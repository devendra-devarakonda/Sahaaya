# Browse Requests Backend Setup Guide

## 🎯 Overview

This guide will help you set up the complete backend integration for the Browse Requests functionality using Supabase. After following these steps, your platform will:

✅ Store help requests in Supabase database  
✅ Show users only their own requests in "My Requests"  
✅ Show ALL other users' requests in "Browse Requests"  
✅ Provide real-time updates when new requests are created  
✅ Ensure data security with Row Level Security (RLS)

---

## 📋 Prerequisites

- [ ] Supabase project created and connected (see `START_HERE.md`)
- [ ] Supabase credentials configured in `/utils/supabase/info.tsx`
- [ ] Users can successfully register and log in

---

## 🚀 Setup Steps

### Step 1: Create the Database Table

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Sahaaya project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Table Creation SQL**

Copy and paste this SQL, then click **Run**:

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

**Expected Result:** ✅ Query executed successfully, table `help_requests` created

---

### Step 2: Enable Row Level Security (RLS)

1. **In the same SQL Editor**, create a new query with this SQL:

```sql
-- Enable Row Level Security
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can insert their own help requests
CREATE POLICY "Users can insert their own help requests"
ON public.help_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Policy 2: Users can view their own help requests
CREATE POLICY "Users can view their own requests"
ON public.help_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Policy 3: Users can browse OTHER users' requests
CREATE POLICY "Users can browse other users requests"
ON public.help_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() != user_id
);

-- Policy 4: Users can update their own requests
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

-- Policy 5: Users can delete their own requests
CREATE POLICY "Users can delete their own requests"
ON public.help_requests
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
);
```

2. **Click Run**

**Expected Result:** ✅ All 5 RLS policies created successfully

---

### Step 3: Enable Realtime

1. **In Supabase Dashboard**, go to:
   - **Database** → **Replication** (in left sidebar)

2. **Find `help_requests` table**
   - Toggle the switch to **ON** next to `help_requests`

3. **Verify**
   - The toggle should be green/enabled

**Expected Result:** ✅ Realtime enabled for `help_requests` table

---

### Step 4: Verify Policies in Dashboard

1. **Go to** Authentication → **Policies**
2. **Look for** `help_requests` table
3. **You should see 5 policies:**
   - ✅ Users can insert their own help requests
   - ✅ Users can view their own requests
   - ✅ Users can browse other users requests
   - ✅ Users can update their own requests
   - ✅ Users can delete their own requests

---

## 🧪 Testing the Integration

### Test 1: Create a Help Request

1. **Log in** as any user (Individual role)
2. **Go to** "Request Help" page
3. **Fill out the form** with test data
4. **Submit** the request

**Expected Behavior:**
- ✅ Success message appears
- ✅ Request is saved to Supabase
- ✅ You're redirected to Dashboard
- ✅ Request appears in "My Requests" section

**Verify in Supabase:**
- Go to Table Editor → `help_requests`
- You should see your request with `user_id` matching your auth user ID

---

### Test 2: Browse Requests from Another User

**Using Two Browser Sessions:**

**Session 1 (User A):**
1. Log in as User A
2. Create a help request
3. Note the request title

**Session 2 (User B):**
1. Log in as User B (different account)
2. Go to "Browse Requests" page
3. **Expected:** You should see User A's request
4. **Expected:** You should NOT see any of User B's own requests

---

### Test 3: Real-time Updates

**Keep both browser sessions open:**

**Session 1 (User A):**
1. Go to "Browse Requests"
2. Keep the page open

**Session 2 (User B):**
1. Create a new help request
2. Submit it

**Session 1 (User A) - Expected Behavior:**
- ✅ A toast notification appears saying "New request available"
- ✅ User B's request appears at the top of the list automatically
- ✅ No page refresh needed

---

### Test 4: Dashboard My Requests

1. **Create 2-3 help requests** as the logged-in user
2. **Go to Dashboard**
3. **Check "My Requests" section**

**Expected Behavior:**
- ✅ All YOUR requests appear
- ✅ Sorted by newest first
- ✅ Shows correct status, amount, urgency
- ✅ Updates in real-time if you create a new one

---

## 📊 Query Breakdown

### My Requests Query (Dashboard)
```typescript
const { data } = await supabase
  .from('help_requests')
  .select('*')
  .eq('user_id', user.id)  // Only current user's requests
  .order('created_at', { ascending: false });
```

### Browse Requests Query (Matching Screen)
```typescript
const { data } = await supabase
  .from('help_requests')
  .select('*')
  .neq('user_id', user.id)  // Exclude current user's requests
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
```

---

## 🔧 Troubleshooting

### Problem: "Row level security policy violated"

**Cause:** RLS policies not set up correctly or user not authenticated

**Solution:**
1. Verify all 5 RLS policies are created (check Authentication → Policies)
2. Make sure user is logged in
3. Check browser console for auth errors
4. Try running this in SQL Editor to test:
   ```sql
   SELECT * FROM help_requests WHERE user_id = auth.uid();
   ```

---

### Problem: See my own requests in Browse Requests

**Cause:** The `.neq()` filter might not be working or RLS policy is wrong

**Solution:**
1. Check that the "Users can browse other users requests" policy has:
   ```sql
   USING (auth.uid() != user_id)
   ```
   Note: It's `!=` not `=`

2. Verify the query in `/components/MatchingScreen.tsx` uses:
   ```typescript
   .neq('user_id', user.id)
   ```

---

### Problem: Browse Requests page is empty

**Cause:** No other users have created requests yet, or RLS blocking

**Solution:**
1. Create a second test account
2. Log in with second account
3. Create a help request
4. Log back in with first account
5. Check Browse Requests page

**Test in SQL Editor:**
```sql
-- This should return requests from OTHER users
SELECT * FROM help_requests WHERE user_id != auth.uid();
```

---

### Problem: Real-time updates not working

**Cause:** Realtime not enabled on table

**Solution:**
1. Go to Database → Replication
2. Enable replication for `help_requests` table
3. Refresh your application
4. Test again

---

### Problem: Cannot create requests

**Cause:** Wrong user role or RLS policy blocking

**Solution:**
1. Check user role in `user_metadata`:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User role:', user?.user_metadata?.role);
   ```
2. Must be 'individual' role to create requests
3. NGO users should create campaigns instead

---

## ✅ Verification Checklist

After completing setup, verify:

- [ ] `help_requests` table exists in Supabase
- [ ] RLS is enabled (5 policies visible in dashboard)
- [ ] Realtime is enabled for the table
- [ ] Can create a help request (appears in My Requests)
- [ ] Created request does NOT appear in own Browse Requests
- [ ] Other users can see the request in their Browse Requests
- [ ] Real-time notifications work when another user creates a request
- [ ] Dashboard shows correct data in My Requests section
- [ ] No console errors related to Supabase

---

## 📱 Expected User Flow

### Scenario: User A needs medical help

1. **User A** logs in → Goes to "Request Help" → Fills form → Submits
2. Request appears in **User A's Dashboard → My Requests**
3. Request does NOT appear in **User A's Browse Requests**

### Scenario: User B wants to help

1. **User B** logs in → Goes to "Browse Requests"
2. Sees **User A's request** in the list
3. Clicks "Offer Help" → Sees contact details
4. **User B** creates own request → It appears in their My Requests
5. **User A** immediately sees **User B's request** in Browse (real-time!)

---

## 🎉 Success!

If all tests pass, your Browse Requests backend is fully functional with:

✅ **User Separation:** My requests vs Browse requests properly separated  
✅ **Real-time Updates:** New requests appear instantly  
✅ **Data Security:** RLS policies protect user data  
✅ **Scalability:** Database-backed with proper indexes  

---

## 📚 Additional Resources

- **Full RLS Policies Documentation:** See `SUPABASE_RLS_POLICIES.md`
- **Supabase Service Functions:** See `/utils/supabaseService.ts`
- **Supabase Docs:** https://supabase.com/docs

---

## 🆘 Still Having Issues?

1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Check browser console for errors
3. Verify Supabase credentials in `/utils/supabase/info.tsx`
4. Make sure you're using latest code with updated files:
   - `/utils/supabaseService.ts` (new file)
   - `/components/HelpRequestForm.tsx` (updated)
   - `/components/Dashboard.tsx` (updated)
   - `/components/MatchingScreen.tsx` (updated)

---

**Last Updated:** November 2024  
**Version:** 1.0
