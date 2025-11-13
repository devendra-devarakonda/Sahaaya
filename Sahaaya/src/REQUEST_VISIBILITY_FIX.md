# ✅ Help Request Visibility Fix - COMPLETE

## 🔴 Problem

Help requests were incorrectly hidden from all users as soon as one person offered help, causing:
- ❌ Matched requests disappearing from Browse Requests
- ❌ Only one person could offer help per request
- ❌ Requests becoming invisible before being marked as "Completed"

## 🎯 Required Behavior

| Status | Visibility | Can Offer Help | Notes |
|--------|-----------|----------------|-------|
| 🟡 **Pending** | ✅ Visible to ALL users | ✅ Yes | Initial state |
| 🟣 **Matched** | ✅ Visible to ALL users | ✅ Yes | After first offer |
| 🟢 **Completed** | ⚠️ Owner ONLY | ❌ No | After requester completes |

---

## ✅ Solutions Applied

### **Step 1: Fixed Browse Requests Query**

**File:** `/utils/supabaseService.ts`

**Before (❌ Wrong):**
```typescript
.eq('status', 'pending') // Only shows pending
```

**After (✅ Correct):**
```typescript
.in('status', ['pending', 'matched']) // Shows both pending AND matched
```

**Result:** Both pending and matched requests now appear in Browse Requests.

---

### **Step 2: Fixed RLS Visibility Rules**

**File:** `/supabase/migrations/008_fix_request_visibility.sql`

#### **Global Requests Policy:**

```sql
CREATE POLICY "View help requests with completion privacy"
ON public.help_requests FOR SELECT
USING (
  -- Show pending and matched requests to everyone
  status IN ('pending', 'matched')
  OR 
  -- Show completed requests only to the owner
  (status = 'completed' AND user_id = auth.uid())
);
```

#### **Community Requests Policy:**

```sql
CREATE POLICY "View community help requests with proper visibility"
ON public.community_help_requests FOR SELECT
USING (
  -- User must be a member OR community is public
  (member check OR public community check)
  AND (
    -- Show pending and matched requests to everyone in community
    status IN ('pending', 'matched')
    OR
    -- Show completed requests only to the owner
    (status = 'completed' AND user_id = auth.uid())
  )
);
```

**Result:** Database-level enforcement that matched requests stay visible.

---

### **Step 3: Verified No Auto-Hide Logic**

**Checked Files:**
- ✅ `/components/MatchingScreen.tsx` - No hiding logic
- ✅ `/utils/supabaseService.ts` - `createHelpOffer()` doesn't hide requests
- ✅ No `is_hidden`, `visible_to`, or `private` fields being set

**Result:** Requests only change status, never get hidden automatically.

---

### **Step 4: Multiple Helpers Allowed**

**File:** `/utils/supabaseService.ts` - `createHelpOffer()`

```typescript
// Check if user has already offered help on this request
const { data: existingOffer } = await supabase
  .from('help_offers')
  .select('id')
  .eq('request_id', offerData.request_id)
  .eq('helper_id', user.id)
  .single();

if (existingOffer) {
  return {
    success: false,
    error: 'You have already offered help on this request.'
  };
}
```

**Behavior:**
- ✅ Same user can't offer help twice on same request
- ✅ Different users CAN offer help on the same request
- ✅ No limit on number of helpers

**Result:** Multiple people can offer help on a single request.

---

### **Step 5: Completion Logic**

**File:** `/utils/supabaseService.ts` - `updateHelpRequest()`

**Only the requester can mark request as completed:**

```typescript
// First check if the user owns this request
if (existingRequest.user_id !== user.id) {
  return {
    success: false,
    error: 'You can only update your own requests'
  };
}

// Update the request
const { data, error } = await supabase
  .from('help_requests')
  .update({ status: 'completed' })
  .eq('id', requestId);
```

**Trigger on "Complete Help" Button:**
- Located in Dashboard (for matched requests)
- Located in All Requests page
- Only shown to request owner
- Only shown for matched requests

**Result:** Only requester can complete requests, hiding them from Browse.

---

## 🎉 Expected Behavior (After Fix)

