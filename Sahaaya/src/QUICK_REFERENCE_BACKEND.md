# Quick Reference - Browse Requests Backend

## 🚀 Quick Start (5 Minutes)

### 1. Create Database Table
```sql
-- Copy from SUPABASE_RLS_POLICIES.md and run in Supabase SQL Editor
CREATE TABLE help_requests (...);
```

### 2. Enable RLS & Policies
```sql
-- Run all 5 policy statements from SUPABASE_RLS_POLICIES.md
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert..." ...
```

### 3. Enable Realtime
- Dashboard → Database → Replication → Toggle ON for `help_requests`

### 4. Test
- Create a request as User A
- Log in as User B → Browse Requests → See User A's request ✅

---

## 📁 File Quick Reference

### New Files
| File | Purpose |
|------|---------|
| `/utils/supabaseService.ts` | All database operations |
| `/SUPABASE_RLS_POLICIES.md` | RLS setup instructions |
| `/BROWSE_REQUESTS_SETUP.md` | Complete setup guide |
| `/BACKEND_INTEGRATION_SUMMARY.md` | Implementation overview |

### Modified Files
| File | Changes |
|------|---------|
| `/components/HelpRequestForm.tsx` | Now saves to Supabase |
| `/components/Dashboard.tsx` | Loads from Supabase + realtime |
| `/components/MatchingScreen.tsx` | Browse requests from Supabase |

---

## 🔑 Key Functions

### Create Request
```typescript
import { createHelpRequest } from '../utils/supabaseService';

const result = await createHelpRequest({
  category: 'medical',
  title: 'Need help',
  description: 'Details...',
  urgency: 'high',
  // ... other fields
});
```

### Get My Requests
```typescript
import { getMyRequests } from '../utils/supabaseService';

const { data, error } = await getMyRequests();
// Returns only current user's requests
```

### Get Browse Requests
```typescript
import { getBrowseRequests } from '../utils/supabaseService';

const { data, error } = await getBrowseRequests();
// Returns ALL other users' requests (not own)
```

### Real-time Subscription
```typescript
import { subscribeToBrowseRequests, unsubscribeChannel } from '../utils/supabaseService';

const subscription = subscribeToBrowseRequests(
  (newRequest) => {
    console.log('New request:', newRequest);
    // Update UI
  }
);

// Cleanup
return () => unsubscribeChannel(subscription);
```

---

## 🗄️ Database Quick Reference

### Table: `help_requests`

**Key Columns:**
- `id` - UUID (auto)
- `user_id` - UUID (auto from auth.uid())
- `title` - Text
- `description` - Text
- `urgency` - 'low' | 'medium' | 'high' | 'critical'
- `status` - 'pending' | 'matched' | 'in_progress' | 'completed'
- `amount_needed` - Numeric
- `created_at` - Timestamp (auto)

**Indexes:**
- `user_id`, `status`, `urgency`, `created_at`, `category`

---

## 🔒 RLS Policies Summary

```sql
-- 1. INSERT: Only own requests
WITH CHECK (auth.uid() = user_id)

-- 2. SELECT OWN: View own requests
USING (auth.uid() = user_id)

-- 3. SELECT OTHERS: View others' requests
USING (auth.uid() != user_id)

-- 4. UPDATE: Only own requests
USING (auth.uid() = user_id)

-- 5. DELETE: Only own requests
USING (auth.uid() = user_id)
```

---

## 🔄 Data Flow Cheat Sheet

### Creating Request
```
User fills form
  → HelpRequestForm.tsx
  → supabase.from('help_requests').insert()
  → RLS checks user_id = auth.uid()
  → Saved to database
  → Real-time event broadcast
  → Other users see it instantly
```

### Viewing My Requests
```
Dashboard loads
  → getMyRequests()
  → SELECT * WHERE user_id = auth.uid()
  → RLS allows (own data)
  → Returns user's requests only
```

### Viewing Browse Requests
```
MatchingScreen loads
  → getBrowseRequests()
  → SELECT * WHERE user_id != auth.uid()
  → RLS allows (others' data)
  → Returns all other users' requests
```

---

## 🧪 Quick Test Commands

### Test in Supabase SQL Editor
```sql
-- Should return only YOUR requests
SELECT * FROM help_requests WHERE user_id = auth.uid();

-- Should return all OTHER users' requests
SELECT * FROM help_requests WHERE user_id != auth.uid();

-- Should FAIL (RLS violation)
INSERT INTO help_requests (user_id, title, ...) 
VALUES ('fake-id', 'Test', ...);
```

