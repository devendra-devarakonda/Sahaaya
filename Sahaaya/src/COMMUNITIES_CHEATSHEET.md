# 🎯 Communities Module - Quick Reference Cheatsheet

## ⚡ Quick Actions

### Got Error? → Fix It Now
```
Error: "creator_id does not exist"
→ Open: COMMUNITIES_QUICK_FIX.md
→ Copy quick fix script
→ Run in Supabase SQL Editor
→ Done! ✅
```

### First Time Setup
```
1. Open: CREATE_COMMUNITIES_TABLES.sql
2. Copy all contents
3. Paste in: Supabase > SQL Editor > New Query
4. Click: Run
5. Wait for: ✅ Setup complete message
```

### Test It Works
```
1. Login to app
2. Go to: Communities page
3. Click: Create Community
4. Fill form, submit
5. Should see: Success toast + community in list
```

---

## 📁 File Quick Reference

| Need This | Open This File |
|-----------|----------------|
| 🐛 Error fix | COMMUNITIES_QUICK_FIX.md |
| 📖 Setup guide | COMMUNITIES_SETUP_GUIDE.md |
| 🗺️ Navigation | COMMUNITIES_INDEX.md |
| 📚 Full docs | COMMUNITIES_MODULE_IMPLEMENTATION.md |
| 💾 SQL to run | CREATE_COMMUNITIES_TABLES.sql |
| 📋 Overview | COMMUNITIES_README.md (this folder) |

---

## 🔍 Common Commands

### Verify Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('communities', 'community_members');
```

### Check Your Communities
```sql
SELECT * FROM communities;
```

### Check Members
```sql
SELECT c.name, cm.user_id, cm.role 
FROM communities c
JOIN community_members cm ON c.id = cm.community_id;
```

### Check RLS Policies
```sql
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('communities', 'community_members');
```

---

## 🎨 UI Components Location

```
/components/Communities/
├── CommunityList.tsx          ← Main list page
├── CommunityCreationForm.tsx  ← Create form
└── CommunityDetails.tsx       ← Details page
```

---

## ⚙️ Backend Functions (supabaseService.ts)

```typescript
// Create & Read
createCommunity()           // Create new
getMyCommunities()          // Get joined
getExploreCommunities()     // Get unjoined
getAllCommunities()         // Get all
getCommunityById(id)        // Get one

// Update & Delete
updateCommunity(id, data)   // Update (creator only)
deleteCommunity(id)         // Delete (creator only)

// Members
joinCommunity(id)           // Join
leaveCommunity(id)          // Leave
getCommunityMembers(id)     // Get members
isUserMemberOfCommunity(id) // Check if member

// Real-time
subscribeToCommunities(callback)
subscribeToCommunityMembers(id, callback)
```

---

## 🗄️ Database Schema (Quick)

### communities
```
id, name, description, category, location
creator_id, is_verified, members_count
trust_rating, created_at, updated_at
```

### community_members
```
id, community_id, user_id, role
joined_at
UNIQUE(community_id, user_id)
```

---

## 🔐 Security Rules (RLS)

| Table | Action | Who Can Do It |
|-------|--------|---------------|
| communities | SELECT | Everyone |
| communities | INSERT | Authenticated users |
| communities | UPDATE | Creator only |
| communities | DELETE | Creator only |
| community_members | SELECT | Everyone |
| community_members | INSERT | Authenticated users |
| community_members | DELETE | Member themselves |

---

## ⚙️ Auto-Magic Features

```
✅ Creator auto-added as admin (trigger)
✅ Member count auto-updates (triggers)
✅ Real-time UI updates (subscriptions)
✅ Prevent duplicate joins (constraint)
✅ Cascade deletes (foreign keys)
```

---

## 🧪 Quick Test Commands

### Create Test Community (SQL)
```sql
INSERT INTO communities (name, description, category, location, creator_id)
VALUES (
  'Test Community',
  'This is a test community for testing',
  'medical',
  'Test City',
  (SELECT id FROM auth.users LIMIT 1)
);
```

### Check It Was Created
```sql
SELECT * FROM communities WHERE name = 'Test Community';
```

### Check Creator Is Admin
```sql
SELECT cm.role, c.name 
FROM community_members cm
JOIN communities c ON cm.community_id = c.id
WHERE c.name = 'Test Community';
-- Should show: role = 'admin'
```

---

## 🐛 Error Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| `creator_id does not exist` | Run updated SQL file |
| `permission denied` | Log in first |
| `duplicate key` | Already joined (expected) |
| `null value creator_id` | Make sure user is authenticated |
| Communities not showing | Check console, verify SQL ran |
| Real-time broken | Enable replication in Supabase |

---

## 📱 User Actions Flow

```
CREATE:  User → Form → Backend → DB → Auto-add as admin → Success
JOIN:    User → Click Join → DB Insert → Count +1 → Move to My → Toast
LEAVE:   User → Click Leave → Confirm → DB Delete → Count -1 → Move to Explore
VIEW:    User → Click View → Fetch Details → Show Page → Subscribe to Updates
SEARCH:  User → Type → Filter Client-Side → Show Results → Instant
```

---

## ✅ Deployment Checklist

```
□ SQL script run successfully
□ Tables exist (verify query)
□ RLS policies active
□ Triggers working
□ Can create community
□ Can join community
□ Can leave community
□ Real-time updates work
□ Search/filter work
□ No console errors
□ Mobile responsive
□ Toast notifications work
```

---

## 🎯 Key Numbers

```
2 tables
6 indexes
10 RLS policies
3 triggers
13 backend functions
3 React components
~450 lines SQL
~550 lines backend
~1,200 lines frontend
```

---

## 🚀 Performance Targets

```
Create:   < 500ms
Join:     < 300ms
Load:     < 1s
Search:   Instant (client-side)
Realtime: < 500ms propagation
```

---

## 📞 Quick Help

```
Got error?     → COMMUNITIES_QUICK_FIX.md
First setup?   → COMMUNITIES_SETUP_GUIDE.md
Need overview? → COMMUNITIES_README.md
Deep dive?     → COMMUNITIES_MODULE_IMPLEMENTATION.md
Navigation?    → COMMUNITIES_INDEX.md
```

---

## 🎉 Success Indicators

```
✅ SQL runs without errors
✅ See "Setup complete!" message
✅ Tables show in Supabase
✅ Can create community in app
✅ Community appears in list
✅ Can join/leave communities
✅ Real-time updates visible
✅ No console errors
```

---

**Print this page and keep it handy!** 📄

All details in: [COMMUNITIES_INDEX.md](COMMUNITIES_INDEX.md)