### **Scenario 1: Fresh Request**

```
1. User A creates help request
   → Status: pending
   → Visible to: ALL users

2. User B offers help
   → Status: pending → matched
   → Visible to: ALL users (still visible!)
   → Supporters count: 1

3. User C can also offer help
   → Status: matched (no change)
   → Visible to: ALL users
   → Supporters count: 2
```

✅ Request stays visible in Browse Requests

---

### **Scenario 2: Request Completion**

```
1. User A (requester) clicks "Complete Help"
   → Status: matched → completed
   → Visible to: User A only
   → Hidden from: Browse Requests for all other users

2. User B, C can no longer see the request
   → Request removed from their Browse Requests view

3. User A can still see it in "My Requests"
   → Shows as "Completed" in dashboard
```

✅ Request only disappears after "Complete Help" is clicked

---

### **Scenario 3: Browse Requests View**

**Before Fix:**
```
Browse Requests
- Request 1 (pending)
- Request 2 (pending)

[User offers help on Request 1]

Browse Requests
- Request 2 (pending)  ❌ Request 1 disappeared!
```

**After Fix:**
```
Browse Requests
- Request 1 (pending)
- Request 2 (pending)

[User offers help on Request 1]

Browse Requests
- Request 1 (matched)   ✅ Still visible!
- Request 2 (pending)

[Request 1 owner clicks "Complete Help"]

Browse Requests
- Request 2 (pending)   ✅ Now it disappears!
```

---

## 📊 Status Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🟡 PENDING                                             │
│  ├─ Visible to: ALL users                              │
│  ├─ Can offer help: ✅ Yes                             │
│  └─ Appears in: Browse Requests                        │
│                                                         │
│           ↓ (First user offers help)                   │
│                                                         │
│  🟣 MATCHED                                             │
│  ├─ Visible to: ALL users                              │
│  ├─ Can offer help: ✅ Yes (additional helpers)        │
│  ├─ Appears in: Browse Requests                        │
│  └─ Shows "Complete Help" button to owner              │
│                                                         │
│           ↓ (Owner clicks "Complete Help")             │
│                                                         │
│  🟢 COMPLETED                                           │
│  ├─ Visible to: OWNER ONLY                             │
│  ├─ Can offer help: ❌ No                              │
│  ├─ Hidden from: Browse Requests                       │
│  └─ Appears in: Owner's dashboard only                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### **Test 1: Request Stays Visible After Offer**

- [ ] User A creates a help request
- [ ] Request appears in Browse Requests with status "Pending"
- [ ] User B offers help
- [ ] ✅ **Verify:** Request still appears in Browse Requests
- [ ] ✅ **Verify:** Status changed to "Matched"
- [ ] ✅ **Verify:** Supporters count increased by 1

---

### **Test 2: Multiple Users Can Offer Help**

- [ ] User B offers help on request
- [ ] Request status becomes "Matched"
- [ ] User C offers help on same request
- [ ] ✅ **Verify:** User C's offer is accepted
- [ ] ✅ **Verify:** Request still visible to all users
- [ ] ✅ **Verify:** Supporters count is now 2
- [ ] ✅ **Verify:** Both offers appear in requester's notifications

---

### **Test 3: Same User Cannot Offer Twice**

- [ ] User B offers help on request
- [ ] User B tries to offer help again on same request
- [ ] ✅ **Verify:** Error: "You have already offered help on this request"
- [ ] ✅ **Verify:** Supporters count does NOT increase

---

### **Test 4: Request Hidden After Completion**

- [ ] User A (requester) sees matched request in dashboard
- [ ] User A clicks "Complete Help" button
- [ ] Status changes to "Completed"
- [ ] ✅ **Verify:** Request disappears from Browse Requests for User B, C
- [ ] ✅ **Verify:** User A can still see it in "My Requests"
- [ ] ✅ **Verify:** Status shows "Completed" in dashboard

---

### **Test 5: Community Requests Follow Same Rules**

