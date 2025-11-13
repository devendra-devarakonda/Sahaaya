# 🎯 Amount Field Mapping - Auto-Detected Schema

## ✅ Database Schema Detection Results

### Tables (Source of Truth)

**1. help_requests table:**
```sql
amount_needed NUMERIC(10,2)  -- ← Actual column name in database
```

**2. community_help_requests table:**
```sql
amount_needed NUMERIC(10,2)  -- ← Actual column name in database
```

### Views (Aliases)

**1. dashboard_my_requests view:**
```sql
SELECT hr.amount_needed AS amount  -- ← Aliased to 'amount'
FROM help_requests hr
```

**2. dashboard_my_contributions view:**
```sql
SELECT hr.amount_needed AS amount  -- ← Aliased to 'amount'  
FROM help_requests hr
JOIN help_offers ho ON...
```

## 📊 Correct Field Usage by Data Source

| Data Source | Table/View | Correct Field Name | Why |
|-------------|------------|-------------------|-----|
| **Browse Requests** | `help_requests` (table) | `amount_needed` | Direct table query |
| **My Requests** | `dashboard_my_requests` (view) | `amount` | View aliases it |
| **My Contributions** | `dashboard_my_contributions` (view) | `amount` | View aliases it |
| **Community Browse** | `community_help_requests` (table) | `amount_needed` | Direct table query |
| **Request Details** | Depends on source | `amount_needed` OR `amount` | Check source |

## 🔧 Frontend Component Mapping

### Components Using VIEWS (use `amount`)

| Component | Function Used | Data Source | Field Name |
|-----------|---------------|-------------|------------|
| **Dashboard** (My Requests) | `getMyRequests()` | `dashboard_my_requests` view | ✅ `amount` |
| **Dashboard** (My Contributions) | `getMyContributions()` | `dashboard_my_contributions` view | ✅ `amount` |
| **AllRequests** | `getMyRequests()` | `dashboard_my_requests` view | ✅ `amount` |
| **AllContributions** | `getMyContributions()` | `dashboard_my_contributions` view | ✅ `amount` |

### Components Using TABLES (use `amount_needed`)

| Component | Function Used | Data Source | Field Name |
|-----------|---------------|-------------|------------|
| **MatchingScreen** (Browse) | `getBrowseRequests()` | `help_requests` table | ✅ `amount_needed` |
| **CommunityBrowseHelp** | Direct query | `community_help_requests` table | ✅ `amount_needed` |
| **Request Forms** | Insert operations | `help_requests` / `community_help_requests` | ✅ `amount_needed` |

### Special Cases

| Component | Data Source | Field Name | Notes |
|-----------|-------------|------------|-------|
| **CompleteHelpModal** | Passed from parent | Check parent source | If from view: `amount`, if from table: `amount_needed` |
| **Notifications** | Custom query | Check query | Usually passes `amount_needed` |

## 🛠️ Service Query Mapping

### supabaseService.ts Functions

```typescript
// VIEWS - Returns 'amount'
getMyRequests() 
  → .from('dashboard_my_requests')
  → .select('amount')  // ← View alias
  → Use: request.amount

getMyContributions()
  → .from('dashboard_my_contributions')
  → .select('amount')  // ← View alias
  → Use: contribution.amount

// TABLES - Returns 'amount_needed'
getBrowseRequests()
  → .from('help_requests')
  → .select('*')  // ← Includes amount_needed
  → Use: request.amount_needed

getCommunityBrowseRequests()
  → .from('community_help_requests')
  → .select('*')  // ← Includes amount_needed
  → Use: request.amount_needed
```

## ✅ Correct Implementation Examples

### Dashboard Component (Uses View)
```typescript
// ✅ CORRECT - Data from dashboard_my_requests view
<span>₹{Math.round(request.amount || 0).toLocaleString()}</span>
```

### MatchingScreen Component (Uses Table)
```typescript
// ✅ CORRECT - Data from help_requests table
amount: request.amount_needed
  ? `₹${Math.round(request.amount_needed).toLocaleString()}` 
  : null
```

### CommunityBrowseHelp Component (Uses Table)
```typescript
// ✅ CORRECT - Data from community_help_requests table
<p>₹{Math.round(request.amount_needed).toLocaleString()}</p>
```

## 🔍 How to Determine Which Field to Use

### Step 1: Check the data source

```typescript
// Is it from a view?
.from('dashboard_my_requests')  → Use `amount`
.from('dashboard_my_contributions')  → Use `amount`

// Is it from a table?
.from('help_requests')  → Use `amount_needed`
.from('community_help_requests')  → Use `amount_needed`
```

### Step 2: Check the query

```typescript
// If select includes specific columns
.select('id, title, amount, ...')  → View, use `amount`
.select('id, title, amount_needed, ...')  → Table, use `amount_needed`

// If select is *
.select('*')  → Check the FROM table/view name
```

### Step 3: Console log the data

```typescript
console.log('Request data:', request);
// Check which field exists:
// - If has 'amount' but not 'amount_needed' → from view
// - If has 'amount_needed' → from table
```

## 🚨 Common Mistakes to Avoid

### Mistake #1: Using Wrong Field for Data Source
```typescript
// ❌ WRONG - Dashboard uses view, should be 'amount'
<span>₹{request.amount_needed}</span>  // Shows 0 or undefined

// ✅ CORRECT
<span>₹{request.amount}</span>
```

### Mistake #2: Using Wrong Field for Browse Requests
```typescript
// ❌ WRONG - Browse uses table, should be 'amount_needed'
<span>₹{request.amount}</span>  // Shows 0 or undefined

// ✅ CORRECT
<span>₹{request.amount_needed}</span>
```

### Mistake #3: Assuming All Sources Use Same Field
```typescript
// ❌ WRONG - Don't assume
const displayAmount = request.amount;  // May be undefined

// ✅ CORRECT - Use appropriate field based on source
const displayAmount = request.amount || request.amount_needed || 0;
// OR better: Know your source and use the right field
```

## 📝 Quick Reference Card

**Copy this for quick reference:**

```
DATA FROM VIEW? → Use .amount
DATA FROM TABLE? → Use .amount_needed

dashboard_my_requests → .amount ✅
dashboard_my_contributions → .amount ✅
help_requests → .amount_needed ✅
community_help_requests → .amount_needed ✅
```

## 🧪 Testing Checklist

After fixing components:

- [ ] Dashboard My Requests shows amounts (from view)
- [ ] Dashboard My Contributions shows amounts (from view)
- [ ] Browse Requests shows amounts (from table)
- [ ] Community Browse shows amounts (from table)
- [ ] All Requests page shows amounts (from view)
- [ ] All Contributions page shows amounts (from view)
- [ ] Complete modal shows amounts (check source)
- [ ] All amounts are > 0 (no zeros)
- [ ] All amounts match database values

## 💡 Pro Tips

1. **When in doubt, check the service function:**
   - Look at the `.from()` clause
   - View = `amount`, Table = `amount_needed`

2. **Use fallback chain for safety:**
   ```typescript
   request.amount || request.amount_needed || 0
   ```

3. **Add console logs during development:**
   ```typescript
   console.log('Data source:', request);
   console.log('Amount value:', request.amount || request.amount_needed);
   ```

4. **TypeScript helps:**
   ```typescript
   interface RequestFromView {
     amount: number;  // From view
   }
   
   interface RequestFromTable {
     amount_needed: number;  // From table
   }
   ```

---

**Last Updated:** Now
**Schema Verified:** ✅ Yes
**Migration Status:** Views correctly alias `amount_needed AS amount`