### Test in Browser Console
```javascript
// Get current user
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user.id);

// Get my requests
const { data: mine } = await supabase
  .from('help_requests')
  .select('*')
  .eq('user_id', user.id);
console.log('My requests:', mine.length);

// Get browse requests
const { data: browse } = await supabase
  .from('help_requests')
  .select('*')
  .neq('user_id', user.id);
console.log('Browse requests:', browse.length);
```

---

## ⚡ Common Tasks

### Task: Add a new help request field

1. **Update Database:**
```sql
ALTER TABLE help_requests ADD COLUMN new_field TEXT;
```

2. **Update Interface:**
```typescript
// In /utils/supabaseService.ts
export interface HelpRequest {
  // ... existing fields
  new_field?: string;
}
```

3. **Update Form:**
```typescript
// In /components/HelpRequestForm.tsx
const [formData, setFormData] = useState({
  // ... existing fields
  newField: ''
});
```

---

### Task: Change urgency levels

1. **Update Check Constraint:**
```sql
ALTER TABLE help_requests DROP CONSTRAINT IF EXISTS help_requests_urgency_check;
ALTER TABLE help_requests ADD CONSTRAINT help_requests_urgency_check 
CHECK (urgency IN ('low', 'medium', 'high', 'critical', 'emergency'));
```

2. **Update Interface:**
```typescript
// Update forms and configs with new levels
```

---

### Task: Add pagination

```typescript
// In /utils/supabaseService.ts
export async function getBrowseRequests(page = 1, limit = 10) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error, count } = await supabase
    .from('help_requests')
    .select('*', { count: 'exact' })
    .neq('user_id', user.id)
    .range((page - 1) * limit, page * limit - 1)
    .order('created_at', { ascending: false });
  
  return { data, error, count };
}
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Policy violated" | Check RLS policies created correctly |
| Own requests in Browse | Check query uses `.neq()` not `.eq()` |
| No real-time updates | Enable Replication in Supabase |
| Requests not saving | Verify user has 'individual' role |
| Empty Browse page | Create test request with another user |

---

## 📊 Performance Tips

### Optimize Queries
```typescript
// Good: Select only needed fields
.select('id, title, urgency, created_at')

// Good: Use indexes
.eq('status', 'pending')  // status is indexed

// Good: Limit results
.limit(50)
```

### Real-time Optimization
```typescript
// Unsubscribe when component unmounts
useEffect(() => {
  const sub = subscribe(...);
  return () => unsubscribe(sub);
}, []);

// Filter on server, not client
.filter('status', 'eq', 'pending')
```

---

## 🔐 Security Checklist

- [x] RLS enabled on table
- [x] All 5 policies created
- [x] user_id auto-set from auth.uid()
- [x] No user_id spoofing possible
- [x] Role validation in place
- [x] Input validation on forms
- [x] SQL injection prevented (Supabase client)

---

## 🎯 Expected Behavior

### ✅ Should Work
- User A creates request → appears in User A's "My Requests"
- User B sees User A's request in "Browse Requests"
- Real-time: User B instantly sees when User A creates new request
- User A does NOT see own requests in Browse
- Can update/delete only own requests

### ❌ Should NOT Work
- User A cannot see User A's requests in Browse
- User A cannot delete User B's requests
- Unauthenticated users see nothing
- NGO users cannot create help requests
- Cannot spoof user_id in INSERT

---

## 📚 Where to Find More

| Need | See |
|------|-----|
| Step-by-step setup | `BROWSE_REQUESTS_SETUP.md` |
| Complete RLS policies | `SUPABASE_RLS_POLICIES.md` |
| Implementation details | `BACKEND_INTEGRATION_SUMMARY.md` |
| Architecture diagrams | `SYSTEM_ARCHITECTURE.md` |
| Full checklist | `IMPLEMENTATION_CHECKLIST.md` |

---

## 🆘 Emergency Quick Fixes

### Reset RLS Policies
```sql
-- Drop all policies
DROP POLICY IF EXISTS "Users can insert their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON help_requests;
DROP POLICY IF EXISTS "Users can browse other users requests" ON help_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON help_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON help_requests;

-- Then recreate from SUPABASE_RLS_POLICIES.md
```

### Clear Local State
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Check Connection
```javascript
// Test Supabase connection
const { data, error } = await supabase.from('help_requests').select('count');
console.log('Connection:', error ? 'Failed' : 'OK');
```

---

## 💡 Pro Tips

1. **Always test with 2+ users** - Create multiple test accounts
2. **Check browser console** - Errors appear there first
3. **Use Supabase logs** - Dashboard → Logs → Postgres Logs
4. **Test real-time separately** - Ensure it works before integrating
5. **Backup before changes** - Export database before major changes

---

**Last Updated:** November 2024  
**Quick Reference Version:** 1.0