- [ ] User A posts community help request
- [ ] Request appears in community Browse Help
- [ ] User B (member) offers help
- [ ] ✅ **Verify:** Request still visible in community Browse Help
- [ ] User C (member) offers help
- [ ] ✅ **Verify:** Request still visible
- [ ] User A completes request
- [ ] ✅ **Verify:** Request hidden from Browse Help for others
- [ ] ✅ **Verify:** User A can still see it in dashboard

---

### **Test 6: RLS Enforcement**

**Using Supabase SQL Editor:**

```sql
-- As User B, try to query completed requests by User A
SELECT * FROM help_requests 
WHERE status = 'completed' AND user_id = '<user_a_id>';
-- ✅ Should return empty (not allowed)

-- As User B, try to query matched requests
SELECT * FROM help_requests 
WHERE status = 'matched';
-- ✅ Should return all matched requests (allowed)

-- As User A (owner), query their completed requests
SELECT * FROM help_requests 
WHERE status = 'completed' AND user_id = auth.uid();
-- ✅ Should return User A's completed requests (allowed)
```

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `/utils/supabaseService.ts` | Changed `.eq('status', 'pending')` to `.in('status', ['pending', 'matched'])` in `getBrowseRequests()` |
| `/supabase/migrations/008_fix_request_visibility.sql` | Updated RLS policies for `help_requests` and `community_help_requests` |

---

## 🔧 Database Migration Steps

### **Apply the Migration:**

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Open `/supabase/migrations/008_fix_request_visibility.sql`
4. Run the script
5. Verify policies were updated:

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('help_requests', 'community_help_requests');
```

Expected output:
```
help_requests | View help requests with completion privacy
community_help_requests | View community help requests with proper visibility
```

---

## 🐛 Debugging

### **If Matched Requests Still Not Visible:**

**Check 1: Verify Query**
```typescript
// In browser console
const { data } = await supabase
  .from('help_requests')
  .select('*')
  .in('status', ['pending', 'matched']);

console.log('Matched requests:', data.filter(r => r.status === 'matched'));
```

**Check 2: Verify RLS Policy**
```sql
-- In Supabase SQL Editor
SELECT * FROM pg_policies 
WHERE tablename = 'help_requests' 
AND policyname = 'View help requests with completion privacy';
```

Should show: `qual: ((status = ANY (ARRAY['pending'::text, 'matched'::text])) OR ...)`

**Check 3: Check Request Status**
```sql
SELECT id, title, status, user_id 
FROM help_requests 
ORDER BY created_at DESC 
LIMIT 10;
```

Verify requests have status 'matched' not 'completed'

---

### **If Completed Requests Still Visible to Others:**

**Check RLS Policy:**
```sql
SELECT qual FROM pg_policies 
WHERE tablename = 'help_requests' 
AND policyname = 'View help requests with completion privacy';
```

Should include: `... OR ((status = 'completed'::text) AND (user_id = auth.uid()))`

**Test with Different Users:**
```sql
-- Login as User B
SELECT * FROM help_requests WHERE status = 'completed';
-- Should only show User B's own completed requests

-- Should NOT show User A's completed requests
SELECT * FROM help_requests 
WHERE status = 'completed' AND user_id = '<user_a_id>';
-- Should return empty
```

---

## 🎯 Summary

### **Root Cause:**
Browse Requests query was only fetching `status = 'pending'`, excluding matched requests.

### **Solution:**
1. Changed query to fetch `status IN ('pending', 'matched')`
2. Updated RLS policies to enforce visibility rules at database level
3. Verified no auto-hide logic exists in code

### **Result:**
- ✅ Matched requests stay visible to all users
- ✅ Multiple users can offer help
- ✅ Only completed requests are hidden
- ✅ Requester controls when request disappears

---

**Status:** ✅ COMPLETE  
**Database Migration:** Required (run `008_fix_request_visibility.sql`)  
**Testing:** Ready  
**Risk:** Low (only changes visibility, not data)  

---

**Last Updated:** Now  
**Issue:** Requests hidden after first offer  
**Root Cause:** Query only fetching pending requests  
**Solution:** Fetch both pending AND matched requests  
**Files:** `/utils/supabaseService.ts`, `/supabase/migrations/008_fix_request_visibility.sql`
